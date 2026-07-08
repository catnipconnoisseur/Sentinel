import os
import json
from openai import OpenAI
from pydantic import ValidationError

from app.schemas import InvestigationResult

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("FIREWORKS_API_KEY")
        if not api_key:
            raise ValueError("FIREWORKS_API_KEY environment variable is not set")
        _client = OpenAI(
            base_url="https://api.fireworks.ai/inference/v1",
            api_key=api_key
        )
    return _client

# We use Llama 3.1 70B Instruct as it provides excellent reasoning and structured output support
MODEL = "accounts/fireworks/models/llama-v3p1-70b-instruct"

SYSTEM_PROMPT = """
You are Sentinel, an elite AI industrial investigation engine.
Your job is to analyze fragmented factory evidence (telemetry, errors, maintenance logs, and machine manuals) to find the root cause of a machine failure.

You MUST build an explainable "Reasoning Graph".
The graph consists of nodes (representing facts, symptoms, or causes) and edges (representing the causal relationships between nodes).

Types of nodes:
- 'root_cause': The underlying, original reason for the failure (e.g., component degradation, systemic issue).
- 'symptom': An observable issue (e.g., high vibration, error code, pressure drop).
- 'contributing_factor': Something that made the failure more likely or exacerbated it (e.g., overdue maintenance, heavy load).
- 'evidence': A direct data point (e.g., a specific telemetry spike).
- 'recommendation': Actionable advice to resolve the root cause and prevent future occurrences.

Rules for high-quality reasoning:
1. CAUSAL CHAINS: Do not just list nodes. Connect them logically. A root_cause usually leads to a contributing_factor, which leads to a symptom, which leads to a failure.
2. CITATIONS: Every node (except recommendation) MUST include specific 'evidence' items that support it. You MUST cite specific timestamps, metric values, and manual section numbers from the context.
3. NO HALLUCINATIONS: Only use facts present in the provided context. If a cause is inferred, label its confidence accordingly.
4. CONFIDENCE SCORES: Every node MUST have a 'confidence' score (0.0 to 1.0) reflecting how strongly the evidence supports it.
5. STRICT SCHEMA: Your output MUST exactly match the requested JSON schema.
"""

def generate_reasoning_graph(context: str, question: str) -> InvestigationResult:
    """
    Calls Fireworks AI to generate a structured reasoning graph based on the retrieved evidence.
    """
    prompt = f"EVIDENCE CONTEXT:\n{context}\n\nUSER QUESTION: {question}\n\nAnalyze the evidence and generate the reasoning graph."
    
    client = get_client()
    try:
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
                    "strict": False # Set to false to avoid strict JSON schema validation errors if model varies slightly
                }
            },
            temperature=0.1, # Low temperature for analytical consistency
        )
        
        # Parse the JSON string back into our Pydantic model
        result_json = response.choices[0].message.content
        return InvestigationResult.model_validate_json(result_json)
        
    except ValidationError as e:
        print(f"Pydantic Validation Error: {e}")
        raise ValueError("The AI generated an invalid reasoning graph structure. Please try again.")
    except Exception as e:
        print(f"Fireworks AI API Error: {e}")
        raise RuntimeError(f"Investigation failed: {str(e)}")
