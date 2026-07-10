import os
import chromadb
from chromadb.config import Settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
CHROMA_DB_DIR = os.path.join(DATA_DIR, "chromadb")
KB_DIR = os.path.join(DATA_DIR, "knowledge_base")
CASES_DIR = os.path.join(DATA_DIR, "cases")

chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(anonymized_telemetry=False))
manuals_collection = chroma_client.get_or_create_collection(name="machine_manuals")

# Warmup: force the sentence-transformer embedding model to load at startup.
# count() does NOT trigger model init — only query() does.
# Without this, the first investigation absorbs a ~500ms cold-start penalty.
try:
    manuals_collection.query(query_texts=["warmup"], n_results=1)
    print(f"[embeddings] ChromaDB warmed up — {manuals_collection.count()} chunks indexed")
except Exception as _e:
    print(f"[embeddings] ChromaDB warmup skipped: {_e}")


def parse_metadata_block(block_text: str) -> dict:
    metadata = {}
    for line in block_text.strip().split("\n"):
        if ":" in line:
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip()
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            metadata[key] = value
    return metadata

def parse_markdown_document(filepath: str, is_case: bool = False):
    with open(filepath, "r") as f:
        text = f.read()
    
    # Extract document title
    doc_title = "Unknown Document"
    for line in text.split("\n"):
        if line.startswith("# "):
            doc_title = line.replace("# ", "").strip()
            break
            
    sections = []
    global_metadata = {}
    
    parts = text.split("\n## ")
    first_part = parts[0]
    
    if is_case:
        if "---" in first_part:
            meta_split = first_part.split("---")
            if len(meta_split) >= 3:
                global_metadata = parse_metadata_block(meta_split[1])
    
    for idx, part in enumerate(parts):
        if idx == 0:
            continue
            
        lines = part.split("\n")
        section_title = lines[0].strip()
        section_body = "\n".join(lines[1:])
        
        metadata = global_metadata.copy()
        content = section_body
        
        if "---" in section_body:
            meta_split = section_body.split("---", 2)
            if len(meta_split) >= 3:
                local_meta = parse_metadata_block(meta_split[1])
                metadata.update(local_meta)
                content = meta_split[2]
                
        sections.append({
            "document_title": doc_title,
            "section": section_title,
            "metadata": metadata,
            "content": content.strip()
        })
        
    return sections

def index_manuals():
    """Reads synthetic markdown manuals and cases and indexes them into ChromaDB."""
    print("Rebuilding manuals and cases collection in ChromaDB...")
    
    global manuals_collection
    try:
        chroma_client.delete_collection(name="machine_manuals")
    except Exception:
        pass
    manuals_collection = chroma_client.create_collection(name="machine_manuals")
    
    # 1. Index Shared Manuals and SOPs
    if os.path.exists(KB_DIR):
        for filename in os.listdir(KB_DIR):
            if filename.endswith(".md"):
                filepath = os.path.join(KB_DIR, filename)
                sections = parse_markdown_document(filepath, is_case=False)
                
                for idx, sec in enumerate(sections):
                    doc_id = f"{filename.replace('.md', '')}_sec_{idx}"
                    
                    # Determine source: sop or manual
                    source_type = "sop" if "sop" in filename.lower() or "procedure" in filename.lower() else "manual"
                    
                    # Construct metadata dictionary with string values
                    metadata = {
                        "document_title": sec["document_title"],
                        "section": sec["section"],
                        "source": source_type,
                        "component": sec["metadata"].get("component", "None"),
                        "failure_mode": sec["metadata"].get("failure_mode", "None"),
                        "sensor": sec["metadata"].get("sensor", "None"),
                        "subsystem": sec["metadata"].get("subsystem", "None"),
                        "severity": sec["metadata"].get("severity", "None"),
                        "keywords": sec["metadata"].get("keywords", "")
                    }
                    
                    manuals_collection.upsert(
                        documents=[sec["content"]],
                        metadatas=[metadata],
                        ids=[doc_id]
                    )
        print("Indexed shared manuals and SOPs.")
    else:
        print(f"Directory {KB_DIR} not found.")

    # 2. Index Historical Cases
    if os.path.exists(CASES_DIR):
        for filename in os.listdir(CASES_DIR):
            if filename.endswith(".md"):
                filepath = os.path.join(CASES_DIR, filename)
                sections = parse_markdown_document(filepath, is_case=True)
                
                for idx, sec in enumerate(sections):
                    doc_id = f"{filename.replace('.md', '')}_sec_{idx}"
                    
                    metadata = {
                        "document_title": sec["document_title"],
                        "section": sec["section"],
                        "source": "historical_case",
                        "model": sec["metadata"].get("model", "None"),
                        "component": sec["metadata"].get("component", "None"),
                        "failure_mode": sec["metadata"].get("failure_mode", "None"),
                        "sensor": sec["metadata"].get("sensor", "None"),
                        "subsystem": sec["metadata"].get("subsystem", "None")
                    }
                    
                    manuals_collection.upsert(
                        documents=[sec["content"]],
                        metadatas=[metadata],
                        ids=[doc_id]
                    )
        print("Indexed historical case reports.")
    else:
        print(f"Directory {CASES_DIR} not found.")
        
    print(f"Rebuild complete. Total chunks in collection: {manuals_collection.count()}")

def search_manuals(query: str, n_results: int = 3):
    """Retrieve relevant manual/SOP sections for a given query.
    Uses a server-side where filter to ensure only manuals/SOPs are returned,
    preventing historical cases from dominating the top-N results.
    """
    # Use $or filter so ChromaDB restricts candidates to manuals and SOPs only
    results = manuals_collection.query(
        query_texts=[query],
        n_results=n_results,
        where={"$or": [{"source": {"$eq": "manual"}}, {"source": {"$eq": "sop"}}]}
    )
    
    if not results["documents"] or not results["documents"][0]:
        return []
        
    items = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        items.append({
            "content": doc,
            "document_title": meta.get("document_title"),
            "section": meta.get("section"),
            "source": meta.get("source"),
            "metadata": meta
        })
    return items

def search_historical_cases(query: str, model_name: str, n_results: int = 2):
    """Retrieve relevant historical cases for a given model and query.
    Fetches broadly from historical cases then filters by model to find
    cases from the same machine type.
    """
    # Fetch a larger pool from the historical_case source, then filter by model
    fetch_n = max(n_results * 5, 15)  # Fetch enough to find same-model matches
    results = manuals_collection.query(
        query_texts=[query],
        n_results=fetch_n,
        where={"source": {"$eq": "historical_case"}}
    )
    
    if not results["documents"] or not results["documents"][0]:
        return []
        
    filtered = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        # Prefer same-model cases (closer analogy), but accept any if none match
        if meta.get("model") == model_name:
            filtered.append({
                "content": doc,
                "document_title": meta.get("document_title"),
                "section": meta.get("section"),
                "source": meta.get("source"),
                "metadata": meta
            })
            if len(filtered) >= n_results:
                break
    return filtered

if __name__ == "__main__":
    index_manuals()

