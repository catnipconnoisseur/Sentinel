# Technical Overview: Sentinel Architecture & Data Pipeline

## 1. System Architecture
Sentinel consists of a modern, containerized stack designed for rapid time-to-first-token and strict data safety:

```
[ React Frontend ]
       │ (HTTP POST /api/investigate)
       ▼
[ FastAPI Backend ]
       │ 
       ├─► [ RAG Pipeline ] ──► [ ChromaDB Vector DB ] (Manuals, SOPs, Historical Cases)
       ├─► [ SQLite DB ] ──────► Telemetry Summary, Error Logs, Maintenance History
       ▼
[ Fireworks AI API ] (Served on AMD Instinct™ MI300X Accelerators)
       │ (JSON Schema-Constrained Inference)
       ▼
[ Causal Reasoning Graph ] ──► [ React Flow Dashboard UI ]
```

---

## 2. Advanced AI Reasoning Pipeline
Unlike generic chatbot agents, Sentinel executes a highly structured 10-step failure analysis workflow to prevent model hallucinations and generate engineering-grade reports:

1. **Context Construction:** Retrieves 24h of telemetry stats (min/max/average), 7d of error logs, and 7d of maintenance logs for the targeted machine ID.
2. **Knowledge Retrieval (RAG):** Queries ChromaDB with telemetry anomalies to extract relevant sections of:
   - OEM Machinery Manuals.
   - Standard Operating Procedures (SOPs).
   - Historical Incident Reports.
3. **Hypothesis Generation:** Formulates competing failure hypotheses (e.g., motor winding insulation breakdown vs. hydraulic pump cavitation).
4. **Hypothesis Evaluation:** Scores each candidate based on telemetry triggers and historical similarities.
5. **Self-Challenge Audit:** Actively searches logs for contradicting evidence (e.g., recent component replacements) to penalize the primary diagnosis.
6. **Chronological Reconstruction:** Matches timestamps of anomalies to build an event timeline.
7. **Action Priority Assignment:** Classifies recommended actions into Immediate (<1h), Short-term (<24h), and preventive long-term phases.
8. **Justification Mapping:** Formulates engineering justifications for each recommendation.
9. **Causal Node layout:** Resolves nodes and edges mapping physical causal lines.
10. **JSON Schema Compilation:** Validates the compiled output against the Pydantic `InvestigationResult` schema.

---

## 3. Technology Stack & Integrations
- **Frontend:** React, Vite, XYFlow (React Flow), Recharts, TailwindCSS.
- **Backend:** FastAPI, Python, SQLAlchemy, SQLite.
- **AI & RAG:** Fireworks AI API (Llama 3.1 70B Instruct / GLM), ChromaDB, Sentence-Transformers.
- **Compute Layer:** Powered by **AMD Instinct™ MI300X GPU accelerators** (via Fireworks hosting), achieving sub-30s inference.
- **Containerization:** Docker, Docker Compose, Nginx.
