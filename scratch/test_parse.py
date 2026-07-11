import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "data")
KB_DIR = os.path.join(DATA_DIR, "knowledge_base")
CASES_DIR = os.path.join(DATA_DIR, "cases")

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
    
    # If is_case, the global metadata is in the first part between ---
    if is_case:
        if "---" in first_part:
            meta_split = first_part.split("---")
            if len(meta_split) >= 3:
                global_metadata = parse_metadata_block(meta_split[1])
    
    for idx, part in enumerate(parts):
        if idx == 0:
            # If not a case, the first part is just header, skip it or check if it has a section
            if not is_case and "---" in part:
                # Handled below
                pass
            else:
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

# Test on one manual and one case
print("Testing manual parsing:")
manual_path = os.path.join(KB_DIR, "hydraulic_system_manual.md")
manual_sections = parse_markdown_document(manual_path, is_case=False)
for sec in manual_sections:
    print(f"Title: {sec['document_title']}")
    print(f"Section: {sec['section']}")
    print(f"Metadata: {sec['metadata']}")
    print(f"Content Length: {len(sec['content'])}")
    print("---")

print("\nTesting case parsing:")
case_path = os.path.join(CASES_DIR, "case_01.md")
case_sections = parse_markdown_document(case_path, is_case=True)
for sec in case_sections:
    print(f"Title: {sec['document_title']}")
    print(f"Section: {sec['section']}")
    print(f"Metadata: {sec['metadata']}")
    print(f"Content Length: {len(sec['content'])}")
    print("---")
