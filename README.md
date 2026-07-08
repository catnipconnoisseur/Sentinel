# Sentinel — AI Reasoning Engine for Industrial Investigations

Sentinel transforms fragmented factory data (machine telemetry, error logs, maintenance records, and documentation) into explainable, interactive root-cause investigation graphs. Built for the **AMD Developer Challenge (Unicorn Track)**.

---

## 🚀 The Core Vision

Modern industrial environments do not suffer from a lack of data; they suffer from fragmented dashboards. When a machine fails, engineers must manually cross-reference telemetry spikes, error codes, past maintenance notes, and static PDF manuals to isolate the root cause.

Sentinel automate this entire diagnostic pipeline:
1. **Detects** machine anomalies (e.g. Critical Failure states).
2. **Retrieves** relevant contextual data (SQLite) and manual specifications (ChromaDB Vector Store).
3. **Reasons** across these sources using Fireworks AI.
4. **Visualizes** the diagnostic chain as an interactive, causal graph (React Flow).

---

## 🛠️ Tech Stack & AMD Integration

Sentinel is architected for maximum demo impact, execution simplicity, and high compatibility with the AMD compute ecosystem:

* **Frontend:** React, Vite, TailwindCSS, React Flow, Recharts.
* **Backend:** FastAPI (Python), SQLAlchemy, SQLite.
* **Vector DB & RAG:** ChromaDB using a local `all-MiniLM-L6-v2` ONNX embedding pipeline.
* **Inference Engine:** **Fireworks AI API** (utilizing `llama-v3p1-70b-instruct` with strict `json_schema` constraints).
  * *AMD Alignment:* Fireworks AI performs model inference on **AMD Instinct MI300X GPUs**, demonstrating high-throughput enterprise-grade AMD compute.

---

## 📁 Repository Structure

```
sentinel/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI widgets & graphs (React Flow, Recharts)
│   │   ├── hooks/               # Custom hooks (API state management)
│   │   └── api/                 # API client wrapper
│   └── vite.config.js
│
├── backend/                     # FastAPI backend application
│   ├── app/
│   │   ├── routers/             # Endpoint definitions (/api/machines, /api/investigate)
│   │   ├── services/            # Retriever (SQL + ChromaDB) & Reasoner (Fireworks AI)
│   │   ├── data/                # Data loader & synthetic dataset generators
│   │   ├── database.py          # SQLAlchemy connection
│   │   ├── models.py            # SQLite ORM models
│   │   └── schemas.py           # Pydantic validation schemas
│   └── requirements.txt
│
└── README.md
```

---

## ⚡ Setup & Run Instructions

### Prerequisites
* Python 3.9+
* Node.js (with npm)
* A Fireworks AI API Key

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory:
   ```env
   FIREWORKS_API_KEY=your_fireworks_api_key_here
   ```
5. Generate the synthetic dataset and populate the database:
   ```bash
   python3 app/data/synthetic.py
   PYTHONPATH=. python3 app/data/loader.py
   PYTHONPATH=. python3 app/services/embeddings.py
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

---

## 🎯 Demo Path

1. **Factory Overview:** The dashboard lists 100 machines. **Machine 14** is marked in a **Critical** state (red status dot) due to a simulated component breakdown.
2. **Investigation Interface:** Click on Machine 14 to see its historical telemetry, errors, and maintenance records.
3. **Ask Sentinel:** Ask `"Why did this machine fail yesterday?"` and run the investigation.
4. **Interactive Causal Graph:** Watch the reasoning graph dynamically construct, linking the overdue maintenance warning to bearing degradation, high vibration anomalies, and the final mechanical failure.
5. **Inspect Evidence:** Click on any node in the graph (such as the "Bearing Wear" node) to slide out the evidence drawer, showcasing exact telemetry numbers and sections of the machine manual.
