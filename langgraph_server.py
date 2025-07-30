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
    flatText: str
    timestamp: str
    action: str = "summarize"  # summarize, highlight, autofill

class HighlightRequest(BaseModel):
    url: str
    title: str
    content: str
    flatText: str
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
    flat_text: str
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
    """Extract structured content from minified JSON"""
    try:
        content = json.loads(content_json)
        return content
    except:
        return {}

def create_gemini_prompt_for_summary(state: SummaryState) -> str:
    """Create a prompt for Gemini to generate summary"""
    return f"""
    You are an intelligent web content analyzer. Analyze the following web page content and provide a comprehensive summary.
    
    Page Title: {state['title']}
    URL: {state['url']}
    
    Content Structure: {json.dumps(state['content'], indent=2)}
    Flat Text: {state['flat_text'][:2000]}...
    
    Please provide:
    1. A concise but comprehensive summary (150-200 words)
    2. 3-5 key points from the content
    3. Important sections that should be highlighted
    
    Focus on the most important information and maintain context.
    """

def create_gemini_prompt_for_highlighting(state: HighlightState) -> str:
    """Create a prompt for Gemini to identify highlights"""
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
    """Create a prompt for Gemini to suggest form autofill"""
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
    """Extract content and analyze with Gemini"""
    try:
        prompt = create_gemini_prompt_for_summary(state)
        response = model.generate_content(prompt)
        
        # Parse Gemini response
        response_text = response.text
        
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
        # Fallback to simple summary
        state['summary'] = state['flat_text'][:200] + "..."
        return state

def generate_highlights(state: SummaryState) -> SummaryState:
    """Generate highlights based on key points"""
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
    """Use Gemini to agentically identify highlights"""
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
    """Use Gemini to intelligently suggest form autofill"""
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
    """Create the summary workflow"""
    workflow = StateGraph(SummaryState)
    workflow.add_node("extract", extract_and_analyze)
    workflow.add_node("highlight", generate_highlights)
    workflow.set_entry_point("extract")
    workflow.add_edge("extract", "highlight")
    workflow.add_edge("highlight", END)
    return workflow.compile()

def create_highlight_workflow():
    """Create the highlighting workflow"""
    workflow = StateGraph(HighlightState)
    workflow.add_node("highlight", agentic_highlight)
    workflow.set_entry_point("highlight")
    workflow.add_edge("highlight", END)
    return workflow.compile()

def create_autofill_workflow():
    """Create the autofill workflow"""
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
    """Main summarization endpoint using LangGraph and Gemini"""
    try:
        # Prepare state for LangGraph
        state = {
            "url": request.url,
            "title": request.title,
            "content": request.content,
            "flat_text": request.flatText,
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
    """Agentic highlighting endpoint"""
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
    """Intelligent form autofill endpoint"""
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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "WebAI LangGraph API with Gemini",
        "model": "gemini-pro"
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
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