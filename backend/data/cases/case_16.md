# Historical Failure Case: Case 16
---
case_id: CASE-16
model: model1
component: comp1
failure_mode: Valve Wear
sensor: Pressure
subsystem: Pneumatic System
source: historical_case
---

## Section 1: Incident Description
- **Machine Model**: model1
- **Symptoms**: Reduced flow and high pressure loss during cycles
- **Root Cause**: Compressor discharge valve crack leading to air recycle
- **Resolution**: Replaced compressor valve assembly (comp1) and cleaned cylinder
- **Downtime**: 4 hours
- **Lessons Learned**: Incorporate quarterly valve pressure checks into PM schedule

## Section 2: Telemetry Data Observations
During the 24 hours preceding failure:
* Vibration reached a peak of 47.2 units (normal: <25).
* Operating pressure drop to 66 PSI.
* Motor current drew high voltage spikes.