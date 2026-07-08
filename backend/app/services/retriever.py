from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json

from app.models import Machine, Telemetry, Error, Maintenance, Failure
from app.services.embeddings import search_manuals

def retrieve_evidence(db: Session, machine_id: int, question: str):
    """
    Retrieves all relevant structured and unstructured evidence for a machine.
    Returns a formatted string representing the context for the LLM.
    """
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        raise ValueError(f"Machine {machine_id} not found")

    # We use the max datetime as 'now' since this is a historical dataset
    max_dt = db.query(func.max(Telemetry.datetime)).scalar() or datetime.now()
    
    # 1. Retrieve Recent Structured Data (Last 7 Days)
    cutoff_7d = max_dt - timedelta(days=7)
    
    # Recent Errors
    recent_errors = (
        db.query(Error)
        .filter(Error.machine_id == machine_id, Error.datetime >= cutoff_7d)
        .order_by(desc(Error.datetime))
        .all()
    )
    error_summary = [f"{e.datetime}: {e.error_id}" for e in recent_errors]
    
    # Recent Maintenance
    recent_maint = (
        db.query(Maintenance)
        .filter(Maintenance.machine_id == machine_id)
        .order_by(desc(Maintenance.datetime))
        .limit(10)  # We want to see if maintenance was missed, so we look at the last 10 records regardless of time
        .all()
    )
    maint_summary = [f"{m.datetime}: replaced {m.comp}" for m in recent_maint]
    
    # Recent Failures
    recent_failures = (
        db.query(Failure)
        .filter(Failure.machine_id == machine_id, Failure.datetime >= cutoff_7d)
        .order_by(desc(Failure.datetime))
        .all()
    )
    failure_summary = [f"{f.datetime}: failed {f.failure}" for f in recent_failures]
    
    # Telemetry Anomalies (Simple heuristic: grab last 48 hours and find max values)
    cutoff_48h = max_dt - timedelta(days=2)
    recent_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine_id, Telemetry.datetime >= cutoff_48h)
        .all()
    )
    telemetry_summary = "No recent telemetry."
    if recent_telemetry:
        max_vibration = max(t.vibration for t in recent_telemetry)
        min_pressure = min(t.pressure for t in recent_telemetry)
        max_volt = max(t.volt for t in recent_telemetry)
        telemetry_summary = (
            f"Over the last 48 hours:\n"
            f"- Max Vibration: {max_vibration:.2f} (Normal < 45)\n"
            f"- Min Pressure: {min_pressure:.2f} (Normal ~100)\n"
            f"- Max Voltage: {max_volt:.2f} (Normal ~170)"
        )
    
    # 2. Retrieve Unstructured Data (Manuals via ChromaDB)
    # We query ChromaDB using the user's question to find relevant manual sections
    manual_excerpts = search_manuals(query=question, model_name=machine.model, n_results=3)
    
    # 3. Format Context Prompt
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

TELEMETRY SUMMARY (Last 48 Hours):
{telemetry_summary}

MACHINE MANUAL EXCERPTS (Retrieved via RAG):
{chr(10).join(manual_excerpts) if manual_excerpts else "No manual found."}
"""
    return context.strip()
