"""
Investigation API endpoint.

POST /api/investigate — Takes a machine_id and question, returns reasoning graph.

For now, returns a mock investigation result.
This will be connected to the RAG + Fireworks AI pipeline in Milestone 12.
"""

import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import InvestigationRequest, InvestigationResult, ReasoningNode, ReasoningEdge, EvidenceItem
from app.services.retriever import retrieve_evidence
from app.services.reasoner import generate_reasoning_graph

router = APIRouter(tags=["investigation"])


def _mock_investigation(machine_id: int, question: str) -> InvestigationResult:
    """
    Returns a realistic mock investigation result for development.
    This lets the frontend team build the graph visualization immediately
    without waiting for the AI pipeline.
    """
    return InvestigationResult(
        summary=f"Investigation of Machine {machine_id}: Analysis indicates a cascading failure originating from bearing degradation in Component 3, accelerated by missed scheduled maintenance and abnormal vibration patterns detected over the past 72 hours.",
        root_cause="Bearing wear in Component 3 due to overdue maintenance",
        nodes=[
            ReasoningNode(
                id="failure",
                label="Machine Failure",
                type="symptom",
                description=f"Machine {machine_id} experienced an unplanned shutdown",
                evidence=[
                    EvidenceItem(
                        source="failure_history",
                        description=f"Machine {machine_id} failure recorded — comp3 failure",
                        timestamp="2015-07-15T06:00:00",
                    )
                ],
                confidence=1.0,
            ),
            ReasoningNode(
                id="vibration_anomaly",
                label="Abnormal Vibration",
                type="symptom",
                description="Vibration readings exceeded normal operating range (>45 units) for 48+ hours before failure",
                evidence=[
                    EvidenceItem(
                        source="telemetry",
                        description="Vibration peaked at 62.3 units, normal range is 35-42",
                        timestamp="2015-07-14T18:00:00",
                        data={"metric": "vibration", "value": 62.3, "threshold": 42},
                    )
                ],
                confidence=0.95,
            ),
            ReasoningNode(
                id="bearing_wear",
                label="Bearing Wear",
                type="root_cause",
                description="Component 3 bearings showed progressive degradation pattern consistent with metal fatigue",
                evidence=[
                    EvidenceItem(
                        source="manual",
                        description="Machine manual Section 4.2: comp3 bearings require replacement every 18 months under standard load",
                    ),
                    EvidenceItem(
                        source="maintenance",
                        description="Last comp3 maintenance was 22 months ago",
                        timestamp="2015-01-05T00:00:00",
                    ),
                ],
                confidence=0.91,
            ),
            ReasoningNode(
                id="maintenance_overdue",
                label="Maintenance Overdue",
                type="contributing_factor",
                description="Scheduled maintenance for comp3 was 4 months overdue",
                evidence=[
                    EvidenceItem(
                        source="maintenance",
                        description="Maintenance schedule shows comp3 service due at month 18, currently at month 22",
                        timestamp="2015-01-05T00:00:00",
                    )
                ],
                confidence=0.88,
            ),
            ReasoningNode(
                id="pressure_drop",
                label="Pressure Drop",
                type="symptom",
                description="System pressure dropped 15% in the 24 hours before failure",
                evidence=[
                    EvidenceItem(
                        source="telemetry",
                        description="Pressure dropped from 102.1 to 86.8 PSI",
                        timestamp="2015-07-15T00:00:00",
                        data={"metric": "pressure", "value": 86.8, "threshold": 95},
                    )
                ],
                confidence=0.82,
            ),
            ReasoningNode(
                id="error_signals",
                label="Error Signals",
                type="evidence",
                description="Multiple error codes logged in the 48 hours before failure",
                evidence=[
                    EvidenceItem(
                        source="error_log",
                        description="error1 logged 3 times, error3 logged 2 times",
                        timestamp="2015-07-14T12:00:00",
                    )
                ],
                confidence=0.85,
            ),
            ReasoningNode(
                id="recommendation",
                label="Recommended Action",
                type="recommendation",
                description="Replace comp3 bearings immediately and recalibrate vibration sensors",
                evidence=[],
                confidence=0.91,
            ),
        ],
        edges=[
            ReasoningEdge(source="maintenance_overdue", target="bearing_wear", relationship="caused_by"),
            ReasoningEdge(source="bearing_wear", target="vibration_anomaly", relationship="led_to"),
            ReasoningEdge(source="bearing_wear", target="pressure_drop", relationship="led_to"),
            ReasoningEdge(source="vibration_anomaly", target="failure", relationship="led_to"),
            ReasoningEdge(source="pressure_drop", target="failure", relationship="led_to"),
            ReasoningEdge(source="error_signals", target="failure", relationship="indicates"),
            ReasoningEdge(source="failure", target="recommendation", relationship="led_to"),
        ],
        recommendation="1. Immediately replace Component 3 bearings.\n2. Inspect adjacent components for collateral wear.\n3. Reset maintenance schedule to 16-month intervals for this machine model given its age.\n4. Install vibration threshold alerts at 45 units to catch early degradation.",
        confidence=0.91,
        sources_consulted=["telemetry", "error_log", "maintenance", "failure_history", "manual"],
    )


@router.post("/investigate", response_model=InvestigationResult)
async def investigate(request: InvestigationRequest, db: Session = Depends(get_db)):
    """
    Run an AI-powered investigation on a machine failure.

    Uses RAG to retrieve structural and unstructured evidence, then
    calls Fireworks AI to generate the structured reasoning graph.
    """
    api_key = os.environ.get("FIREWORKS_API_KEY")
    if not api_key or api_key == "your_key_here":
        print("WARN: FIREWORKS_API_KEY not set. Using mock investigation data.")
        return _mock_investigation(request.machine_id, request.question)

    print(f"Starting investigation for Machine {request.machine_id}...")
    
    # 1. Retrieve evidence context (SQLite + ChromaDB)
    context = retrieve_evidence(db, request.machine_id, request.question)
    
    # 2. Call Fireworks AI to reason over the context
    result = generate_reasoning_graph(context, request.question)
    
    return result
