# Compressor Troubleshooting Manual

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