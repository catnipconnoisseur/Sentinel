# Historical Failure Case: Case 14
---
case_id: CASE-14
model: model3
component: comp3
failure_mode: Bearing Wear
sensor: Vibration
subsystem: Drive Train
source: historical_case
---

## Section 1: Incident Description
- **Machine Model**: model3
- **Symptoms**: Exponential rise in vibration levels up to 48 units
- **Root Cause**: Inner race fatigue and micro-pitting on main bearing
- **Resolution**: Replaced bearing housing assembly (comp3) and verified alignment
- **Downtime**: 6 hours
- **Lessons Learned**: Replace bearings immediately when vibration exceeds 35 units

## Section 2: Telemetry Data Observations
During the 24 hours preceding failure:
* Vibration reached a peak of 47.2 units (normal: <25).
* Operating pressure drop to 64 PSI.
* Motor current drew high voltage spikes.