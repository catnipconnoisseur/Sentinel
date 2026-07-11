# Architecture Details: Database & Vector Indexing

## 1. Relational Database Schema (SQLite)
Sentinel manages structured factory data across five primary tables:
- **`machines`**: Records `machine_id`, machinery `model`, and commissioning `age` (years).
- **`telemetry`**: Stores real-time sensor metrics at 1-hour intervals (`volt`, `rotate`, `pressure`, `vibration`, and `datetime`).
- **`errors`**: Logs transient machine events and fault codes (`error_id`, `datetime`).
- **`maintenance`**: Tracks physical part replacements and service dates (`comp`, `datetime`).
- **`failures`**: Logs major breakdown events (`failure`, `datetime`).

---

## 2. Shared Industrial Knowledge Base (ChromaDB)
Instead of hardcoding machinery manuals or duplicating information per machine, Sentinel maintains a unified vector library using ChromaDB with metadata-enhanced indexing:
- **Document Chunking:** PDF machinery manuals and SOPs are parsed and split into overlapping chunks (~200 words).
- **Embeddings:** Vectorized using sentence-transformers, allowing semantic semantic retrieval of context.
- **Richer Metadata Filtering:** Every vector is tagged with detailed fields for precise retrieval:
  - `source` (e.g. `manual`, `sop`, `historical_case`)
  - `document_title` (e.g. `Motor Maintenance Manual`)
  - `section` (e.g. `Section 3.2: Bearing Lubrication`)
  - `component` (e.g. `Bearing`, `Seal`, `Motor`)
  - `failure_mode` (e.g. `Insulation Failure`, `Cavitation`)
  - `sensor` (e.g. `Voltage`, `Vibration`, `Pressure`)

---

## 3. Dynamic Reasoning Graph Node Types
To ensure the generated reasoning graph is clear and structured, the FastAPI backend enforces a strict set of Pydantic `Literal` node types:
- **`telemetry`**: Highlighted sensor deviations (e.g., Voltage peak 189.3V).
- **`observed_symptom`**: Higher-level operational warnings (e.g., Abnormal motor oscillation).
- **`failure_mode`**: Evaluated failure hypotheses.
- **`root_cause`**: Identified initiating source of degradation.
- **`predictive_state`**: Anticipated sequence of unchecked failure.
- **`operational_risk`**: Immediate risk of continued operation.
- **`business_impact`**: Monetary or downtime cost warnings.
- **`immediate_action`**: Priority 1 safety steps (<1h).
- **`preventive_action`**: Long-term reliability maintenance.
