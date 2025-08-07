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
    action: str = "summarize"  # summarize

class SummaryResponse(BaseModel):
    summary: str
    method: str = "langgraph_gemini"
    word_count: Optional[int] = None
    key_points: Optional[list] = None

# LangGraph State Definitions
class SummaryState(TypedDict):
    url: str
    title: str
    content: str
    summary: str
    key_points: List[Dict]

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



# Initialize workflows
summary_workflow = create_summary_workflow()


async def summarize_content(request: SummaryRequest):
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

if __name__ == "__main__":
    import uvicorn
    print("Starting WebAI LangGraph API server with Gemini...")
    print("Access the API at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Make sure to set GOOGLE_API_KEY environment variable")
    uvicorn.run(app, host="0.0.0.0", port=8000) 