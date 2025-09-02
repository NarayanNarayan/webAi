"""
AI Service for WebAI
Handles all interactions with Gemini AI model
"""

import google.generativeai as genai
import json
from typing import Dict, Any
from config import Config


class AIService:
    """Service for handling AI operations with Gemini"""
    
    def __init__(self):
        """Initialize the AI service with Gemini configuration"""
        if not Config.validate_config():
            raise ValueError("Invalid configuration")
        
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
    
    def create_summary_prompt(self, state: Dict[str, Any]) -> str:
        """
        Create a comprehensive prompt for Gemini to analyze and summarize web content
        
        Args:
            state: Current state containing URL, title, and content
            
        Returns:
            Formatted prompt for Gemini LLM
        """
        return f"""
        You are an intelligent web content analyzer. Analyze the following web page content and provide a comprehensive summary.
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
    
    def create_highlighting_prompt(self, state: Dict[str, Any]) -> str:
        """
        Create a prompt for Gemini to identify specific text sections for highlighting
        
        Args:
            state: Current state containing query and content
            
        Returns:
            Formatted prompt for highlighting analysis
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
    
    def create_autofill_prompt(self, state: Dict[str, Any]) -> str:
        """
        Create a prompt for Gemini to suggest form field values
        
        Args:
            state: Current state containing form data and page content
            
        Returns:
            Formatted prompt for autofill analysis
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
    
    def generate_content(self, prompt: str) -> str:
        """
        Generate content using Gemini model
        
        Args:
            prompt: The prompt to send to Gemini
            
        Returns:
            Generated response text
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_msg = Config.ERROR_MESSAGES["ai_generation_failed"].format(error=str(e))
            print(error_msg)
            raise 