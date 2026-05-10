from config.database import query

def check_plagiarism(doc_id: int, threshold: int = 70):
    # Retrieve document text (in a real scenario, this would extract text from a file)
    doc = query("SELECT id, name, status FROM documents WHERE id = %s", (doc_id,))
    if not doc:
        return {"error": "Document not found"}
        
    # Placeholder for actual similarity algorithm
    # e.g., querying against a vector DB or simple sequence matcher against other documents
    
    # Mocking plagiarism detection logic:
    # We pretend document ID mod 10 > 7 is a plagiarism trigger for demonstration
    similarity_score = (doc_id * 13) % 100
    
    is_plagiarized = similarity_score > threshold
    
    return {
        "doc_id": doc_id,
        "similarity_score": similarity_score,
        "threshold": threshold,
        "is_plagiarized": is_plagiarized,
        "matches": [
            {"source_doc_id": doc_id - 1, "match_percentage": similarity_score}
        ] if is_plagiarized else []
    }
