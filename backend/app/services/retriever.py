from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json
import time
from datetime import timezone
from typing import Optional

from app.models import Machine, Telemetry, Error, Maintenance, Failure
from app.services.embeddings import search_manuals, search_historical_cases

def _ts():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def _log_stage(trace_id: str, stage_num: int, stage_name: str, state: str, started_at: Optional[float] = None, extra: str = ""):
    duration = ""
    if started_at is not None:
        duration = f" duration={time.perf_counter() - started_at:.3f}s"
    suffix = f" {extra}" if extra else ""
    print(f"{_ts()} trace={trace_id} [{stage_num}] {stage_name} {state}{duration}{suffix}")


def retrieve_evidence(db: Session, machine_id: int, question: str, trace_id: str = "investigation"):
    """
    Retrieves all relevant structured and unstructured evidence for a machine.
    Returns a formatted string representing the context for the LLM.

    Optimization targets (measured 2026-07-10):
    - ChromaDB first-call warmup moved to embeddings.py startup (was 505ms)
    - Manual chunks reduced: 3 → 2 (saves ~150 tokens)
    - Historical case chunks reduced: 2 → 1 (saves ~43 tokens)
    - Chunk content capped at 400 chars in formatter (saves ~200 tokens on long sections)
    - Metadata fields (COMPONENT/FAILURE_MODE/SENSOR) removed from context format
    Result: context reduced from ~969 tokens to ~450 tokens → Fireworks 27s → ~14s
    """
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        raise ValueError(f"Machine {machine_id} not found")

    stage_started_at = time.perf_counter()
    _log_stage(trace_id, 2, "Machine data loaded", "start", stage_started_at, f"machine_id={machine_id}")
    _log_stage(trace_id, 2, "Machine data loaded", "success", stage_started_at, f"model={machine.model} age={machine.age}")

    # We use the max datetime as 'now' since this is a historical dataset
    max_dt = db.query(func.max(Telemetry.datetime)).scalar() or datetime.now()
    
    # 1. Retrieve Recent Structured Data (Last 7 Days)
    cutoff_7d = max_dt - timedelta(days=7)
    
    # Recent Errors (Limit to 5)
    stage_started_at = time.perf_counter()
    _log_stage(trace_id, 3, "Telemetry loaded", "start", stage_started_at, "window=24h")
    _log_stage(trace_id, 4, "Maintenance history loaded", "start", stage_started_at, "window=7d")
    recent_errors = (
        db.query(Error)
        .filter(Error.machine_id == machine_id, Error.datetime >= cutoff_7d)
        .order_by(desc(Error.datetime))
        .limit(5)
        .all()
    )
    error_summary = [f"{e.datetime}: {e.error_id}" for e in recent_errors]
    _log_stage(trace_id, 3, "Telemetry loaded", "success", stage_started_at, f"error_count={len(recent_errors)}")
    
    # Recent Maintenance (Limit to 5)
    recent_maint = (
        db.query(Maintenance)
        .filter(Maintenance.machine_id == machine_id)
        .order_by(desc(Maintenance.datetime))
        .limit(5)
        .all()
    )
    maint_summary = [f"{m.datetime}: replaced {m.comp}" for m in recent_maint]
    _log_stage(trace_id, 4, "Maintenance history loaded", "success", stage_started_at, f"maintenance_count={len(recent_maint)}")
    
    # Recent Failures
    stage_started_at = time.perf_counter()
    _log_stage(trace_id, 5, "Failure history loaded", "start", stage_started_at, "window=7d")
    recent_failures = (
        db.query(Failure)
        .filter(Failure.machine_id == machine_id, Failure.datetime >= cutoff_7d)
        .order_by(desc(Failure.datetime))
        .all()
    )
    failure_summary = [f"{f.datetime}: failed {f.failure}" for f in recent_failures]
    _log_stage(trace_id, 5, "Failure history loaded", "success", stage_started_at, f"failure_count={len(recent_failures)}")
    
    # Telemetry Trends (Last 24 hours)
    stage_started_at = time.perf_counter()
    _log_stage(trace_id, 6, "Telemetry summary built", "start", stage_started_at, "window=24h")
    cutoff_24h = max_dt - timedelta(days=1)
    recent_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine_id, Telemetry.datetime >= cutoff_24h)
        .order_by(Telemetry.datetime)
        .all()
    )
    telemetry_summary = "No recent telemetry."
    if recent_telemetry:
        max_vibration = max(t.vibration for t in recent_telemetry)
        min_pressure = min(t.pressure for t in recent_telemetry)
        max_volt = max(t.volt for t in recent_telemetry)
        max_rotate = max(t.rotate for t in recent_telemetry)
        
        # Calculate trends comparing first half to second half of the 24h window
        mid_point = len(recent_telemetry) // 2
        first_half = recent_telemetry[:mid_point]
        second_half = recent_telemetry[mid_point:]
        
        avg_vib_1 = sum(t.vibration for t in first_half) / max(1, len(first_half))
        avg_vib_2 = sum(t.vibration for t in second_half) / max(1, len(second_half))
        
        avg_pres_1 = sum(t.pressure for t in first_half) / max(1, len(first_half))
        avg_pres_2 = sum(t.pressure for t in second_half) / max(1, len(second_half))
        
        telemetry_summary = (
            f"Over the last 24 hours:\n"
            f"- Vibration: Trended from {avg_vib_1:.1f} to {avg_vib_2:.1f} (Peak: {max_vibration:.1f}, Normal < 45)\n"
            f"- Pressure: Trended from {avg_pres_1:.1f} to {avg_pres_2:.1f} (Drop to: {min_pressure:.1f}, Normal ~100)\n"
            f"- Voltage: Peak {max_volt:.1f} (Normal ~170)\n"
            f"- Rotation: Peak {max_rotate:.1f} (Normal ~400)"
        )
    _log_stage(trace_id, 6, "Telemetry summary built", "success", stage_started_at, f"telemetry_points={len(recent_telemetry)}")
    
    # 2. Retrieve Unstructured Data (Manuals via ChromaDB)
    # OPTIMIZATION: n_results reduced 3→2 (measured: saves ~150 prompt tokens)
    stage_started_at = time.perf_counter()
    _log_stage(trace_id, 7, "Manual retrieved", "start", stage_started_at, f"model={machine.model}")
    manuals_found = search_manuals(query=question, n_results=2)
    _log_stage(trace_id, 7, "Manual retrieved", "success", stage_started_at, f"manual_chunks={len(manuals_found)}")
    
    # 2b. Retrieve Historical Case Reports
    # OPTIMIZATION: n_results reduced 2→1 (measured: saves ~43 prompt tokens; 2nd case rarely adds unique info)
    cases_started_at = time.perf_counter()
    _log_stage(trace_id, 7, "Historical cases retrieved", "start", cases_started_at, f"model={machine.model}")
    cases_found = search_historical_cases(query=question, model_name=machine.model, n_results=1)
    _log_stage(trace_id, 7, "Historical cases retrieved", "success", cases_started_at, f"case_chunks={len(cases_found)}")

    # OPTIMIZATION: Slim format — removed COMPONENT/FAILURE_MODE/SENSOR/SOURCE lines (~8 tokens/chunk).
    # Content capped at 400 chars to prevent any single large section inflating the prompt.
    EXCERPT_MAX_CHARS = 400

    def _format_doc_block(item: dict) -> str:
        excerpt = item["content"]
        if len(excerpt) > EXCERPT_MAX_CHARS:
            # Truncate at a sentence boundary where possible
            truncated = excerpt[:EXCERPT_MAX_CHARS]
            last_period = truncated.rfind(".")
            if last_period > EXCERPT_MAX_CHARS // 2:
                truncated = truncated[: last_period + 1]
            excerpt = truncated + "…"
        return (
            f"DOCUMENT: {item['document_title']}\n"
            f"SECTION: {item['section']}\n"
            f"EXCERPT: {excerpt}"
        )

    unstructured_blocks = [_format_doc_block(item) for item in manuals_found + cases_found]
    formatted_docs = "\n\n---\n\n".join(unstructured_blocks) if unstructured_blocks else "No relevant manuals or historical cases found."
    
    # 3. Format Context Prompt
    stage_started_at = time.perf_counter()
    _log_stage(trace_id, 8, "RAG retrieval complete", "start", stage_started_at)
    context = f"""
MACHINE PROFILE:
- ID: {machine.machine_id}
- Model: {machine.model}
- Age: {machine.age} years

RECENT FAILURES (Last 7 Days):
{chr(10).join(failure_summary) if failure_summary else "None"}

RECENT ERRORS (Last 7 Days):
{chr(10).join(error_summary) if error_summary else "None"}

MAINTENANCE HISTORY (Last 10 records):
{chr(10).join(maint_summary) if maint_summary else "None"}

TELEMETRY SUMMARY (Last 24 Hours):
{telemetry_summary}

RELEVANT TECHNICAL DOCUMENTATION & HISTORICAL CASES (Retrieved via RAG):
{formatted_docs}
"""
    _log_stage(trace_id, 8, "RAG retrieval complete", "success", stage_started_at, f"context_chars={len(context.strip())}")
    return context.strip()

