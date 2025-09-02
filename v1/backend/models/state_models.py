"""
State Models for LangGraph Workflows
Defines the state structures used in LangGraph workflows
"""

from typing import TypedDict, Dict, List, Any


class SummaryState(TypedDict):
    """State model for summary workflow"""
    url: str
    title: str
    content: str
    summary: str
    key_points: List[Dict]
    highlights: List[Dict]
    form_suggestions: Dict


class HighlightState(TypedDict):
    """State model for highlighting workflow"""
    url: str
    content: str
    query: str
    highlights: List[Dict]
    reasoning: str


class AutofillState(TypedDict):
    """State model for autofill workflow"""
    url: str
    content: str
    form_data: Dict
    suggestions: Dict
    confidence: float
    reasoning: str 