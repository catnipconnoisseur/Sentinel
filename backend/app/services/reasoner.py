import os
import json
import time
from datetime import datetime, timezone
from typing import Optional
from openai import OpenAI, APITimeoutError, APIConnectionError, RateLimitError, APIStatusError
from pydantic import ValidationError

from app.schemas import InvestigationResult

_client = None


def _ts():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def _log_stage(trace_id: str, stage_num: int, stage_name: str, state: str, started_at: Optional[float] = None, extra: str = ""):
    duration = ""
    if started_at is not None:
        duration = f" duration={time.perf_counter() - started_at:.3f}s"
    suffix = f" {extra}" if extra else ""
    print(f"{_ts()} trace={trace_id} [{stage_num}] {stage_name} {state}{duration}{suffix}")

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("FIREWORKS_API_KEY")
        if not api_key:
            raise ValueError("FIREWORKS_API_KEY environment variable is not set")
        _client = OpenAI(
            base_url="https://api.fireworks.ai/inference/v1",
            api_key=api_key,
            timeout=30.0,
            max_retries=0
        )
    return _client

# Using glm-5p2 for optimized latency and accurate schema validation
MODEL = "accounts/fireworks/models/glm-5p2"

# Request timeout in seconds — prevents indefinite hangs (openai SDK default = 10 min)
FIREWORKS_TIMEOUT_SECONDS = 30

# Token cap — must be high enough to fit a complete JSON response.
# 1000 was too low: finish_reason=length truncated JSON mid-stream causing 75% failure rate.
# Model stops early when JSON schema is complete, so 2000 does not increase latency on success.
FIREWORKS_MAX_TOKENS = 2000

SYSTEM_PROMPT = """
You are Sentinel, an AI industrial investigation engine.
Analyze evidence (telemetry, errors, maintenance, manuals) to answer the question.

Generate a compact, explainable JSON "Reasoning Graph" matching the schema.
Nodes:
- 'root_cause': Underlying reason.
- 'symptom': Observable issue (e.g. error, telemetry spike).
- 'contributing_factor': Contextual factor (e.g. old age, missed maintenance).
- 'evidence': Raw data citation.
- 'recommendation': Actionable advice.

CRITICAL COMPACTNESS RULES (To guarantee low latency):
1. Graph Size: Output exactly 4 to 6 nodes and 3 to 5 edges maximum. Keep the graph highly focused.
2. Length Caps:
   - summary: Max 20 words.
   - recommendation: Max 20 words.
   - Node label: Max 4 words.
   - Node description: Max 10 words.
   - Evidence description: Max 6 words.
3. Citation: Cite specific timestamps, values, and manuals in the 'evidence' fields.
4. Confidence: Set confidence scores (0.0 to 1.0) based on evidence strength.
"""

def generate_reasoning_graph(context: str, question: str, trace_id: str = "investigation") -> InvestigationResult:
    """
    Calls Fireworks AI to generate a structured reasoning graph based on the retrieved evidence.
    Applies a hard 30-second HTTP timeout to prevent indefinite blocking of the event loop.
    Raises:
        TimeoutError: if Fireworks does not respond within FIREWORKS_TIMEOUT_SECONDS.
        ConnectionError: if the connection to Fireworks cannot be established.
        ValueError: if the model returns malformed JSON.
        RuntimeError: for all other API errors.
    """
    prompt = f"EVIDENCE CONTEXT:\n{context}\n\nUSER QUESTION: {question}\n\nAnalyze the evidence and generate the reasoning graph."
    
    client = get_client()
    try:
        request_started_at = time.perf_counter()
        _log_stage(trace_id, 9, "Fireworks request sent", "start", request_started_at, f"model={MODEL} timeout={FIREWORKS_TIMEOUT_SECONDS}s max_tokens={FIREWORKS_MAX_TOKENS}")
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "InvestigationResult",
                    "schema": InvestigationResult.model_json_schema(),
                    "strict": True # Enforce strict schema constraints at the token generation level to prevent 422 errors
                }
            },
            temperature=0.1, # Low temperature for analytical consistency
            max_tokens=FIREWORKS_MAX_TOKENS,
        )

        response_finished_at = time.perf_counter()
        finish_reason = None
        if response.choices:
            finish_reason = response.choices[0].finish_reason
        _log_stage(
            trace_id,
            10,
            "Fireworks response received",
            "success",
            request_started_at,
            f"model={getattr(response, 'model', MODEL)} finish_reason={finish_reason} status=200 response_time={response_finished_at - request_started_at:.3f}s",
        )
        raw_response = response.model_dump()
        print(f"{_ts()} trace={trace_id} [11] Raw Fireworks response logged success response_body={json.dumps(raw_response, default=str)}")
        
        # Parse the JSON string back into our Pydantic model
        parse_started_at = time.perf_counter()
        _log_stage(trace_id, 12, "JSON parsing", "start", parse_started_at)
        result_json = response.choices[0].message.content
        result = InvestigationResult.model_validate_json(result_json)
        _log_stage(trace_id, 12, "JSON parsing", "success", parse_started_at, f"nodes={len(result.nodes)} edges={len(result.edges)}")
        _log_stage(trace_id, 13, "Graph nodes generated", "success", parse_started_at, f"node_count={len(result.nodes)} edge_count={len(result.edges)}")
        return result
        
    except APITimeoutError as e:
        print(
            f"{_ts()} trace={trace_id} [9-10] Fireworks AI TIMEOUT "
            f"after {FIREWORKS_TIMEOUT_SECONDS}s error={str(e)}"
        )
        raise TimeoutError(
            f"Fireworks AI did not respond within {FIREWORKS_TIMEOUT_SECONDS} seconds. "
            "The service may be slow or rate-limiting. Please retry."
        )
    except APIConnectionError as e:
        print(f"{_ts()} trace={trace_id} [9-10] Fireworks AI CONNECTION ERROR error={str(e)}")
        raise ConnectionError(
            f"Could not connect to Fireworks AI: {e}. Please check connectivity and retry."
        )
    except ValidationError as e:
        print(f"{_ts()} trace={trace_id} [12] JSON parsing failed error={e}")
        print(f"{_ts()} trace={trace_id} [12] Offending response content={locals().get('result_json', '<unavailable>')}")
        raise ValueError("The AI generated an invalid reasoning graph structure. Please try again.")
    except RateLimitError as e:
        print(f"{_ts()} trace={trace_id} [9-10] Fireworks RATE_LIMIT error={e}")
        raise ConnectionError(
            f"Fireworks rate limit hit — please retry in a moment: {e}"
        )
    except APIStatusError as e:
        if e.status_code >= 500:
            print(f"{_ts()} trace={trace_id} [9-10] Fireworks SERVER_ERROR status={e.status_code} error={e}")
            raise ConnectionError(
                f"Fireworks server error ({e.status_code}) — retrying: {e}"
            )
        print(f"{_ts()} trace={trace_id} [9-10] Fireworks API_ERROR status={e.status_code} error={e}")
        raise RuntimeError(f"Fireworks API error {e.status_code}: {e}")
    except Exception as e:
        print(f"{_ts()} trace={trace_id} [9-10] Fireworks AI API Error error={e}")
        raise RuntimeError(f"Investigation failed: {str(e)}")
