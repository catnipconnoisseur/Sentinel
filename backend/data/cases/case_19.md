# Historical Failure Case: Case 19
---
case_id: CASE-19
model: model4
component: comp4
failure_mode: Line Leakage
sensor: Pressure
subsystem: Pneumatic System
source: historical_case
---

## Section 1: Incident Description
- **Machine Model**: model4
- **Symptoms**: Sudden system pressure drop below 70 PSI during tool actuation
- **Root Cause**: Degraded pneumatic actuator seal resulting in severe air leakage
- **Resolution**: Replaced pneumatic lines and seals (comp4)
- **Downtime**: 2 hours
- **Lessons Learned**: Regularly inspect seal elasticity in high moisture conditions

## Section 2: Telemetry Data Observations
During the 24 hours preceding failure:
* Vibration reached a peak of 47.2 units (normal: <25).
* Operating pressure drop to 69 PSI.
* Motor current drew high voltage spikes.