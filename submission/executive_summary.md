# Project Executive Summary: Sentinel

## 1. Project Overview
**Sentinel** is an **AI Industrial Investigation Agent** designed for Track 3: Unicorn (Open Innovation). It goes beyond traditional threshold-based predictive maintenance dashboards, which simply highlight anomalies. Sentinel behaves like an experienced Senior Reliability Engineer, automatically auditing telemetry trends, maintenance histories, and error logs, and comparing them against technical manuals and standard operating procedures (SOPs) to produce high-fidelity, root-cause incident reports.

## 2. Problem Statement
Industrial plants are inundated with raw sensor telemetry, error logs, and legacy work order histories. When a machine fails or behaves abnormally, reliability teams must manually comb through:
- Scattered historical work logs.
- Thousand-page OEM engineering manuals.
- Conflicting sensor signals.
This manual Root Cause Analysis (RCA) process is slow, prone to cognitive overload, and often misses subtle warning signs, leading to repeated equipment failures and catastrophic downtime costs.

## 3. The Solution: Sentinel
Sentinel solves this by integrating:
- **Relational Databases (SQLite):** Aggregates structured telemetry data and maintenance logs.
- **Vector Databases (ChromaDB):** Indexes and retrieves OEM machinery manuals, SOPs, and historical failure cases.
- **Fireworks AI (Llama 3.1 70B & GLM):** Executes a deep, structured engineering reasoning loop, generating a dynamic causal graph (visualized in React Flow) explaining exactly how the system degraded, what evidence supports the diagnosis, and why competing hypotheses were rejected.

## 4. Key Differentiators & Innovation
- **Engineering Self-Challenge Audit:** Evaluates the final diagnosis against contradicting signals and lists additional verification evidence needed.
- **Traceable Attribution:** Every node in the reasoning graph maps directly to live telemetry anomalies or Technical Manual excerpts.
- **Dynamic Causal Graphs:** React Flow graph structures are generated in real-time, matching physical dependencies rather than static, predefined visual templates.
- **Fast, Contrained Structured Outputs:** Leverages Fireworks AI's JSON-schema grammar compiler on AMD Instinct MI300X accelerators to guarantee valid schemas under 28 seconds.
