"""
Machine API endpoints.

GET /api/machines         — Dashboard: all machines with health status
GET /api/machines/{id}    — Detail: machine with recent telemetry, errors, maintenance, failures
GET /api/machines/{id}/telemetry    — Telemetry time-series for charts
GET /api/machines/{id}/errors       — Error history
GET /api/machines/{id}/maintenance  — Maintenance history
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import Machine, Telemetry, Error, Maintenance, Failure
from app.schemas import MachineHealth, MachineDetail, TelemetryReading, ErrorRecord, MaintenanceRecord, FailureRecord

router = APIRouter(tags=["machines"])


def _compute_health_status(db: Session, machine: Machine) -> dict:
    """
    Compute machine health based on recent failures and errors.

    Logic:
    - If a failure exists in the last 7 days → "critical"
    - If errors > 3 in the last 7 days → "warning"
    - Otherwise → "healthy"
    """
    # Use the max datetime in the dataset as "now" (since the dataset is historical)
    max_dt = db.query(func.max(Telemetry.datetime)).scalar()
    if max_dt is None:
        max_dt = datetime.now()

    cutoff = max_dt - timedelta(days=7)
    cutoff_24h = max_dt - timedelta(days=1)

    # Check for recent failures
    recent_failure = (
        db.query(Failure)
        .filter(Failure.machine_id == machine.machine_id, Failure.datetime >= cutoff)
        .order_by(desc(Failure.datetime))
        .first()
    )

    # Count recent errors
    error_count_24h = (
        db.query(func.count(Error.id))
        .filter(Error.machine_id == machine.machine_id, Error.datetime >= cutoff_24h)
        .scalar()
    )

    error_count_7d = (
        db.query(func.count(Error.id))
        .filter(Error.machine_id == machine.machine_id, Error.datetime >= cutoff)
        .scalar()
    )

    # Last error
    last_error = (
        db.query(Error)
        .filter(Error.machine_id == machine.machine_id)
        .order_by(desc(Error.datetime))
        .first()
    )

    if recent_failure:
        status = "critical"
    elif error_count_7d > 3:
        status = "warning"
    else:
        status = "healthy"

    return {
        "status": status,
        "last_error": last_error.error_id if last_error else None,
        "last_failure": recent_failure.failure if recent_failure else None,
        "error_count_24h": error_count_24h or 0,
    }


@router.get("/machines", response_model=list[MachineHealth])
def list_machines(db: Session = Depends(get_db)):
    """List all machines with computed health status."""
    machines = db.query(Machine).order_by(Machine.machine_id).all()
    results = []
    for m in machines:
        health = _compute_health_status(db, m)
        results.append(MachineHealth(
            machine_id=m.machine_id,
            model=m.model,
            age=m.age,
            **health,
        ))
    return results


@router.get("/machines/{machine_id}", response_model=MachineDetail)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    """Get full machine detail with recent data for investigation page."""
    machine = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    health = _compute_health_status(db, machine)

    # Get the max datetime to compute relative "recent" window
    max_dt = db.query(func.max(Telemetry.datetime)).scalar()
    if max_dt is None:
        max_dt = datetime.now()
    cutoff = max_dt - timedelta(days=7)

    recent_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine_id, Telemetry.datetime >= cutoff)
        .order_by(Telemetry.datetime)
        .all()
    )

    recent_errors = (
        db.query(Error)
        .filter(Error.machine_id == machine_id, Error.datetime >= cutoff)
        .order_by(desc(Error.datetime))
        .all()
    )

    recent_maintenance = (
        db.query(Maintenance)
        .filter(Maintenance.machine_id == machine_id, Maintenance.datetime >= cutoff)
        .order_by(desc(Maintenance.datetime))
        .all()
    )

    recent_failures = (
        db.query(Failure)
        .filter(Failure.machine_id == machine_id, Failure.datetime >= cutoff)
        .order_by(desc(Failure.datetime))
        .all()
    )

    return MachineDetail(
        machine_id=machine.machine_id,
        model=machine.model,
        age=machine.age,
        status=health["status"],
        recent_telemetry=[TelemetryReading.model_validate(t) for t in recent_telemetry],
        recent_errors=[ErrorRecord.model_validate(e) for e in recent_errors],
        recent_maintenance=[MaintenanceRecord.model_validate(m) for m in recent_maintenance],
        recent_failures=[FailureRecord.model_validate(f) for f in recent_failures],
    )


@router.get("/machines/{machine_id}/telemetry", response_model=list[TelemetryReading])
def get_telemetry(
    machine_id: int,
    hours: int = 168,  # Default: last 7 days
    db: Session = Depends(get_db),
):
    """Get telemetry time-series data for charts."""
    max_dt = db.query(func.max(Telemetry.datetime)).scalar()
    if max_dt is None:
        raise HTTPException(status_code=404, detail="No telemetry data available")
    cutoff = max_dt - timedelta(hours=hours)

    data = (
        db.query(Telemetry)
        .filter(Telemetry.machine_id == machine_id, Telemetry.datetime >= cutoff)
        .order_by(Telemetry.datetime)
        .all()
    )
    return [TelemetryReading.model_validate(t) for t in data]


@router.get("/machines/{machine_id}/errors", response_model=list[ErrorRecord])
def get_errors(machine_id: int, db: Session = Depends(get_db)):
    """Get error history for a machine."""
    errors = (
        db.query(Error)
        .filter(Error.machine_id == machine_id)
        .order_by(desc(Error.datetime))
        .limit(50)
        .all()
    )
    return [ErrorRecord.model_validate(e) for e in errors]


@router.get("/machines/{machine_id}/maintenance", response_model=list[MaintenanceRecord])
def get_maintenance(machine_id: int, db: Session = Depends(get_db)):
    """Get maintenance history for a machine."""
    records = (
        db.query(Maintenance)
        .filter(Maintenance.machine_id == machine_id)
        .order_by(desc(Maintenance.datetime))
        .limit(50)
        .all()
    )
    return [MaintenanceRecord.model_validate(r) for r in records]
