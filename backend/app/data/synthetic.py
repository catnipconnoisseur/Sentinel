import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
MANUALS_DIR = os.path.join(DATA_DIR, "manuals")

def generate_manuals():
    os.makedirs(MANUALS_DIR, exist_ok=True)
    
    # We have 4 models: model1, model2, model3, model4
    manuals = {
        "model1": """# Sentinel Machine Manual: Model 1
        
## Section 1: Overview
Model 1 is a heavy-duty industrial lathe designed for continuous operation. It operates optimally at a voltage of 170V. 

## Section 2: Maintenance Schedule
- **comp1**: Inspect every 6 months. Replace every 24 months.
- **comp2**: Lubricate every 3 months. Replace every 36 months.
- **comp3**: Replace bearings every 18 months under standard load.
- **comp4**: Replace drive belt every 12 months.

## Section 3: Troubleshooting
- **error1**: Overheating detected. Check cooling system and pressure. Normal pressure is 95-105 PSI.
- **error2**: Voltage spike. If voltage exceeds 185V, initiate emergency shutdown.
- **error3**: High vibration. Vibration above 45 units indicates severe bearing wear in comp3.
- **error4**: Sensor communication failure.
- **error5**: Emergency stop engaged.
""",
        "model2": """# Sentinel Machine Manual: Model 2
        
## Section 1: Overview
Model 2 is a high-speed CNC router. Optimal rotation speed is 450 RPM.

## Section 2: Maintenance Schedule
- **comp1**: Replace every 12 months.
- **comp2**: Replace every 24 months.
- **comp3**: Replace bearings every 24 months.
- **comp4**: Replace spindle every 18 months.

## Section 3: Troubleshooting
- **error1**: Temperature warning.
- **error2**: Power fluctuation.
- **error3**: Spindle imbalance. Vibration above 50 units indicates comp4 failure.
- **error4**: Limit switch triggered.
- **error5**: Lubrication low.
""",
        "model3": """# Sentinel Machine Manual: Model 3
        
## Section 1: Overview
Model 3 is an automated assembly arm. Requires stable pressure around 100 PSI.

## Section 2: Maintenance Schedule
- **comp1**: Calibrate every 6 months.
- **comp2**: Replace actuators every 36 months.
- **comp3**: Replace joints every 48 months.
- **comp4**: Replace pneumatic lines every 24 months.

## Section 3: Troubleshooting
- **error1**: Pressure drop. If pressure drops below 85 PSI, comp4 may be leaking.
- **error2**: Voltage anomaly.
- **error3**: Excessive vibration.
- **error4**: Logic controller fault.
- **error5**: Payload dropped.
""",
        "model4": """# Sentinel Machine Manual: Model 4
        
## Section 1: Overview
Model 4 is a heavy press machine. 

## Section 2: Maintenance Schedule
- **comp1**: Inspect monthly. Replace every 12 months.
- **comp2**: Replace hydraulic fluid every 12 months.
- **comp3**: Replace seals every 24 months.
- **comp4**: Replace sensors every 36 months.

## Section 3: Troubleshooting
- **error1**: Hydraulic leak. Pressure below 90 PSI indicates comp3 failure.
- **error2**: Power fault.
- **error3**: Structural vibration.
- **error4**: Safety gate open.
- **error5**: Overload detected.
"""
    }
    
    for model, content in manuals.items():
        filepath = os.path.join(MANUALS_DIR, f"{model}.md")
        with open(filepath, "w") as f:
            f.write(content)
            
    print(f"Generated {len(manuals)} synthetic machine manuals in {MANUALS_DIR}")

if __name__ == "__main__":
    generate_manuals()
