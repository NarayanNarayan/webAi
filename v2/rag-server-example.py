#!/usr/bin/env python3
"""
RAG Server Example for Web AI Extension

This is a simple Flask-based RAG server that stores webpage summaries
and provides similarity search functionality.

Install dependencies:
pip install flask flask-cors sentence-transformers numpy scikit-learn

Run the server:
python rag-server-example.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
import os
from datetime import datetime
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class RAGServer:
    def __init__(self):
        """Initialize the RAG server with sentence transformer model"""
        try:
            # Load a pre-trained sentence transformer model
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None
        
        # In-memory storage for webpage summaries
        # In production, use a proper database
        self.webpages = {}
        self.embeddings = {}
        
        # Load existing data if available
        self.load_data()
    
    def load_data(self):
        """Load existing data from file"""
        try:
            if os.path.exists('webpage_data.json'):
                with open('webpage_data.json', 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.webpages = data.get('webpages', {})
                    self.embeddings = data.get('embeddings', {})
                logger.info(f"Loaded {len(self.webpages)} existing webpages")
        except Exception as e:
            logger.error(f"Failed to load existing data: {e}")
    
    def save_data(self):
        """Save data to file"""
        try:
            data = {
                'webpages': self.webpages,
                'embeddings': self.embeddings,
                'lastUpdated': datetime.now().isoformat()
            }
            with open('webpage_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info("Data saved successfully")
        except Exception as e:
            logger.error(f"Failed to save data: {e}")
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text using sentence transformer"""
        if self.model is None:
            return np.zeros(384)  # Default embedding size for all-MiniLM-L6-v2
        
        try:
            # Clean and truncate text
            clean_text = text.strip()[:1000]  # Limit text length
            embedding = self.model.encode(clean_text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return np.zeros(384)
    
    def store_webpage(self, url: str, summary: str, title: str, timestamp: int = None) -> Dict[str, Any]:
        """Store a webpage summary with its embedding"""
        try:
            if not summary or not url:
                return {"success": False, "error": "Summary and URL are required"}
            
            # Generate embedding for the summary
            embedding = self.get_embedding(summary)
            
            # Store webpage data
            self.webpages[url] = {
                "title": title,
                "summary": summary,
                "timestamp": timestamp or int(datetime.now().timestamp()),
                "embedding": embedding.tolist()  # Convert numpy array to list for JSON serialization
            }
            
            # Store embedding separately for faster similarity search
            self.embeddings[url] = embedding
            
            # Save data
            self.save_data()
            
            logger.info(f"Stored webpage: {url}")
            return {"success": True, "message": "Webpage stored successfully"}
            
        except Exception as e:
            logger.error(f"Failed to store webpage: {e}")
            return {"success": False, "error": str(e)}
    
    def find_similar_webpages(self, summary: str, current_url: str, threshold: float = 0.7) -> Dict[str, Any]:
        """Find webpages similar to the given summary"""
        try:
            if not summary:
                return {"success": False, "error": "Summary is required"}
            
            if self.model is None:
                return {"success": False, "error": "Model not loaded"}
            
            # Generate embedding for the query summary
            query_embedding = self.get_embedding(summary)
            
            similar_pages = []
            
            # Calculate similarity with all stored webpages
            for url, stored_embedding in self.embeddings.items():
                if url == current_url:
                    continue  # Skip current page
                
                # Calculate cosine similarity
                similarity = cosine_similarity(
                    [query_embedding], 
                    [stored_embedding]
                )[0][0]
                
                # Check if similarity meets threshold
                if similarity >= threshold:
                    webpage_data = self.webpages[url]
                    similar_pages.append({
                        "url": url,
                        "title": webpage_data["title"],
                        "summary": webpage_data["summary"],
                        "similarity": float(similarity),  # Convert numpy float to Python float
                        "timestamp": webpage_data["timestamp"]
                    })
            
            # Sort by similarity (highest first)
            similar_pages.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Limit results
            similar_pages = similar_pages[:10]
            
            logger.info(f"Found {len(similar_pages)} similar pages for query")
            return {
                "success": True,
                "similarPages": similar_pages,
                "totalFound": len(similar_pages)
            }
            
        except Exception as e:
            logger.error(f"Failed to find similar webpages: {e}")
            return {"success": False, "error": str(e)}
    
    def get_stats(self) -> Dict[str, Any]:
        """Get server statistics"""
        try:
            total_pages = len(self.webpages)
            total_summaries = sum(1 for page in self.webpages.values() if page.get("summary"))
            
            # Calculate average summary length
            summary_lengths = [len(page.get("summary", "")) for page in self.webpages.values()]
            avg_summary_length = np.mean(summary_lengths) if summary_lengths else 0
            
            # Get recent activity
            recent_pages = sorted(
                self.webpages.values(), 
                key=lambda x: x.get("timestamp", 0), 
                reverse=True
            )[:5]
            
            return {
                "success": True,
                "stats": {
                    "totalPages": total_pages,
                    "totalSummaries": total_summaries,
                    "avgSummaryLength": int(avg_summary_length),
                    "status": "online" if self.model is not None else "offline",
                    "lastUpdated": datetime.now().isoformat(),
                    "recentPages": [
                        {
                            "url": url,
                            "title": page.get("title", "Unknown"),
                            "timestamp": page.get("timestamp", 0)
                        }
                        for url, page in self.webpages.items()
                        if url in [p["url"] for p in recent_pages]
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"success": False, "error": str(e)}

# Initialize RAG server
rag_server = RAGServer()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": rag_server.model is not None
    })

@app.route('/api/store', methods=['POST'])
def store_webpage():
    """Store a webpage summary"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        url = data.get('url')
        summary = data.get('summary')
        title = data.get('title', 'Unknown Title')
        timestamp = data.get('timestamp')
        
        result = rag_server.store_webpage(url, summary, title, timestamp)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in store endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/similar', methods=['POST'])
def find_similar():
    """Find similar webpages"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        summary = data.get('summary')
        current_url = data.get('currentUrl', '')
        threshold = data.get('threshold', 0.7)
        
        result = rag_server.find_similar_webpages(summary, current_url, threshold)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in similar endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get server statistics"""
    try:
        result = rag_server.get_stats()
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in stats endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/webpages', methods=['GET'])
def list_webpages():
    """List all stored webpages (for debugging)"""
    try:
        webpages = []
        for url, data in rag_server.webpages.items():
            webpages.append({
                "url": url,
                "title": data.get("title", "Unknown"),
                "summary": data.get("summary", "")[:200] + "..." if len(data.get("summary", "")) > 200 else data.get("summary", ""),
                "timestamp": data.get("timestamp", 0)
            })
        
        return jsonify({
            "success": True,
            "webpages": webpages,
            "total": len(webpages)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in list webpages endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/clear', methods=['POST'])
def clear_data():
    """Clear all stored data (for testing)"""
    try:
        rag_server.webpages.clear()
        rag_server.embeddings.clear()
        rag_server.save_data()
        
        return jsonify({
            "success": True,
            "message": "All data cleared successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Error in clear endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("Starting RAG Server for Web AI Extension...")
    print("Server will be available at: http://localhost:8000")
    print("API endpoints:")
    print("  GET  /api/health     - Health check")
    print("  POST /api/store      - Store webpage summary")
    print("  POST /api/similar    - Find similar webpages")
    print("  GET  /api/stats      - Get server statistics")
    print("  GET  /api/webpages   - List all webpages")
    print("  POST /api/clear      - Clear all data")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        app.run(host='0.0.0.0', port=8000, debug=True)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        rag_server.save_data()
        print("Server stopped.")
