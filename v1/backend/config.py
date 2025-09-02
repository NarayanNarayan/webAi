"""
Configuration for WebAI MVC Application
Centralized configuration settings
"""

import os
from typing import Dict, Any


class Config:
    """Application configuration"""
    
    # API Configuration
    API_TITLE = "WebAI LangGraph API with Gemini"
    API_VERSION = "2.0.0"
    API_DESCRIPTION = "Enhanced LangGraph API server for the WebAI Chrome extension using MVC architecture"
    
    # Server Configuration
    HOST = "0.0.0.0"
    PORT = 8000
    
    # AI Configuration
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL = "gemini-pro"
    
    # Workflow Configuration
    MAX_HIGHLIGHTS = 10
    SUMMARY_MAX_LENGTH = 200
    FALLBACK_SUMMARY_LENGTH = 200
    
    # Error Messages
    ERROR_MESSAGES = {
        "summarization_failed": "Summarization failed: {error}",
        "highlighting_failed": "Highlighting failed: {error}",
        "autofill_failed": "Autofill failed: {error}",
        "ai_generation_failed": "Error generating content with Gemini: {error}",
        "content_parsing_failed": "Error parsing content JSON: {error}",
        "fallback_summary_failed": "Error creating fallback summary: {error}"
    }
    
    # Health Check Configuration
    HEALTH_CHECK = {
        "status": "healthy",
        "service": "WebAI LangGraph API with Gemini",
        "model": "gemini-pro"
    }
    
    # API Endpoints
    ENDPOINTS = {
        "POST /api/v1/summarize": "Generate summary using LangGraph and Gemini",
        "POST /api/v1/highlight": "Agentic text highlighting",
        "POST /api/v1/autofill": "Intelligent form autofill",
        "GET /api/v1/health": "Health check",
        "GET /": "API information"
    }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that all required configuration is present"""
        if not cls.GOOGLE_API_KEY:
            print("ERROR: GOOGLE_API_KEY environment variable is required")
            return False
        return True
    
    @classmethod
    def get_api_info(cls) -> Dict[str, Any]:
        """Get API information for root endpoint"""
        return {
            "message": cls.API_TITLE,
            "version": cls.API_VERSION,
            "endpoints": cls.ENDPOINTS
        }
    
    @classmethod
    def get_health_info(cls) -> Dict[str, Any]:
        """Get health check information"""
        from datetime import datetime
        return {
            **cls.HEALTH_CHECK,
            "timestamp": datetime.now().isoformat()
        } 