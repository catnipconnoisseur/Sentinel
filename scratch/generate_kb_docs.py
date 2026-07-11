import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data")
KB_DIR = os.path.join(DATA_DIR, "knowledge_base")
CASES_DIR = os.path.join(DATA_DIR, "cases")

os.makedirs(KB_DIR, exist_ok=True)
os.makedirs(CASES_DIR, exist_ok=True)

# ─── Define the 10 Shared Manuals & SOPs ───────────────────────────
manuals = {
    "hydraulic_system_manual.md": """# Hydraulic System Manual

## Section 1: Pump Cavitation & Seal Wear
---
component: Hydraulic Pump
failure_mode: Seal Wear
sensor: Pressure
subsystem: Fluid Power
severity: high
keywords: pump, cavitation, seal, pressure drop, vibration, leakage
---
### Overview
The hydraulic pump provides system flow and pressure. Degradation of the pump seals leads to bypass leakage, reduced volumetric efficiency, and pressure fluctuations.
### Typical Sensor Patterns
A sudden drop in operating pressure below 85 PSI (normal operating range: 95-105 PSI) accompanied by a high-frequency vibration spike above 45 units.
### Early Warning Signs
Subtle micro-oscillations in telemetry pressure readings during active load phases, paired with a slow temperature increase of the pump housing.
### Expected Telemetry Trends
A steady, non-linear pressure decline over a 12-hour period. Voltage spikes may occur as the drive motor draws more current to maintain flow.
### Failure Progression
Minor seal abrasions -> micro-bypass leakage -> local pressure drop -> pump cavitation -> catastrophic internal impeller failure.
### Recovery Procedure
1. Initiate emergency shutdown.
2. Relieve fluid pressure.
3. Drain pump housing.
4. Replace primary seal kit (comp4).
5. Flush system and refill hydraulic fluid.
### Safety Notes
High-pressure fluid injection hazard. Never inspect hydraulic lines under pressure.

## Section 2: Accumulator Maintenance
---
component: Accumulator
failure_mode: Bladder Rupture
sensor: Pressure
subsystem: Fluid Power
severity: critical
keywords: accumulator, bladder rupture, pressure drop, gas precharge
---
### Overview
The accumulator stores energy to damp pressure shocks. A ruptured bladder causes immediate loss of damping capability.
### Typical Sensor Patterns
Severe, high-amplitude pressure spikes followed by a sudden permanent pressure drop below 60 PSI.
### Failure Progression
Bladder elastomeric fatigue -> minor gas leakage -> bladder rupture -> hydraulic fluid fills gas volume -> complete pressure loss.
### Recovery Procedure
Isolate accumulator, dump pressure, replace internal nitrogen bladder.
""",

    "bearing_maintenance_guide.md": """# Bearing Maintenance Guide

## Section 1: Bearing Wear & Lubrication Starvation
---
component: Bearings
failure_mode: Bearing Wear
sensor: Vibration
subsystem: Drive Train
severity: high
keywords: bearing, lubrication, wear, friction, vibration spike, heating
---
### Overview
Bearings support rotating elements. Lubricant degradation or starvation leads to metallic contact, heat generation, and race fatigue.
### Typical Sensor Patterns
Vibration levels rising above 45 units (normal: < 25 units) combined with rotation speed anomalies or voltage fluctuations.
### Early Warning Signs
Low-frequency vibration humming (25-35 units) and a steady rise in motor temperature.
### Expected Telemetry Trends
Exponential rise in vibration over a 24-hour window, while rotation speed (rotate) drops due to friction.
### Common Misdiagnoses
Miscalibrated vibration sensor or minor imbalance. Inspect lubrication before replacing the entire bearing assembly.
### Failure Progression
Lubricant depletion -> micro-pitting -> spalling of races -> severe friction -> bearing lockup (seizure).
### Recovery Procedure
1. Power down machine.
2. Flush bearing race.
3. Check shaft alignment.
4. Replace bearing assembly (comp3).
5. Pack with high-temperature grease.
### Safety Notes
Hot surfaces hazard. Allow bearings to cool before touching.

## Section 2: Shaft Alignment
---
component: Bearings
failure_mode: Misalignment
sensor: Vibration
subsystem: Drive Train
severity: medium
keywords: shaft, alignment, misalignment, coupling, vibration
---
### Overview
Shaft misalignment causes excessive radial forces on the bearings, causing accelerated wear.
### Typical Sensor Patterns
Consistent vibration above 35 units at double the rotation frequency.
### Failure Progression
Coupling bolt looseness -> shaft shift -> bearing overload -> bearing cage failure.
""",

    "compressor_troubleshooting_manual.md": """# Compressor Troubleshooting Manual

## Section 1: Compressor Valve Degradation
---
component: Compressor
failure_mode: Valve Wear
sensor: Pressure
subsystem: Pneumatic System
severity: high
keywords: compressor, valve wear, pressure drop, thermal overload
---
### Overview
Compressor suction/discharge valves regulate air flow. Valve fatigue or scoring prevents proper compression cycles.
### Typical Sensor Patterns
Pressure unable to exceed 80 PSI despite full rotation speed (rotate > 420 RPM).
### Typical Symptoms
Continuous operation of the compressor without reaching auto-cutout pressure, accompanied by high discharge temperature.
### Expected Telemetry Trends
Vibration rises slowly to 40 units while pressure stabilizes below normal threshold.
### Failure Progression
Valve spring wear -> valve plate leakage -> compression loss -> thermal compressor lockup.
### Recovery Procedure
Replace cylinder valve head assembly (comp1), clean carbon deposits.
### Safety Notes
Compressor heads reach extremely high temperatures. Wear thermal gloves.
""",

    "motor_maintenance_manual.md": """# Motor Maintenance Manual

## Section 1: Motor Overheating & Winding Insulation Failure
---
component: Motor
failure_mode: Insulation Failure
sensor: Volt
subsystem: Power Unit
severity: critical
keywords: motor, overheating, insulation, voltage spike, current draw
---
### Overview
Insulation failure in motor windings leads to phase-to-phase shorts, severe overheating, and motor failure.
### Typical Sensor Patterns
Voltage spikes above 185V (normal: 170V) followed by current trips and high vibration.
### Expected Telemetry Trends
High voltage oscillations followed by a drop in motor rotation speed.
### Recovery Procedure
Rewind motor stator or replace motor drive assembly (comp1).
### Safety Notes
Lockout-tagout (LOTO) is mandatory before opening the terminal box.
""",

    "lubrication_sop.md": """# Lubrication Standard Operating Procedure (SOP)

## Section 1: Bearing Lubrication Procedure
---
component: Bearings
failure_mode: Lubrication Starvation
sensor: Vibration
subsystem: General Maintenance
severity: medium
keywords: lubrication, grease, oil, maintenance, schedule
---
### Overview
Standard lubrication keeps bearings within thermal limits.
### Preventive Maintenance Notes
Apply grade-2 lithium grease every 3 months. Over-greasing causes seal damage.
### Recovery Procedure
Purge old grease, check for metallic particles, inject 15ml fresh grease.
""",

    "preventive_maintenance_sop.md": """# Preventive Maintenance SOP

## Section 1: Weekly Inspection Checklists
---
component: General
failure_mode: Loosening
sensor: Vibration
subsystem: General Maintenance
severity: low
keywords: inspection, check, checklist, bolts, belts
---
### Overview
Weekly routine walkdowns to ensure structural integrity.
### Inspection Procedures
Check belt tension (comp4), inspect mounting bolts, monitor vibration levels manually.
""",

    "pressure_system_inspection_procedure.md": """# Pressure System Inspection Procedure

## Section 1: Pneumatic Line Integrity
---
component: Pneumatic Lines
failure_mode: Line Leakage
sensor: Pressure
subsystem: Pneumatic System
severity: high
keywords: pneumatic, pressure drop, air leak, tubing, fittings
---
### Overview
Tubing and joint integrity ensures consistent tool actuation.
### Typical Sensor Patterns
System pressure drops from 100 PSI to below 75 PSI over several hours.
### Recovery Procedure
Use bubble test to find leaks, replace pneumatic lines/hoses (comp4).
""",

    "vibration_diagnosis_guide.md": """# Vibration Diagnosis Guide

## Section 1: Imbalance & Mechanical Looseness
---
component: Drive Train
failure_mode: Imbalance
sensor: Vibration
subsystem: Drive Train
severity: medium
keywords: vibration, imbalance, loose, resonance, harmonic
---
### Overview
Imbalance in rotating components generates centrifugal forces that stress bearings.
### Typical Sensor Patterns
Vibration spikes proportional to the square of rotation speed (vibration > 40 units).
### Recovery Procedure
Perform dynamic balancing, torque motor mount bolts.
""",

    "emergency_shutdown_procedure.md": """# Emergency Shutdown Procedure

## Section 1: High Risk Over-Limit Protocol
---
component: General
failure_mode: Thermal Runaway
sensor: Volt
subsystem: Safety System
severity: critical
keywords: emergency shutdown, safety, trip, limit, power cut
---
### Overview
Safety protocol for critical thresholds.
### Trigger Thresholds
- Voltage > 190V
- Vibration > 55 units
- Pressure < 50 PSI during load
### Recovery Procedure
Press emergency stop, isolate mains, consult electrical/mechanical lead.
""",

    "sensor_calibration_manual.md": """# Sensor Calibration Manual

## Section 1: Pressure & Vibration Sensor Drift
---
component: Sensors
failure_mode: Sensor Drift
sensor: Pressure
subsystem: Instrumentation
severity: low
keywords: calibration, sensor drift, offset, noise
---
### Overview
Sensor wear causes reading drift, leading to false warnings or missed faults.
### Inspection Procedures
Compare sensor readings with manual dial gauges. Recalibrate if variance exceeds 3%.
"""
}

