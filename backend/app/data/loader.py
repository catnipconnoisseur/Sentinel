import os
import csv
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, init_db
from app.models import Machine, Telemetry, Error, Maintenance, Failure

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

def load_csv(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)

def parse_datetime(dt_str):
    return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")

def load_data():
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    
    # Load Machines
    if db.query(Machine).count() == 0:
        print("Loading machines...")
        machines_data = load_csv("PdM_machines.csv")
        machines = [Machine(machine_id=int(row["machineID"]), model=row["model"], age=int(row["age"])) for row in machines_data]
        db.add_all(machines)
        db.commit()
    else:
        print("Machines already loaded. Skipping.")

    # Load Telemetry
    if db.query(Telemetry).count() == 0:
        print("Loading telemetry...")
        telemetry_data = load_csv("PdM_telemetry.csv")
        batch = []
        for i, row in enumerate(telemetry_data):
            batch.append(Telemetry(
                datetime=parse_datetime(row["datetime"]),
                machine_id=int(row["machineID"]),
                volt=float(row["volt"]),
                rotate=float(row["rotate"]),
                pressure=float(row["pressure"]),
                vibration=float(row["vibration"])
            ))
            if len(batch) >= 10000:
                db.add_all(batch)
                db.commit()
                batch = []
        if batch:
            db.add_all(batch)
            db.commit()
    else:
        print("Telemetry already loaded. Skipping.")

    # Load Errors
    if db.query(Error).count() == 0:
        print("Loading errors...")
        errors_data = load_csv("PdM_errors.csv")
        errors = [Error(datetime=parse_datetime(row["datetime"]), machine_id=int(row["machineID"]), error_id=row["errorID"]) for row in errors_data]
        db.add_all(errors)
        db.commit()
    else:
        print("Errors already loaded. Skipping.")

    # Load Maintenance
    if db.query(Maintenance).count() == 0:
        print("Loading maintenance...")
        maint_data = load_csv("PdM_maint.csv")
        maints = [Maintenance(datetime=parse_datetime(row["datetime"]), machine_id=int(row["machineID"]), comp=row["comp"]) for row in maint_data]
        db.add_all(maints)
        db.commit()
    else:
        print("Maintenance already loaded. Skipping.")

    # Load Failures
    if db.query(Failure).count() == 0:
        print("Loading failures...")
        failures_data = load_csv("PdM_failures.csv")
        failures = [Failure(datetime=parse_datetime(row["datetime"]), machine_id=int(row["machineID"]), failure=row["failure"]) for row in failures_data]
        db.add_all(failures)
        db.commit()
    else:
        print("Failures already loaded. Skipping.")

    db.close()
    print("Data loading complete!")

if __name__ == "__main__":
    load_data()
