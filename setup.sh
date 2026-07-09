#!/bin/bash

# Setup script for data bootstrapping
echo "Setting up data for Sentinel..."

cd backend || exit

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 1. Generate CSVs
echo "Generating synthetic CSV data..."
python3 -m app.data.generate_synthetic_data

# 2. Load into SQLite
echo "Loading data into SQLite..."
python3 -m app.data.loader

# 3. Index manuals into ChromaDB
echo "Indexing manuals into ChromaDB..."
python3 -m app.services.embeddings

echo "Setup complete!"