for name, content in manuals.items():
    filepath = os.path.join(KB_DIR, name)
    with open(filepath, "w") as f:
        f.write(content.strip())
print(f"Generated {len(manuals)} manuals in {KB_DIR}")

# ─── Define the 25 Historical Case Reports ─────────────────────────
cases = {}
for i in range(1, 26):
    model = f"model{(i % 4) + 1}"
    comp = f"comp{(i % 4) + 1}"
    
    # Define a realistic narrative based on component index
    if comp == "comp1":
        symptoms = "Reduced flow and high pressure loss during cycles"
        root_cause = "Compressor discharge valve crack leading to air recycle"
        resolution = "Replaced compressor valve assembly (comp1) and cleaned cylinder"
        downtime = "4 hours"
        lessons = "Incorporate quarterly valve pressure checks into PM schedule"
        failure_mode = "Valve Wear"
        sensor = "Pressure"
        subsystem = "Pneumatic System"
    elif comp == "comp2":
        symptoms = "High motor casing temperature and current draw fluctuation"
        root_cause = "Dry lubrication causing friction wear in drive coupling"
        resolution = "Replaced drive coupling assembly (comp2) and packed with lithium grease"
        downtime = "3 hours"
        lessons = "Ensure lubrication schedule matches machine load factor"
        failure_mode = "Lubrication Starvation"
        sensor = "Volt"
        subsystem = "Power Unit"
    elif comp == "comp3":
        symptoms = "Exponential rise in vibration levels up to 48 units"
        root_cause = "Inner race fatigue and micro-pitting on main bearing"
        resolution = "Replaced bearing housing assembly (comp3) and verified alignment"
        downtime = "6 hours"
        lessons = "Replace bearings immediately when vibration exceeds 35 units"
        failure_mode = "Bearing Wear"
        sensor = "Vibration"
        subsystem = "Drive Train"
    else:
        symptoms = "Sudden system pressure drop below 70 PSI during tool actuation"
        root_cause = "Degraded pneumatic actuator seal resulting in severe air leakage"
        resolution = "Replaced pneumatic lines and seals (comp4)"
        downtime = "2 hours"
        lessons = "Regularly inspect seal elasticity in high moisture conditions"
        failure_mode = "Line Leakage"
        sensor = "Pressure"
        subsystem = "Pneumatic System"

    filename = f"case_{i:02d}.md"
    cases[filename] = f"""# Historical Failure Case: Case {i:02d}
---
case_id: CASE-{i:02d}
model: {model}
component: {comp}
failure_mode: {failure_mode}
sensor: {sensor}
subsystem: {subsystem}
source: historical_case
---

## Section 1: Incident Description
- **Machine Model**: {model}
- **Symptoms**: {symptoms}
- **Root Cause**: {root_cause}
- **Resolution**: {resolution}
- **Downtime**: {downtime}
- **Lessons Learned**: {lessons}

## Section 2: Telemetry Data Observations
During the 24 hours preceding failure:
* Vibration reached a peak of 47.2 units (normal: <25).
* Operating pressure drop to {50 + (i % 25)} PSI.
* Motor current drew high voltage spikes.
"""

for name, content in cases.items():
    filepath = os.path.join(CASES_DIR, name)
    with open(filepath, "w") as f:
        f.write(content.strip())
print(f"Generated {len(cases)} historical cases in {CASES_DIR}")
