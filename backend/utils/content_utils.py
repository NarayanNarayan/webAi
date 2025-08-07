"""
Content Utilities for WebAI
Utility functions for content processing and manipulation
"""

import json
from typing import Dict, Any, List


def extract_content_structure(content_json: str) -> Dict[str, Any]:
    """
    Parse and extract structured content from minified JSON string
    
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
    except Exception as e:
        print(f"Error parsing content JSON: {e}")
        return {}


def extract_text_from_content(content: Dict[str, Any]) -> List[str]:
    """
    Extract all text nodes from content structure
    
    Args:
        content: Parsed content structure
        
    Returns:
        List of text strings
    """
    text_nodes = []
    
    def extract_text_recursive(node):
        if isinstance(node, dict):
            if node.get('text', '').strip():
                text_nodes.append(node['text'].strip())
            if 'childs' in node:
                for child in node['childs']:
                    extract_text_recursive(child)
    
    extract_text_recursive(content)
    return text_nodes


def create_fallback_summary(content: Dict[str, Any], max_length: int = 200) -> str:
    """
    Create a fallback summary from content structure
    
    Args:
        content: Parsed content structure
        max_length: Maximum length of summary
        
    Returns:
        Fallback summary string
    """
    try:
        text_nodes = extract_text_from_content(content)
        fallback_text = ' '.join(text_nodes[:5])  # First 5 text nodes
        return fallback_text[:max_length] + "..." if len(fallback_text) > max_length else fallback_text
    except Exception as e:
        print(f"Error creating fallback summary: {e}")
        return "Unable to generate summary due to processing error."


def parse_ai_response(response_text: str) -> tuple[str, List[str]]:
    """
    Parse AI response to extract summary and key points
    
    Args:
        response_text: Raw AI response text
        
    Returns:
        Tuple of (summary, key_points)
    """
    lines = response_text.split('\n')
    summary = ""
    key_points = []
    
    for line in lines:
        if line.strip().startswith(('1.', '2.', '3.', '4.', '5.')):
            key_points.append(line.strip())
        elif line.strip() and not line.startswith('Page Title:') and not line.startswith('URL:'):
            summary += line.strip() + ' '
    
    return summary.strip(), key_points


def parse_highlight_response(response_text: str) -> List[Dict[str, Any]]:
    """
    Parse AI response to extract highlight data
    
    Args:
        response_text: Raw AI response text
        
    Returns:
        List of highlight dictionaries
    """
    highlights = []
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
    
    return highlights 