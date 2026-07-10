# Bearing Maintenance Guide

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