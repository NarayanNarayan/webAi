#!/usr/bin/env python3
"""
Enhanced LangGraph API server for the WebAI Chrome extension
Uses Gemini LLM for intelligent summarization, highlighting, and form autofill
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import re
from datetime import datetime
import google.generativeai as genai
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import os

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-pro')

app = FastAPI(title="WebAI LangGraph API with Gemini", version="2.0.0")

class SummaryRequest(BaseModel):
    url: str
    title: str
    content: str  # minified JSON content
    timestamp: str
    action: str = "summarize"  # summarize, highlight, autofill

class HighlightRequest(BaseModel):
    url: str
    title: str
    content: str
    query: str  # What to highlight

class AutofillRequest(BaseModel):
    url: str
    title: str
    content: str
    form_data: Dict[str, Any]  # Form fields to autofill

class SummaryResponse(BaseModel):
    summary: str
    method: str = "langgraph_gemini"
    word_count: Optional[int] = None
    key_points: Optional[list] = None
    highlights: Optional[List[Dict]] = None
    form_suggestions: Optional[Dict] = None

class HighlightResponse(BaseModel):
    highlights: List[Dict[str, Any]]
    reasoning: str
    method: str = "gemini_agentic"

class AutofillResponse(BaseModel):
    form_data: Dict[str, Any]
    confidence: float
    reasoning: str
    method: str = "gemini_autofill"

# LangGraph State Definitions
class SummaryState(TypedDict):
    url: str
    title: str
    content: str
    summary: str
    key_points: List[Dict]
    highlights: List[Dict]
    form_suggestions: Dict

class HighlightState(TypedDict):
    url: str
    content: str
    query: str
    highlights: List[Dict]
    reasoning: str

class AutofillState(TypedDict):
    url: str
    content: str
    form_data: Dict
    suggestions: Dict
    confidence: float
    reasoning: str

def extract_content_structure(content_json: str) -> Dict:
    """
    Responsibility: Parse and extract structured content from minified JSON string
    
    This function takes a JSON string containing DOM structure and converts it
    into a Python dictionary for further processing. It handles the initial
    parsing of the web page content that comes from the Chrome extension.
    
    Args:
        content_json (str): Minified JSON string containing DOM structure
        
    Returns:
        Dict: Parsed content structure or empty dict if parsing fails
    """
    try:
        content = json.loads(content_json)
        return content
    except:
        return {}

def create_gemini_prompt_for_summary(state: SummaryState) -> str:
    """
    Responsibility: Generate a comprehensive prompt for Gemini to analyze and summarize web content
    
    This function creates a detailed prompt that instructs Gemini to analyze
    the web page content and extract key information including summary, key points,
    and important sections for highlighting. It structures the prompt to get
    consistent, well-formatted responses from the LLM.
    
    Args:
        state (SummaryState): Current state containing URL, title, and content
        
    Returns:
        str: Formatted prompt for Gemini LLM
    """
    print(json.dumps(state['content']))
    return f"""
    You are an intelligent web content analyzer. Analyze the following web page content and provide a comprehensive summary removing all the non-text content.
    Content is in JSON format with id, text, tag, childs, etc.
    childs is a list of child nodes.
    text is the text of the node.
    tag is the tag of the node.
    id is the id of the node.
    
    Please provide:
        1. A concise but comprehensive summary (150-200 words)
        2. 3-5 key points from the content
        3. ID of the important sections that should be highlighted
    
    Page Title: {state['title']}
    URL: {state['url']}
    
    Content Structure: {json.dumps(state['content'])}
    """

def create_gemini_prompt_for_highlighting(state: HighlightState) -> str:
    """
    Responsibility: Generate a prompt for Gemini to identify specific text sections for highlighting
    
    This function creates a targeted prompt that instructs Gemini to find
    specific text sections that match a user query. It focuses on semantic
    matching and provides reasoning for each highlighted section.
    
    Args:
        state (HighlightState): Current state containing query and content
        
    Returns:
        str: Formatted prompt for highlighting analysis
    """
    return f"""
    You are an intelligent text analyzer. Analyze the following web page content and identify specific text sections that match the query.
    
    Query: {state['query']}
    URL: {state['url']}
    
    Content Structure: {json.dumps(state['content'], indent=2)}
    
    Please identify:
    1. Specific text sections that match the query
    2. The reasoning behind each selection
    3. Confidence level for each match
    
    Return the results as structured data with text, reasoning, and confidence.
    """

def create_gemini_prompt_for_autofill(state: AutofillState) -> str:
    """
    Responsibility: Generate a prompt for Gemini to suggest form field values
    
    This function creates a specialized prompt that instructs Gemini to analyze
    the web page context and suggest appropriate values for form fields.
    It considers the page content, field names, and context to make intelligent
    autofill suggestions.
    
    Args:
        state (AutofillState): Current state containing form data and page content
        
    Returns:
        str: Formatted prompt for autofill analysis
    """
    return f"""
    You are an intelligent form autofill assistant. Analyze the following web page and suggest appropriate values for form fields.
    
    URL: {state['url']}
    Form Fields: {json.dumps(state['form_data'], indent=2)}
    Page Content: {json.dumps(state['content'], indent=2)}
    
    Please suggest:
    1. Appropriate values for each form field
    2. Confidence level for each suggestion
    3. Reasoning for each suggestion
    
    Consider context, field names, and page content when making suggestions.
    """

# LangGraph Nodes
def extract_and_analyze(state: SummaryState) -> SummaryState:
    """
    Responsibility: Extract content structure and generate initial summary using Gemini
    
    This is the first node in the summary workflow. It takes the raw web page
    content, sends it to Gemini for analysis, and extracts a summary and key
    points from the LLM response. It handles the core content analysis and
    sets up the foundation for further processing.
    
    Args:
        state (SummaryState): Current state with URL, title, and content
        
    Returns:
        SummaryState: Updated state with summary and key points
    """
    try:
        prompt = create_gemini_prompt_for_summary(state)
        response = model.generate_content(prompt)
        
        # Parse Gemini response
        response_text = response.text
        print(response_text)
        # Extract summary and key points from response
        lines = response_text.split('\n')
        summary = ""
        key_points = []
        
        for line in lines:
            if line.strip().startswith(('1.', '2.', '3.', '4.', '5.')):
                key_points.append(line.strip())
            elif line.strip() and not line.startswith('Page Title:') and not line.startswith('URL:'):
                summary += line.strip() + ' '
        
        state['summary'] = summary.strip()
        state['key_points'] = key_points
        
        return state
    except Exception as e:
        print(f"Error in extract_and_analyze: {e}")
        # Fallback to simple summary from content structure
        try:
            content = json.loads(state['content'])
            # Extract first few text nodes for fallback
            text_nodes = []
            def extract_text(node):
                if isinstance(node, dict):
                    if node.get('text', '').strip():
                        text_nodes.append(node['text'].strip())
                    if 'childs' in node:
                        for child in node['childs']:
                            extract_text(child)
            
            extract_text(content)
            fallback_text = ' '.join(text_nodes[:5])  # First 5 text nodes
            state['summary'] = fallback_text[:200] + "..." if len(fallback_text) > 200 else fallback_text
        except:
            state['summary'] = "Unable to generate summary due to processing error."
        return state

def generate_highlights(state: SummaryState) -> SummaryState:
    """
    Responsibility: Generate highlights based on key points and content structure
    
    This is the second node in the summary workflow. It takes the key points
    identified by Gemini and searches through the DOM structure to find
    specific text sections that match those key points. It creates highlight
    objects with reasoning and confidence scores for the frontend to display.
    
    Args:
        state (SummaryState): Current state with summary and key points
        
    Returns:
        SummaryState: Updated state with highlights array
    """
    try:
        highlights = []
        content = json.loads(state['content'])
        
        def find_highlight_candidates(node, depth=0):
            if isinstance(node, dict):
                text = node.get('text', '').strip()
                if text and len(text) > 10:
                    # Simple highlighting based on key points
                    for point in state['key_points']:
                        if any(word.lower() in text.lower() for word in point.split()):
                            highlights.append({
                                'text': text,
                                'tag': node.get('tag', ''),
                                'id': node.get('id', ''),
                                'reasoning': f"Matches key point: {point}",
                                'confidence': 0.8
                            })
                            break
                
                if 'childs' in node:
                    for child in node['childs']:
                        find_highlight_candidates(child, depth + 1)
        
        find_highlight_candidates(content)
        state['highlights'] = highlights[:10]  # Limit to top 10
        
        return state
    except Exception as e:
        print(f"Error in generate_highlights: {e}")
        state['highlights'] = []
        return state

def agentic_highlight(state: HighlightState) -> HighlightState:
    """
    Responsibility: Use Gemini to intelligently identify and highlight text sections based on user query
    
    This function implements agentic highlighting by using Gemini to understand
    the user's query and find relevant text sections. It goes beyond simple
    keyword matching to understand context and semantic meaning. The function
    parses the LLM response to extract structured highlight data with reasoning
    and confidence scores.
    
    Args:
        state (HighlightState): Current state with query and content
        
    Returns:
        HighlightState: Updated state with highlights and reasoning
    """
    try:
        prompt = create_gemini_prompt_for_highlighting(state)
        response = model.generate_content(prompt)
        
        # Parse response for highlights
        response_text = response.text
        highlights = []
        
        # Simple parsing - in production, you'd want more sophisticated parsing
        lines = response_text.split('\n')
        current_highlight = {}
        
        for line in lines:
            if 'text:' in line.lower():
                if current_highlight:
                    highlights.append(current_highlight)
                current_highlight = {'text': line.split(':', 1)[1].strip()}
            elif 'reasoning:' in line.lower():
                current_highlight['reasoning'] = line.split(':', 1)[1].strip()
            elif 'confidence:' in line.lower():
                try:
                    current_highlight['confidence'] = float(line.split(':', 1)[1].strip())
                except:
                    current_highlight['confidence'] = 0.7
        
        if current_highlight:
            highlights.append(current_highlight)
        
        state['highlights'] = highlights
        state['reasoning'] = response_text[:500]  # First 500 chars as reasoning
        
        return state
    except Exception as e:
        print(f"Error in agentic_highlight: {e}")
        state['highlights'] = []
        state['reasoning'] = f"Error: {str(e)}"
        return state

def intelligent_autofill(state: AutofillState) -> AutofillState:
    """
    Responsibility: Use Gemini to intelligently suggest form field values based on page context
    
    This function analyzes the web page content and form field names to suggest
    appropriate values for autofill. It considers the page context, field names,
    and user behavior patterns to make intelligent suggestions. The function
    provides confidence scores and reasoning for each suggestion.
    
    Args:
        state (AutofillState): Current state with form data and page content
        
    Returns:
        AutofillState: Updated state with suggestions, confidence, and reasoning
    """
    try:
        prompt = create_gemini_prompt_for_autofill(state)
        response = model.generate_content(prompt)
        
        # Parse response for suggestions
        response_text = response.text
        suggestions = {}
        confidence = 0.7
        reasoning = response_text[:500]
        
        # Simple parsing - extract field suggestions
        lines = response_text.split('\n')
        for line in lines:
            if ':' in line and any(field in line.lower() for field in state['form_data'].keys()):
                parts = line.split(':', 1)
                if len(parts) == 2:
                    field_name = parts[0].strip().lower()
                    suggestion = parts[1].strip()
                    suggestions[field_name] = suggestion
        
        state['suggestions'] = suggestions
        state['confidence'] = confidence
        state['reasoning'] = reasoning
        
        return state
    except Exception as e:
        print(f"Error in intelligent_autofill: {e}")
        state['suggestions'] = {}
        state['confidence'] = 0.0
        state['reasoning'] = f"Error: {str(e)}"
        return state

# Build LangGraph workflows
def create_summary_workflow():
    """
    Responsibility: Create and configure the summary generation workflow
    
    This function sets up a LangGraph workflow that processes web content
    through multiple stages: content extraction and analysis, followed by
    highlight generation. It defines the flow of data through the system
    and ensures proper state management between nodes.
    
    Returns:
        Compiled LangGraph workflow for summarization
    """
    workflow = StateGraph(SummaryState)
    workflow.add_node("extract", extract_and_analyze)
    workflow.add_node("highlight", generate_highlights)
    workflow.set_entry_point("extract")
    workflow.add_edge("extract", "highlight")
    workflow.add_edge("highlight", END)
    return workflow.compile()

def create_highlight_workflow():
    """
    Responsibility: Create and configure the highlighting workflow
    
    This function sets up a LangGraph workflow specifically for agentic
    highlighting. It uses a single node that leverages Gemini to understand
    user queries and find relevant text sections with reasoning.
    
    Returns:
        Compiled LangGraph workflow for highlighting
    """
    workflow = StateGraph(HighlightState)
    workflow.add_node("highlight", agentic_highlight)
    workflow.set_entry_point("highlight")
    workflow.add_edge("highlight", END)
    return workflow.compile()

def create_autofill_workflow():
    """
    Responsibility: Create and configure the form autofill workflow
    
    This function sets up a LangGraph workflow for intelligent form autofill.
    It uses a single node that analyzes page context and form fields to
    suggest appropriate values with confidence scores.
    
    Returns:
        Compiled LangGraph workflow for autofill
    """
    workflow = StateGraph(AutofillState)
    workflow.add_node("autofill", intelligent_autofill)
    workflow.set_entry_point("autofill")
    workflow.add_edge("autofill", END)
    return workflow.compile()

# Initialize workflows
summary_workflow = create_summary_workflow()
highlight_workflow = create_highlight_workflow()
autofill_workflow = create_autofill_workflow()

@app.post("/summarize", response_model=SummaryResponse)
async def summarize_content(request: SummaryRequest):
    """
    Responsibility: Main API endpoint for content summarization using LangGraph and Gemini
    
    This endpoint receives web page content from the Chrome extension and
    processes it through the summary workflow. It orchestrates the entire
    summarization process, including content analysis, key point extraction,
    and highlight generation. The endpoint handles request validation,
    workflow execution, and response formatting.
    
    Args:
        request (SummaryRequest): Request containing URL, title, content, and action
        
    Returns:
        SummaryResponse: Structured response with summary, key points, and highlights
        
    Raises:
        HTTPException: If summarization fails
    """
    try:
        # Prepare state for LangGraph
        state = {
            "url": request.url,
            "title": request.title,
            "content": request.content,
            "summary": "",
            "key_points": [],
            "highlights": [],
            "form_suggestions": {}
        }
        
        # Run LangGraph workflow
        result = summary_workflow.invoke(state)
        
        return SummaryResponse(
            summary=result['summary'],
            method="langgraph_gemini",
            word_count=len(result['summary'].split()),
            key_points=result['key_points'],
            highlights=result['highlights']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/highlight", response_model=HighlightResponse)
async def highlight_content(request: HighlightRequest):
    """
    Responsibility: API endpoint for agentic text highlighting based on user queries
    
    This endpoint receives a user query and web page content, then uses
    Gemini to intelligently identify relevant text sections. It goes beyond
    simple keyword matching to understand semantic meaning and context.
    The endpoint provides structured highlight data with reasoning for each
    selection.
    
    Args:
        request (HighlightRequest): Request containing query and page content
        
    Returns:
        HighlightResponse: Structured response with highlights and reasoning
        
    Raises:
        HTTPException: If highlighting fails
    """
    try:
        state = {
            "url": request.url,
            "content": request.content,
            "query": request.query,
            "highlights": [],
            "reasoning": ""
        }
        
        result = highlight_workflow.invoke(state)
        
        return HighlightResponse(
            highlights=result['highlights'],
            reasoning=result['reasoning'],
            method="gemini_agentic"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Highlighting failed: {str(e)}")

@app.post("/autofill", response_model=AutofillResponse)
async def autofill_form(request: AutofillRequest):
    """
    Responsibility: API endpoint for intelligent form autofill suggestions
    
    This endpoint analyzes web page content and form field names to suggest
    appropriate values for autofill. It considers page context, field names,
    and user behavior patterns to make intelligent suggestions. The endpoint
    provides confidence scores and reasoning for each suggestion.
    
    Args:
        request (AutofillRequest): Request containing form data and page content
        
    Returns:
        AutofillResponse: Structured response with suggestions, confidence, and reasoning
        
    Raises:
        HTTPException: If autofill processing fails
    """
    try:
        state = {
            "url": request.url,
            "content": request.content,
            "form_data": request.form_data,
            "suggestions": {},
            "confidence": 0.0,
            "reasoning": ""
        }
        
        result = autofill_workflow.invoke(state)
        
        return AutofillResponse(
            form_data=result['suggestions'],
            confidence=result['confidence'],
            reasoning=result['reasoning'],
            method="gemini_autofill"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autofill failed: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Responsibility: Health check endpoint for monitoring system status
    
    This endpoint provides basic health information about the API service,
    including status, timestamp, service name, and model information.
    It's used for monitoring and ensuring the service is running properly.
    
    Returns:
        Dict: Health status information
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "WebAI LangGraph API with Gemini",
        "model": "gemini-pro"
    }

@app.get("/")
async def root():
    """
    Responsibility: Root endpoint providing API information and documentation
    
    This endpoint serves as the main entry point for the API, providing
    information about available endpoints and their purposes. It helps
    developers understand the API structure and available functionality.
    
    Returns:
        Dict: API information and endpoint descriptions
    """
    return {
        "message": "WebAI LangGraph API with Gemini",
        "version": "2.0.0",
        "endpoints": {
            "POST /summarize": "Generate summary using LangGraph and Gemini",
            "POST /highlight": "Agentic text highlighting",
            "POST /autofill": "Intelligent form autofill",
            "GET /health": "Health check",
            "GET /": "API information"
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting WebAI LangGraph API server with Gemini...")
    print("Access the API at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Make sure to set GOOGLE_API_KEY environment variable")
    uvicorn.run(app, host="0.0.0.0", port=8000) 