import os
import csv
import random
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def generate_machines(num_machines=100):
    with open(os.path.join(DATA_DIR, "PdM_machines.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["machineID", "model", "age"])
        for i in range(1, num_machines + 1):
            model = f"model{random.randint(1, 4)}"
            age = random.randint(1, 20)
            writer.writerow([i, model, age])

def generate_telemetry(num_machines=100, days=30):
    start_date = datetime(2015, 6, 1)
    with open(os.path.join(DATA_DIR, "PdM_telemetry.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["datetime", "machineID", "volt", "rotate", "pressure", "vibration"])
        
        for i in range(1, num_machines + 1):
            current_date = start_date
            # Machine 14 will have a failure scenario
            for _ in range(days * 24):
                volt = random.uniform(140.0, 190.0)
                rotate = random.uniform(300.0, 500.0)
                pressure = random.uniform(90.0, 110.0)
                vibration = random.uniform(30.0, 45.0)
                
                if i == 14 and current_date > datetime(2015, 6, 28):
                    # Inject anomaly for Machine 14
                    vibration = random.uniform(50.0, 70.0)
                    pressure = random.uniform(70.0, 90.0)
                    
                writer.writerow([current_date.strftime("%Y-%m-%d %H:%M:%S"), i, round(volt, 2), round(rotate, 2), round(pressure, 2), round(vibration, 2)])
                current_date += timedelta(hours=1)

def generate_errors(num_machines=100, days=30):
    start_date = datetime(2015, 6, 1)
    with open(os.path.join(DATA_DIR, "PdM_errors.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["datetime", "machineID", "errorID"])
        for i in range(1, num_machines + 1):
            for _ in range(random.randint(0, 10)):
                dt = start_date + timedelta(hours=random.randint(0, days * 24))
                error = f"error{random.randint(1, 5)}"
                writer.writerow([dt.strftime("%Y-%m-%d %H:%M:%S"), i, error])
            
            # Ensure Machine 14 has recent errors for the demo
            if i == 14:
                writer.writerow(["2015-06-29 10:00:00", 14, "error1"])
                writer.writerow(["2015-06-29 14:00:00", 14, "error3"])
                writer.writerow(["2015-06-30 08:00:00", 14, "error1"])

def generate_maint(num_machines=100):
    start_date = datetime(2014, 1, 1)
    with open(os.path.join(DATA_DIR, "PdM_maint.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["datetime", "machineID", "comp"])
        for i in range(1, num_machines + 1):
            for _ in range(random.randint(1, 5)):
                dt = start_date + timedelta(days=random.randint(0, 500))
                comp = f"comp{random.randint(1, 4)}"
                writer.writerow([dt.strftime("%Y-%m-%d %H:%M:%S"), i, comp])
                
            if i == 14:
                # Add an old maintenance record to show it is overdue
                writer.writerow(["2014-06-01 00:00:00", 14, "comp3"])

def generate_failures(num_machines=100):
    start_date = datetime(2015, 6, 1)
    with open(os.path.join(DATA_DIR, "PdM_failures.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["datetime", "machineID", "failure"])
        for i in range(1, num_machines + 1):
            if random.random() < 0.1: # 10% chance of failure
                dt = start_date + timedelta(days=random.randint(0, 25))
                comp = f"comp{random.randint(1, 4)}"
                writer.writerow([dt.strftime("%Y-%m-%d %H:%M:%S"), i, comp])
                
            if i == 14:
                writer.writerow(["2015-06-30 06:00:00", 14, "comp3"])

if __name__ == "__main__":
    print("Generating synthetic Microsoft PdM dataset...")
    generate_machines()
    generate_telemetry()
    generate_errors()
    generate_maint()
    generate_failures()
    print("Done! CSVs generated in data/ folder.")
