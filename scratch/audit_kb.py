import os
import chromadb
from chromadb.config import Settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data")
CHROMA_DB_DIR = os.path.join(DATA_DIR, "chromadb")

chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(anonymized_telemetry=False))
manuals_collection = chroma_client.get_collection(name="machine_manuals")

print("Collection name:", manuals_collection.name)
print("Count of items in collection:", manuals_collection.count())

all_items = manuals_collection.get()
metadatas = all_items.get("metadatas", [])
print(f"Total metadatas retrieved: {len(metadatas)}")

# Group by model and source
model_counts = {}
source_counts = {}
for meta in metadatas:
    model = meta.get("model", "unknown")
    source = meta.get("source", "unknown")
    model_counts[model] = model_counts.get(model, 0) + 1
    source_counts[source] = source_counts.get(source, 0) + 1

print("\nCounts grouped by Model:")
for model, count in model_counts.items():
    print(f"  {model}: {count} chunks")

print("\nCounts grouped by Source:")
for source, count in source_counts.items():
    print(f"  {source}: {count} chunks")
