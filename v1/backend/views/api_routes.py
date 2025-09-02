"""
API Routes for WebAI
Defines FastAPI routes and endpoint configurations
"""

from fastapi import APIRouter
from models.request_models import (
    SummaryRequest, HighlightRequest, AutofillRequest,
    SummaryResponse, HighlightResponse, AutofillResponse
)
from controllers.api_controller import APIController

# Create router
router = APIRouter()

# Initialize controller
api_controller = APIController()


@router.post("/summarize", response_model=SummaryResponse)
async def summarize_content(request: SummaryRequest):
    """
    Summarize web page content using LangGraph and Gemini
    
    This endpoint receives web page content from the Chrome extension and
    processes it through the summary workflow. It orchestrates the entire
    summarization process, including content analysis, key point extraction,
    and highlight generation.
    """
    return await api_controller.summarize_content(request)


@router.post("/highlight", response_model=HighlightResponse)
async def highlight_content(request: HighlightRequest):
    """
    Highlight text sections based on user query using agentic AI
    
    This endpoint receives a user query and web page content, then uses
    Gemini to intelligently identify relevant text sections. It goes beyond
    simple keyword matching to understand semantic meaning and context.
    """
    return await api_controller.highlight_content(request)


@router.post("/autofill", response_model=AutofillResponse)
async def autofill_form(request: AutofillRequest):
    """
    Suggest form field values using intelligent AI analysis
    
    This endpoint analyzes web page content and form field names to suggest
    appropriate values for autofill. It considers page context, field names,
    and user behavior patterns to make intelligent suggestions.
    """
    return await api_controller.autofill_form(request)


@router.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring system status
    
    This endpoint provides basic health information about the API service,
    including status, timestamp, service name, and model information.
    """
    return await api_controller.health_check()


@router.get("/")
async def root():
    """
    Root endpoint providing API information and documentation
    
    This endpoint serves as the main entry point for the API, providing
    information about available endpoints and their purposes.
    """
    return await api_controller.get_api_info() 