import os
import chromadb
from chromadb.config import Settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
CHROMA_DB_DIR = os.path.join(DATA_DIR, "chromadb")
MANUALS_DIR = os.path.join(DATA_DIR, "manuals")

# Initialize ChromaDB persistent client
# By default, Chroma uses all-MiniLM-L6-v2 ONNX model for embeddings, which runs efficiently locally
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(anonymized_telemetry=False))
manuals_collection = chroma_client.get_or_create_collection(name="machine_manuals")

def _chunk_text(text, chunk_size=500, overlap=50):
    """Simple character-based chunking for markdown files."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

def index_manuals():
    """Reads synthetic markdown manuals and indexes them into ChromaDB."""
    print("Indexing manuals into ChromaDB...")
    
    if not os.path.exists(MANUALS_DIR):
        print(f"Directory {MANUALS_DIR} not found. Generate manuals first.")
        return
        
    for filename in os.listdir(MANUALS_DIR):
        if filename.endswith(".md"):
            model_name = filename.replace(".md", "")
            filepath = os.path.join(MANUALS_DIR, filename)
            
            with open(filepath, "r") as f:
                text = f.read()
                
            chunks = _chunk_text(text)
            
            # Prepare for ChromaDB
            ids = [f"{model_name}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [{"model": model_name, "source": "manual"} for _ in chunks]
            
            # Upsert into collection
            manuals_collection.upsert(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )
            print(f"Indexed {len(chunks)} chunks for {model_name}")
            
    print("Manuals indexed successfully.")

def search_manuals(query: str, model_name: str, n_results: int = 2):
    """Retrieve relevant manual sections for a given model."""
    results = manuals_collection.query(
        query_texts=[query],
        n_results=n_results,
        where={"model": model_name}
    )
    
    if not results["documents"] or not results["documents"][0]:
        return []
        
    return results["documents"][0]

if __name__ == "__main__":
    index_manuals()
