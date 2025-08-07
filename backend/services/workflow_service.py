"""
Workflow Service for WebAI
Handles LangGraph workflow operations and state management
"""

import json
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from models.state_models import SummaryState, HighlightState, AutofillState
from services.ai_service import AIService
from utils.content_utils import (
    extract_content_structure, create_fallback_summary, 
    parse_ai_response, parse_highlight_response
)


class WorkflowService:
    """Service for managing LangGraph workflows"""
    
    def __init__(self):
        """Initialize the workflow service with AI service"""
        self.ai_service = AIService()
        self.summary_workflow = self._create_summary_workflow()
        self.highlight_workflow = self._create_highlight_workflow()
        self.autofill_workflow = self._create_autofill_workflow()
    
    def _create_summary_workflow(self):
        """Create and configure the summary generation workflow"""
        workflow = StateGraph(SummaryState)
        workflow.add_node("extract", self._extract_and_analyze)
        workflow.add_node("highlight", self._generate_highlights)
        workflow.set_entry_point("extract")
        workflow.add_edge("extract", "highlight")
        workflow.add_edge("highlight", END)
        return workflow.compile()
    
    def _create_highlight_workflow(self):
        """Create and configure the highlighting workflow"""
        workflow = StateGraph(HighlightState)
        workflow.add_node("highlight", self._agentic_highlight)
        workflow.set_entry_point("highlight")
        workflow.add_edge("highlight", END)
        return workflow.compile()
    
    def _create_autofill_workflow(self):
        """Create and configure the form autofill workflow"""
        workflow = StateGraph(AutofillState)
        workflow.add_node("autofill", self._intelligent_autofill)
        workflow.set_entry_point("autofill")
        workflow.add_edge("autofill", END)
        return workflow.compile()
    
    def _extract_and_analyze(self, state: SummaryState) -> SummaryState:
        """
        Extract content structure and generate initial summary using Gemini
        
        Args:
            state: Current state with URL, title, and content
            
        Returns:
            Updated state with summary and key points
        """
        try:
            prompt = self.ai_service.create_summary_prompt(state)
            response_text = self.ai_service.generate_content(prompt)
            print(response_text)
            
            # Parse AI response using utility function
            summary, key_points = parse_ai_response(response_text)
            
            state['summary'] = summary
            state['key_points'] = key_points
            
            return state
        except Exception as e:
            print(f"Error in extract_and_analyze: {e}")
            # Fallback to simple summary from content structure
            try:
                content = extract_content_structure(state['content'])
                state['summary'] = create_fallback_summary(content)
            except:
                state['summary'] = "Unable to generate summary due to processing error."
            return state
    
    def _generate_highlights(self, state: SummaryState) -> SummaryState:
        """
        Generate highlights based on key points and content structure
        
        Args:
            state: Current state with summary and key points
            
        Returns:
            Updated state with highlights array
        """
        try:
            highlights = []
            content = extract_content_structure(state['content'])
            
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
    
    def _agentic_highlight(self, state: HighlightState) -> HighlightState:
        """
        Use Gemini to intelligently identify and highlight text sections based on user query
        
        Args:
            state: Current state with query and content
            
        Returns:
            Updated state with highlights and reasoning
        """
        try:
            prompt = self.ai_service.create_highlighting_prompt(state)
            response_text = self.ai_service.generate_content(prompt)
            
            # Parse response for highlights using utility function
            highlights = parse_highlight_response(response_text)
            
            state['highlights'] = highlights
            state['reasoning'] = response_text[:500]  # First 500 chars as reasoning
            
            return state
        except Exception as e:
            print(f"Error in agentic_highlight: {e}")
            state['highlights'] = []
            state['reasoning'] = f"Error: {str(e)}"
            return state
    
    def _intelligent_autofill(self, state: AutofillState) -> AutofillState:
        """
        Use Gemini to intelligently suggest form field values based on page context
        
        Args:
            state: Current state with form data and page content
            
        Returns:
            Updated state with suggestions, confidence, and reasoning
        """
        try:
            prompt = self.ai_service.create_autofill_prompt(state)
            response_text = self.ai_service.generate_content(prompt)
            
            # Parse response for suggestions
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
    
    def run_summary_workflow(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Run the summary workflow with given state"""
        return self.summary_workflow.invoke(state)
    
    def run_highlight_workflow(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Run the highlighting workflow with given state"""
        return self.highlight_workflow.invoke(state)
    
    def run_autofill_workflow(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Run the autofill workflow with given state"""
        return self.autofill_workflow.invoke(state) 