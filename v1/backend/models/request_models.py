"""
Request Models for WebAI API
Defines the data structures for incoming API requests
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class SummaryRequest(BaseModel):
    """Model for summarization request"""
    url: str
    title: str
    content: str  # minified JSON content
    timestamp: str
    action: str = "summarize"  # summarize, highlight, autofill


class HighlightRequest(BaseModel):
    """Model for highlighting request"""
    url: str
    title: str
    content: str
    query: str  # What to highlight


class AutofillRequest(BaseModel):
    """Model for autofill request"""
    url: str
    title: str
    content: str
    form_data: Dict[str, Any]  # Form fields to autofill


class SummaryResponse(BaseModel):
    """Model for summarization response"""
    summary: str
    method: str = "langgraph_gemini"
    word_count: Optional[int] = None
    key_points: Optional[list] = None
    highlights: Optional[List[Dict]] = None
    form_suggestions: Optional[Dict] = None


class HighlightResponse(BaseModel):
    """Model for highlighting response"""
    highlights: List[Dict[str, Any]]
    reasoning: str
    method: str = "gemini_agentic"


class AutofillResponse(BaseModel):
    """Model for autofill response"""
    form_data: Dict[str, Any]
    confidence: float
    reasoning: str
    method: str = "gemini_autofill" 