# Motor Maintenance Manual

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