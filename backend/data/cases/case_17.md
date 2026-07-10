# Historical Failure Case: Case 17
---
case_id: CASE-17
model: model2
component: comp2
failure_mode: Lubrication Starvation
sensor: Volt
subsystem: Power Unit
source: historical_case
---

## Section 1: Incident Description
- **Machine Model**: model2
- **Symptoms**: High motor casing temperature and current draw fluctuation
- **Root Cause**: Dry lubrication causing friction wear in drive coupling
- **Resolution**: Replaced drive coupling assembly (comp2) and packed with lithium grease
- **Downtime**: 3 hours
- **Lessons Learned**: Ensure lubrication schedule matches machine load factor

## Section 2: Telemetry Data Observations
During the 24 hours preceding failure:
* Vibration reached a peak of 47.2 units (normal: <25).
* Operating pressure drop to 67 PSI.
* Motor current drew high voltage spikes.