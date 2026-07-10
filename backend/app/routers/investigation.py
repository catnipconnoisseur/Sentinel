"""
Investigation API endpoint.

POST /api/investigate — Takes a machine_id and question, returns reasoning graph.

Architecture note:
  retrieve_evidence() and generate_reasoning_graph() are synchronous / CPU+IO bound.
  They must be run in a thread-pool executor so they don't block the asyncio event loop.
  Without this, a second request cannot be processed while Fireworks is in flight,
  causing the "stuck on Reasoning..." symptom for all subsequent investigations.
"""

import asyncio
import os
import time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import InvestigationRequest, InvestigationResult
from app.services.retriever import retrieve_evidence
from app.services.reasoner import generate_reasoning_graph

router = APIRouter(tags=["investigation"])

# Total wall-clock budget for one investigation (retrieve + reason × up to 2 attempts).
# Fireworks SDK timeout is 30s per attempt; 2 attempts = 60s, +15s headroom = 75s.
INVESTIGATION_TIMEOUT_SECONDS = 75


def _ts():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def _log_stage(trace_id: str, stage_num: int, stage_name: str, state: str, started_at: Optional[float] = None, extra: str = ""):
    duration = ""
    if started_at is not None:
        duration = f" duration={time.perf_counter() - started_at:.3f}s"
    suffix = f" {extra}" if extra else ""
    print(f"{_ts()} trace={trace_id} [{stage_num}] {stage_name} {state}{duration}{suffix}")


@router.post("/investigate", response_model=InvestigationResult)
async def investigate(request: InvestigationRequest, db: Session = Depends(get_db)):
    """
    Run an AI-powered investigation on a machine failure.

    Uses RAG to retrieve structural and unstructured evidence, then
    calls Fireworks AI to generate the structured reasoning graph.

    Both blocking operations (retrieve_evidence, generate_reasoning_graph)
    are dispatched to a thread-pool executor so the asyncio event loop
    remains free to handle additional HTTP requests while Fireworks responds.
    """
    trace_id = f"inv-{int(time.time() * 1000)}-{request.machine_id}"
    request_started_at = time.perf_counter()
    _log_stage(trace_id, 1, "Investigation request received", "start", request_started_at, f"machine_id={request.machine_id}")

    api_key = os.environ.get("FIREWORKS_API_KEY")
    if not api_key or api_key == "your_key_here":
        _log_stage(trace_id, 1, "Investigation request received", "failure", request_started_at, "reason=missing_fireworks_api_key")
        raise HTTPException(status_code=500, detail="FIREWORKS_API_KEY is not set.")

    _log_stage(trace_id, 1, "Investigation request received", "success", request_started_at, f"question={request.question!r}")

    loop = asyncio.get_event_loop()

    try:
        async def _run_pipeline():
            # 1. Retrieve evidence context (SQLite + ChromaDB) — blocking, run in thread pool
            stage_started_at = time.perf_counter()
            _log_stage(trace_id, 2, "Evidence retrieval", "start", stage_started_at)
            context = await loop.run_in_executor(
                None,
                lambda: retrieve_evidence(db, request.machine_id, request.question, trace_id=trace_id),
            )
            _log_stage(trace_id, 2, "Evidence retrieval", "success", stage_started_at, f"context_chars={len(context)}")

            # 2. Call Fireworks AI with a 1-retry fallback for transient network issues
            stage_started_at = time.perf_counter()
            _log_stage(trace_id, 3, "Reasoning graph generation", "start", stage_started_at)
            
            max_attempts = 2
            for attempt in range(1, max_attempts + 1):
                try:
                    result = await loop.run_in_executor(
                        None,
                        lambda: generate_reasoning_graph(context, request.question, trace_id=trace_id),
                    )
                    break
                except (TimeoutError, ConnectionError) as e:
                    if attempt < max_attempts:
                        print(
                            f"{_ts()} trace={trace_id} [RETRY] Fireworks call attempt {attempt} failed: {e}. "
                            "Retrying next attempt in 2 seconds..."
                        )
                        await asyncio.sleep(2.0)
                        continue
                    else:
                        raise

            _log_stage(trace_id, 3, "Reasoning graph generation", "success", stage_started_at, f"nodes={len(result.nodes)} edges={len(result.edges)}")
            return result

        result = await asyncio.wait_for(_run_pipeline(), timeout=INVESTIGATION_TIMEOUT_SECONDS)

    except asyncio.TimeoutError:
        elapsed = time.perf_counter() - request_started_at
        print(
            f"{_ts()} trace={trace_id} [TIMEOUT] Investigation exceeded {INVESTIGATION_TIMEOUT_SECONDS}s budget "
            f"elapsed={elapsed:.3f}s machine_id={request.machine_id}"
        )
        raise HTTPException(
            status_code=504,
            detail=(
                f"The investigation timed out after {INVESTIGATION_TIMEOUT_SECONDS} seconds. "
                "Fireworks AI may be slow or unavailable. Please retry."
            ),
        )
    except TimeoutError as e:
        # Re-raised from generate_reasoning_graph when Fireworks SDK times out
        print(f"{_ts()} trace={trace_id} [TIMEOUT] Fireworks SDK timeout error={e}")
        raise HTTPException(status_code=504, detail=str(e))
    except ConnectionError as e:
        print(f"{_ts()} trace={trace_id} [CONNECTION] Fireworks connection error error={e}")
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        print(f"{_ts()} trace={trace_id} [PARSE_ERROR] error={e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        elapsed = time.perf_counter() - request_started_at
        print(f"{_ts()} trace={trace_id} [ERROR] Unexpected error elapsed={elapsed:.3f}s error={e}")
        raise HTTPException(status_code=500, detail=str(e))

    elapsed = time.perf_counter() - request_started_at
    _log_stage(trace_id, 4, "Backend response", "success", request_started_at,
               f"status=200 total_duration={elapsed:.3f}s nodes={len(result.nodes)} edges={len(result.edges)}")
    return result
