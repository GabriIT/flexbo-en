"""
Simple FAQ loader without embeddings - just loads Q&A from CSV
Uses string similarity matching instead of vector embeddings
"""
import os
import pandas as pd
from typing import List, Dict, Optional

DEFAULT_CSV = os.getenv("FAQ_CSV_PATH", os.path.join(os.path.dirname(__file__), "faq.csv"))

class SimpleFAQStore:
    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = csv_path or DEFAULT_CSV
        self.qa_pairs: List[Dict] = []
        self.load()
    
    def load(self):
        """Load Q&A pairs from CSV"""
        try:
            df = pd.read_csv(self.csv_path)
            # Normalize column names to lowercase
            cols = {c.lower().strip(): c for c in df.columns}
            q_col = cols.get("question")
            a_col = cols.get("answer")
            
            if not q_col or not a_col:
                raise ValueError("CSV must have 'Question' and 'Answer' columns")
            
            for _, row in df.iterrows():
                q = str(row[q_col]).strip()
                a = str(row[a_col]).strip()
                if q and a:
                    self.qa_pairs.append({
                        "question": q,
                        "answer": a
                    })
            print(f"✓ Loaded {len(self.qa_pairs)} FAQ pairs from {self.csv_path}")
        except Exception as e:
            print(f"⚠ Failed to load FAQ: {e}")
            self.qa_pairs = []
    
    def similarity_search(self, query: str, k: int = 5) -> List[Dict]:
        """Simple keyword-based search for FAQ"""
        if not self.qa_pairs:
            return []
        
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        scored = []
        for qa in self.qa_pairs:
            q_text = qa["question"].lower()
            a_text = qa["answer"].lower()
            
            # Count word matches in question
            q_words = set(q_text.split())
            matches = len(query_words & q_words)
            
            # Slight boost if query appears as substring in question
            if query_lower in q_text:
                matches += 10
            
            if matches > 0:
                scored.append((matches, qa))
        
        # Sort by match count descending
        scored.sort(key=lambda x: x[0], reverse=True)
        return [qa for _, qa in scored[:k]]
    
    def similarity_search_with_score(self, query: str, k: int = 5) -> List[tuple]:
        """Search returning (qa_dict, score) tuples"""
        if not self.qa_pairs:
            return []
        
        query_lower = query.lower()
        query_words = set(w for w in query_lower.split() if len(w) > 2)
        if not query_words:
            query_words = set(query_lower.split())
        
        scored = []
        max_matches = len(query_words)
        
        for qa in self.qa_pairs:
            q_text = qa["question"].lower()
            
            # Count word matches
            q_words = set(w for w in q_text.split() if len(w) > 2)
            if not q_words:
                q_words = set(q_text.split())
            
            matches = len(query_words & q_words)
            
            # Boost for substring match
            substring_boost = 0
            if query_lower in q_text:
                substring_boost = max_matches * 2
            
            # Normalize score to 0-1 range
            score = (matches + substring_boost) / max(max_matches, 1)
            score = min(1.0, score)  # Cap at 1.0
            
            if score > 0:
                scored.append((qa, score))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:k]

# Global instance
_faq_store = SimpleFAQStore()

def get_faq_store() -> SimpleFAQStore:
    """Get the global FAQ store"""
    return _faq_store
