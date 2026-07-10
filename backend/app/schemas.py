"""
Pydantic schemas for API request/response validation.

These schemas serve two purposes:
1. FastAPI response serialization
2. Fireworks AI structured output schema (InvestigationResult)
"""

from pydantic import BaseModel, Field
from typing import Optional
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
    document_title: Optional[str] = Field(default=None, description="Title of the referenced technical manual, SOP, or historical case")
    section: Optional[str] = Field(default=None, description="Section name of the referenced manual, SOP, or case")
    excerpt: Optional[str] = Field(default=None, description="Direct textual quote from the retrieved document, max 30 words")


class ReasoningNode(BaseModel):
    """A node in the reasoning graph."""
    id: str = Field(description="Unique node identifier")
    label: str = Field(description="Short label, e.g. 'Bearing Wear Detected'")
    type: str = Field(description="Node type: root_cause, symptom, contributing_factor, evidence, recommendation")
    description: str = Field(description="Detailed explanation of this node")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")


class ReasoningEdge(BaseModel):
    """An edge connecting two reasoning nodes."""
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    relationship: str = Field(description="Edge type: caused_by, led_to, correlated_with, indicates")


class InvestigationResult(BaseModel):
    """Complete investigation output — this is the Fireworks AI structured output schema."""
    summary: str = Field(description="2-3 sentence executive summary of the investigation")
    root_cause: str = Field(description="The primary root cause identified")
    nodes: list[ReasoningNode] = Field(description="Nodes in the reasoning graph")
    edges: list[ReasoningEdge] = Field(description="Edges connecting the reasoning nodes")
    recommendation: str = Field(description="Actionable recommendation for the engineer")
    confidence: float = Field(ge=0.0, le=1.0, description="Overall investigation confidence")
    sources_consulted: list[str] = Field(description="List of data sources used in this investigation")


# ─── API Request Schema ──────────────────────────────────────────

class InvestigationRequest(BaseModel):
    """Request body for POST /api/investigate."""
    machine_id: int
    question: str = Field(min_length=5, description="The investigation question, e.g. 'Why did this machine fail yesterday?'")
