#!/bin/bash
set -e

# Check if the database exists
if [ ! -f "./data/sentinel.db" ]; then
    echo "============================================================"
    echo "First run detected! Bootstrapping data and knowledge base..."
    echo "============================================================"
    
    echo "1/3 Generating synthetic telemetry and history..."
    python -m app.data.generate_synthetic_data
    
    echo "2/3 Loading data into SQLite..."
    python -m app.data.loader
    
    echo "3/3 Indexing knowledge base into ChromaDB..."
    python -m app.services.embeddings
    
    echo "============================================================"
    echo "Bootstrap complete!"
    echo "============================================================"
else
    echo "Data already exists. Skipping bootstrap."
fi

echo "Starting Sentinel API..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
