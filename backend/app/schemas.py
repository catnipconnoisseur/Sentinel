"""
Pydantic schemas for API request/response validation.

These schemas serve two purposes:
1. FastAPI response serialization
2. Fireworks AI structured output schema (InvestigationResult)
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ─── Machine Schemas ───────────────────────────────────────────────

class MachineBase(BaseModel):
    machine_id: int
    model: str
    age: int


class MachineHealth(MachineBase):
    """Machine with computed health status for the dashboard."""
    status: str = Field(description="Health status: healthy, warning, critical")
    last_error: Optional[str] = None
    last_failure: Optional[str] = None
    error_count_24h: int = 0

    model_config = {"from_attributes": True}


class TelemetryReading(BaseModel):
    datetime: datetime
    volt: float
    rotate: float
    pressure: float
    vibration: float

    model_config = {"from_attributes": True}


class ErrorRecord(BaseModel):
    datetime: datetime
    error_id: str

    model_config = {"from_attributes": True}


class MaintenanceRecord(BaseModel):
    datetime: datetime
    comp: str

    model_config = {"from_attributes": True}


class FailureRecord(BaseModel):
    datetime: datetime
    failure: str

    model_config = {"from_attributes": True}


class MachineDetail(MachineBase):
    """Full machine detail for the investigation page."""
    status: str
    recent_telemetry: list[TelemetryReading] = []
    recent_errors: list[ErrorRecord] = []
    recent_maintenance: list[MaintenanceRecord] = []
    recent_failures: list[FailureRecord] = []

    model_config = {"from_attributes": True}


# ─── Investigation Schemas (Fireworks AI output) ──────────────────

class EvidenceItem(BaseModel):
    """A single piece of evidence supporting a reasoning node."""
    source: str = Field(description="Data source: telemetry, error_log, maintenance, manual, failure_history, sop, historical_case")
    description: str = Field(description="Human-readable description of this evidence, including relevant dates or values")
    document_title: str = Field(default="", description="Title of the referenced technical manual, SOP, or historical case")
    section: str = Field(default="", description="Section name of the referenced manual, SOP, or case")
    excerpt: str = Field(default="", description="Direct textual quote from the retrieved document, max 30 words")


class ReasoningNode(BaseModel):
    """A node in the reasoning graph."""
    id: str = Field(description="Unique node identifier")
    label: str = Field(description="Short label, e.g. 'Bearing Wear Detected'")
    type: Literal[
        "root_cause",
        "observed_symptom",
        "failure_mode",
        "telemetry",
        "operational_risk",
        "business_impact",
        "immediate_action",
        "preventive_action",
        "predictive_state"
    ] = Field(description="Node type: root_cause, observed_symptom, failure_mode, telemetry, operational_risk, business_impact, immediate_action, preventive_action, predictive_state")
    description: str = Field(description="Detailed explanation of this node")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")


class ReasoningEdge(BaseModel):
    """An edge connecting two reasoning nodes."""
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    relationship: Literal[
        "caused_by",
        "led_to",
        "correlated_with",
        "indicates",
        "branches_to",
        "requires"
    ] = Field(description="Edge relationship type")


class ExecutiveSummary(BaseModel):
    """Concise executive summary block."""
    what_happened: str = Field(description="Concise description of the event")
    why_it_happened: str = Field(description="Explanation of why this event occurred (root cause explanation)")
    current_condition: str = Field(description="Current status/condition of the machine")
    urgency: str = Field(description="Urgency level: Low, Medium, High, Critical")


class ConfidenceWeight(BaseModel):
    """Visual weight of confidence breakdown."""
    telemetry: float = Field(description="Weight of telemetry evidence (0.0 to 1.0, e.g., 0.40)")
    historical_similarity: float = Field(description="Weight of historical cases (0.0 to 1.0, e.g., 0.25)")
    maintenance_history: float = Field(description="Weight of maintenance history (0.0 to 1.0, e.g., 0.18)")
    manual_evidence: float = Field(description="Weight of technical manuals/SOPs (0.0 to 1.0, e.g., 0.12)")
    missing_evidence: float = Field(description="Penalty weight for missing evidence (usually negative or 0.0, e.g., -0.05)")
    final_confidence: float = Field(description="Final computed confidence score (should equal sum of above), e.g. 0.90")
    explanation: str = Field(description="Brief text explanation of why this confidence level was determined")
    supporting_factors: list[str] = Field(default_factory=list, description="Specific factors that support/increase confidence")
    reducing_factors: list[str] = Field(default_factory=list, description="Specific factors that reduce confidence or indicate missing data")


class HypothesisItem(BaseModel):
    """Details of a competing hypothesis considered during investigation."""
    name: str = Field(description="Name of the hypothesis, e.g., 'Bearing degradation'")
    confidence: float = Field(description="Confidence weight for this hypothesis (0.0 to 1.0)")
    status: str = Field(description="Hypothesis status: Selected or Rejected")
    supporting_evidence: list[str] = Field(description="Supporting evidence descriptions")
    contradicting_evidence: list[str] = Field(description="Contradicting evidence descriptions")
    missing_evidence: list[str] = Field(description="Missing evidence descriptions that would help prove this hypothesis")
    rationale: str = Field(description="Detailed rationale for accepting or rejecting this hypothesis")


class RiskAssessment(BaseModel):
    """Assessment of operational severity and consequences."""
    severity: str = Field(description="Operational severity: Low, Medium, High, Critical")
    consequences: list[str] = Field(description="List of expected consequences if operations continue unchecked")


class RecommendationItem(BaseModel):
    """Specific recommendation item pairing an action with an engineering rationale."""
    action: str = Field(description="Specific engineering action to perform")
    reason: str = Field(description="Engineering rationale/justification connecting back to telemetry, manuals, or history")


class PhasedRecommendations(BaseModel):
    """Recommendations divided into three timeframes with justifications."""
    immediate_1h: list[str] = Field(default_factory=list, description="Legacy list of actions required within 1 hour")
    short_term_24h: list[str] = Field(default_factory=list, description="Legacy list of actions required within 24 hours")
    long_term_preventive: list[str] = Field(default_factory=list, description="Legacy list of preventive improvements and long-term actions")
    immediate: list[RecommendationItem] = Field(default_factory=list, description="Priority 1 — Immediate actions (<1h) with rationales")
    short_term: list[RecommendationItem] = Field(default_factory=list, description="Priority 2 — Short-Term actions (<24h) with rationales")
    preventive: list[RecommendationItem] = Field(default_factory=list, description="Priority 3 — Preventive actions (long-term) with rationales")


class BusinessImpact(BaseModel):
    """Business metrics qualitative assessment."""
    downtime: str = Field(description="Downtime severity (Low, Moderate, High, Very High)")
    maintenance_complexity: str = Field(description="Maintenance complexity (Low, Moderate, High, Very High)")
    production_disruption: str = Field(description="Production disruption severity (Low, Moderate, High, Very High)")
    potential_cost_range: str = Field(description="Potential cost range category (Low, Moderate, High, Very High)")
    risk_to_adjacent_equipment: str = Field(description="Risk to adjacent equipment (Low, Moderate, High, Very High)")


class Preventability(BaseModel):
    """Preventability assessment."""
    preventable: bool = Field(description="Whether the incident could have been prevented")
    warnings: list[str] = Field(description="List of early warning signs that existed")
    thresholds: list[str] = Field(description="List of specific telemetry thresholds that should have triggered intervention")


class TimelineItem(BaseModel):
    """A single chronological sequence item."""
    timestamp: str = Field(description="Timestamp (e.g. '08:12' or 'T-24h') or sequence indicator")
    event: str = Field(description="Engineering description of the event or anomaly observed")


class SelfChallenge(BaseModel):
    """Auditing the final diagnosis with pros, cons, and unresolved gaps."""
    supporting_evidence: list[str] = Field(description="Key evidence supporting the final diagnosis")
    contradicting_evidence: list[str] = Field(description="Conflicting signals or contradicting evidence")
    additional_evidence_needed: list[str] = Field(description="Additional evidence that would improve certainty")


class InvestigationResult(BaseModel):
    """Complete investigation output — this is the Fireworks AI structured output schema."""
    model_config = {"protected_namespaces": ()}

    summary: str = Field(description="2-3 sentence executive summary of the investigation")
    root_cause: str = Field(description="The primary root cause identified")
    nodes: list[ReasoningNode] = Field(description="Nodes in the reasoning graph")
    edges: list[ReasoningEdge] = Field(description="Edges connecting the reasoning nodes")
    recommendation: str = Field(description="Actionable recommendation for the engineer")
    confidence: float = Field(ge=0.0, le=1.0, description="Overall investigation confidence")
    sources_consulted: list[str] = Field(description="List of data sources used in this investigation")
    
    # AI Industrial Investigation Agent report sections
    executive_summary: ExecutiveSummary = Field(description="Detailed structured executive summary")
    confidence_breakdown: ConfidenceWeight = Field(description="Detailed confidence explanation and breakdown")
    alternative_hypotheses: list[HypothesisItem] = Field(description="2-3 alternative explanations with confidence and rationale")
    evidence_correlation: str = Field(description="Analysis of how different evidence points correlate to support the root cause")
    risk_assessment: RiskAssessment = Field(description="Operational severity and consequences of continued operation")
    failure_progression: list[str] = Field(default_factory=list, description="Legacy expected failure progression chain")
    timeline: list[TimelineItem] = Field(default_factory=list, description="Chronological timeline sequence of events/anomalies")
    self_challenge: SelfChallenge = Field(description="Self-challenge audit evaluating the final diagnosis")
    contradictory_evidence: list[str] = Field(default_factory=list, description="Contradictory or conflicting evidence for main diagnosis")
    phased_recommendations: PhasedRecommendations = Field(description="Phased actions: Immediate (1h), Short Term (24h), Long Term (preventive)")
    business_impact: BusinessImpact = Field(description="Estimated business and operational impacts")
    preventability: Preventability = Field(description="Preventability assessment with early warning signs and thresholds")
    key_insight: str = Field(description="Concise engineering key insight that synthesizes the root cause, systemic maintenance issues, or preventability")

    # Backend metadata fields (not generated by AI, added post-inference)
    inference_time_ms: Optional[float] = Field(default=None, description="AI inference duration in milliseconds")
    model_name: Optional[str] = Field(default=None, description="Name of the model used")



# ─── API Request Schema ──────────────────────────────────────────

class InvestigationRequest(BaseModel):
    """Request body for POST /api/investigate."""
    machine_id: int
    question: str = Field(min_length=5, description="The investigation question, e.g. 'Why did this machine fail yesterday?'")
