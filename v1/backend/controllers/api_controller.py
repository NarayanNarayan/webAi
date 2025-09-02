"""
API Controller for WebAI
Handles HTTP requests and responses for the WebAI API
"""

from fastapi import HTTPException
from typing import Dict, Any
from models.request_models import (
    SummaryRequest, HighlightRequest, AutofillRequest,
    SummaryResponse, HighlightResponse, AutofillResponse
)
from services.workflow_service import WorkflowService
from config import Config


class APIController:
    """Controller for handling API requests and responses"""
    
    def __init__(self):
        """Initialize the API controller with workflow service"""
        self.workflow_service = WorkflowService()
    
    async def summarize_content(self, request: SummaryRequest) -> SummaryResponse:
        """
        Handle content summarization request
        
        Args:
            request: Summary request with URL, title, content, and timestamp
            
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
            result = self.workflow_service.run_summary_workflow(state)
            
            return SummaryResponse(
                summary=result['summary'],
                method="langgraph_gemini",
                word_count=len(result['summary'].split()),
                key_points=result['key_points'],
                highlights=result['highlights']
            )
            
        except Exception as e:
            error_msg = Config.ERROR_MESSAGES["summarization_failed"].format(error=str(e))
            raise HTTPException(status_code=500, detail=error_msg)
    
    async def highlight_content(self, request: HighlightRequest) -> HighlightResponse:
        """
        Handle content highlighting request
        
        Args:
            request: Highlight request with query and page content
            
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
            
            result = self.workflow_service.run_highlight_workflow(state)
            
            return HighlightResponse(
                highlights=result['highlights'],
                reasoning=result['reasoning'],
                method="gemini_agentic"
            )
            
        except Exception as e:
            error_msg = Config.ERROR_MESSAGES["highlighting_failed"].format(error=str(e))
            raise HTTPException(status_code=500, detail=error_msg)
    
    async def autofill_form(self, request: AutofillRequest) -> AutofillResponse:
        """
        Handle form autofill request
        
        Args:
            request: Autofill request with form data and page content
            
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
            
            result = self.workflow_service.run_autofill_workflow(state)
            
            return AutofillResponse(
                form_data=result['suggestions'],
                confidence=result['confidence'],
                reasoning=result['reasoning'],
                method="gemini_autofill"
            )
            
        except Exception as e:
            error_msg = Config.ERROR_MESSAGES["autofill_failed"].format(error=str(e))
            raise HTTPException(status_code=500, detail=error_msg)
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Handle health check request
        
        Returns:
            Dict: Health status information
        """
        return Config.get_health_info()
    
    async def get_api_info(self) -> Dict[str, Any]:
        """
        Handle root endpoint request
        
        Returns:
            Dict: API information and endpoint descriptions
        """
        return Config.get_api_info() 