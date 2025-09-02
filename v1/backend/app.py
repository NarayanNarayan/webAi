#!/usr/bin/env python3
"""
Main WebAI Application
FastAPI application with MVC architecture
"""

from fastapi import FastAPI
from views.api_routes import router
import uvicorn
from config import Config

# Create FastAPI app
app = FastAPI(
    title=Config.API_TITLE,
    version=Config.API_VERSION,
    description=Config.API_DESCRIPTION
)

# Include API routes
app.include_router(router, prefix="/api/v1")

# Root redirect to API info
@app.get("/")
async def root():
    """Redirect to API info"""
    from controllers.api_controller import APIController
    controller = APIController()
    return await controller.get_api_info()


if __name__ == "__main__":
    print("Starting WebAI LangGraph API server with MVC architecture...")
    print("Access the API at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Make sure to set GOOGLE_API_KEY environment variable")
    uvicorn.run(app, host=Config.HOST, port=Config.PORT) 