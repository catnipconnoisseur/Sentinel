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
            timeout=40.0,
            max_retries=0
        )
    return _client

# Using glm-5p2 for optimized latency and accurate schema validation
MODEL = "accounts/fireworks/models/glm-5p2"

# Request timeout in seconds — prevents indefinite hangs
FIREWORKS_TIMEOUT_SECONDS = 60

# Token cap — must be high enough to fit reasoning + JSON response.
FIREWORKS_MAX_TOKENS = 4096

SYSTEM_PROMPT = """
You are a Senior Industrial Reliability Engineer with expertise in predictive maintenance, failure analysis, root cause analysis (RCA), and condition monitoring.
Analyze the machine profile, recent errors, maintenance history, telemetry data, and retrieved documentation to perform a thorough, evidence-based incident investigation.

Your report must be highly trustworthy, evidence-based, and actionable, adhering to the following rules:

1. EXPLAIN CONFIDENCE:
   - Identify both supporting factors (reasons for higher confidence, e.g., telemetry anomalies aligning with known failure patterns) and reducing factors (reasons for lower confidence, e.g., missing bearings log or incomplete temperature data). Do not fabricate evidence.
2. DETECT MISSING EVIDENCE:
   - Explicitly identify what additional diagnostic data would improve confidence (e.g., oil analysis, bearing temperature history, maintenance inspection records, sensor calibration report) if not in context.
3. PRIORITIZE & JUSTIFY RECOMMENDATIONS:
   - Classify recommendations into: Priority 1 (Immediate, <1h), Priority 2 (Short-Term, <24h), and Priority 3 (Preventive, long-term).
   - Justify every recommendation with a short engineering rationale connecting the action back to specific telemetry readings, technical manuals, or logs.
4. DETECT CONTRADICTORY EVIDENCE:
   - Actively check for conflicting signals (e.g., telemetry indicating misalignment, but maintenance logs showing alignment was recently corrected). State these inconsistencies under contradictory_evidence.
5. EVIDENCE TIMELINE:
   - Reconstruct the chronological sequence of events/anomalies leading to the failure. If timestamps are not in the context, use logical/relative ordering (e.g. 'T-2h', 'T-10m').
6. CHALLENGE DIAGNOSIS:
   - Perform a self-challenge audit: list supporting evidence, contradicting evidence, and additional evidence needed for the main diagnosis.
7. POPULATE NODE EVIDENCE:
   - For every node in the reasoning graph, you MUST map it to 1-2 supporting evidence items retrieved from the context.
   - Set the source to one of: telemetry, error_log, maintenance, manual, failure_history, sop, historical_case.
   - For manual, sop, and historical_case: copy the exact document_title, section, and excerpt from the context.
   - For telemetry, error_log, and maintenance: populate the description and source, leaving document_title, section, and excerpt as empty strings.

Your internal thinking/reasoning process must be extremely concise and direct (under 150 words total).

STRUCTURED INCIDENT REPORT CONCISENESS LIMITS (strictly enforced to prevent JSON truncation):
- summary: ≤2 sentences.
- root_cause: ≤10 words.
- nodes: 6-10 nodes max. For each node, include 1-2 evidence items (max 15 words per description).
- recommendation: ≤50 words.
- key_insight: ≤50 words.
- executive_summary: what_happened (≤2 sentences), why_it_happened (≤2 sentences), current_condition (≤2 sentences), urgency (One word: Low, Medium, High, Critical).
- confidence_breakdown:
  - telemetry, historical_similarity, maintenance_history, manual_evidence, missing_evidence: weights/penalties.
  - explanation: ≤30 words.
  - supporting_factors: max 2 items, ≤12 words per item.
  - reducing_factors: max 2 items, ≤12 words per item.
- alternative_hypotheses: 2-3 hypotheses max. For each: name (≤5 words), supporting_evidence (max 2 items, ≤12 words each), contradicting_evidence (max 2 items, ≤12 words each), missing_evidence (max 2 items, ≤12 words each), rationale (≤30 words).
- evidence_correlation: ≤50 words.
- risk_assessment: severity (Low, Medium, High, Critical) and consequences (max 3 items, ≤12 words per item).
- failure_progression: max 5 states in list.
- timeline: max 5 steps in chronological sequence.
- self_challenge: supporting_evidence (max 3 items, ≤12 words each), contradicting_evidence (max 3 items, ≤12 words each), additional_evidence_needed (max 3 items, ≤12 words each).
- contradictory_evidence: max 2 items, ≤15 words each (if none, return empty list).
- phased_recommendations: max 2 items for each of immediate, short_term, preventive. For each item: action (≤15 words), reason (≤25 words).
- business_impact: qualitative scales (Low, Moderate, High, Very High).
- preventability: preventable (bool), warnings (max 3 items, ≤12 words each), thresholds (max 3 items, ≤12 words each).
"""


def _parse_with_recovery(raw: str, finish_reason: Optional[str], trace_id: str) -> InvestigationResult:
    """
    Attempts to parse the raw JSON response into InvestigationResult.
    If the model hit the token limit (finish_reason='length'), the JSON may be truncated.
    In that case, we try to close the object at the last structurally complete position
    so we can recover a partial (but valid) result rather than failing entirely.
    """
    try:
        return InvestigationResult.model_validate_json(raw)
    except Exception as first_err:
        if finish_reason != "length":
            # Not a truncation issue — re-raise as validation error
            raise ValueError("The AI generated an invalid reasoning graph structure. Please try again.") from first_err

        # Try truncation recovery: walk character by character to find the last
        # position where brace/bracket depth returns to 0 (a complete JSON object).
        print(f"{_ts()} trace={trace_id} [12] JSON truncation recovery start finish_reason=length")
        depth = 0
        in_string = False
        escape_next = False
        last_complete_pos = -1
        for i, ch in enumerate(raw):
            if escape_next:
                escape_next = False
                continue
            if ch == "\\" and in_string:
                escape_next = True
                continue
            if ch == '"' and not escape_next:
                in_string = not in_string
                continue
            if not in_string:
                if ch in "{[":
                    depth += 1
                elif ch in "}]":
                    depth -= 1
                    if depth == 0:
                        last_complete_pos = i

        if last_complete_pos > 0:
            recovered = raw[: last_complete_pos + 1]
            try:
                result = InvestigationResult.model_validate_json(recovered)
                print(f"{_ts()} trace={trace_id} [12] JSON truncation recovery success recovered_chars={len(recovered)} nodes={len(result.nodes)}")
                return result
            except Exception as recovery_err:
                print(f"{_ts()} trace={trace_id} [12] JSON truncation recovery failed error={recovery_err}")

        raise ValueError("The AI generated an invalid reasoning graph structure (truncated). Please retry.") from first_err


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
                    # strict: True — enabled now that all Optional (anyOf/null) fields have been removed.
                    # This enforces grammar-constrained decoding and prevents infinite looping/duplicate keys.
                    "strict": True
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
        
        # Parse the JSON string back into our Pydantic model.
        # Use lenient recovery for truncated responses (finish_reason=length).
        parse_started_at = time.perf_counter()
        _log_stage(trace_id, 12, "JSON parsing", "start", parse_started_at)
        result_json = response.choices[0].message.content
        finish_reason = response.choices[0].finish_reason if response.choices else None
        result = _parse_with_recovery(result_json, finish_reason, trace_id)
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
