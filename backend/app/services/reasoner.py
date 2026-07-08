import os
import json
from openai import OpenAI
from pydantic import ValidationError

from app.schemas import InvestigationResult

# Initialize the OpenAI client pointing to Fireworks AI
# Fireworks AI runs on AMD Instinct MI300X GPUs, perfectly satisfying the hackathon's AMD compute requirement.
client = OpenAI(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key=os.environ.get("FIREWORKS_API_KEY")
)

# We use Llama 3.1 70B Instruct as it provides excellent reasoning and structured output support
MODEL = "accounts/fireworks/models/llama-v3p1-70b-instruct"

SYSTEM_PROMPT = """
You are FactoryMind, an elite AI industrial investigation engine.
Your job is to analyze fragmented factory evidence (telemetry, errors, maintenance logs, and machine manuals) to find the root cause of a machine failure.

You MUST build an explainable "Reasoning Graph".
The graph consists of nodes (representing facts, symptoms, or causes) and edges (representing the causal relationships between nodes).

Types of nodes:
- 'root_cause': The underlying reason for the failure.
- 'symptom': An observable issue (e.g., high vibration, error code).
- 'contributing_factor': Something that made the failure more likely (e.g., overdue maintenance).
- 'evidence': A direct data point (e.g., a specific telemetry spike).
- 'recommendation': Actionable advice.

Rules:
1. Every node MUST have a 'confidence' score (0.0 to 1.0).
2. Every node (except recommendation) MUST include specific 'evidence' items that support it, directly citing the provided context (e.g., specific timestamps, values, or manual sections).
3. Do NOT hallucinate. Only use facts present in the provided context.
4. Your output MUST exactly match the requested JSON schema.
"""

def generate_reasoning_graph(context: str, question: str) -> InvestigationResult:
    """
    Calls Fireworks AI to generate a structured reasoning graph based on the retrieved evidence.
    """
    prompt = f"EVIDENCE CONTEXT:\n{context}\n\nUSER QUESTION: {question}\n\nAnalyze the evidence and generate the reasoning graph."
    
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
