# WebAI MVC Architecture

This project has been refactored to follow the Model-View-Controller (MVC) architecture pattern for better code organization, maintainability, and scalability.

## Architecture Overview

```
WebAI/
├── models/                 # Data Layer
│   ├── __init__.py
│   ├── request_models.py   # API Request/Response Models
│   └── state_models.py     # LangGraph State Models
├── views/                  # Presentation Layer
│   ├── __init__.py
│   └── api_routes.py       # FastAPI Route Definitions
├── controllers/            # Request Handling Layer
│   ├── __init__.py
│   └── api_controller.py   # API Request Controllers
├── services/               # Business Logic Layer
│   ├── __init__.py
│   ├── ai_service.py       # AI/Gemini Service
│   └── workflow_service.py # LangGraph Workflow Service
├── utils/                  # Utility Functions
│   ├── __init__.py
│   └── content_utils.py    # Content Processing Utilities
├── config.py               # Application Configuration
├── app.py                  # Main Application Entry Point
└── langgraph_server.py     # Legacy Server (for reference)
```

## MVC Components

### 1. Models (Data Layer)
**Location**: `models/`

**Purpose**: Define data structures and validation rules

**Components**:
- `request_models.py`: Pydantic models for API requests/responses
- `state_models.py`: TypedDict models for LangGraph workflows

**Responsibilities**:
- Data validation
- Type safety
- API contract definition
- State structure definition

### 2. Views (Presentation Layer)
**Location**: `views/`

**Purpose**: Handle HTTP routing and response formatting

**Components**:
- `api_routes.py`: FastAPI route definitions

**Responsibilities**:
- URL routing
- Request/response formatting
- API documentation
- Endpoint definitions

### 3. Controllers (Request Handling Layer)
**Location**: `controllers/`

**Purpose**: Orchestrate business logic and handle HTTP requests

**Components**:
- `api_controller.py`: API request handlers

**Responsibilities**:
- Request validation
- Response formatting
- Error handling
- Service orchestration

### 4. Services (Business Logic Layer)
**Location**: `services/`

**Purpose**: Implement core business logic and external integrations

**Components**:
- `ai_service.py`: Gemini AI integration
- `workflow_service.py`: LangGraph workflow management

**Responsibilities**:
- AI model interactions
- Workflow execution
- Business logic implementation
- External API calls

### 5. Utils (Utility Functions)
**Location**: `utils/`

**Purpose**: Provide reusable utility functions

**Components**:
- `content_utils.py`: Content processing utilities

**Responsibilities**:
- Content parsing
- Text extraction
- Response parsing
- Helper functions

### 6. Configuration
**Location**: `config.py`

**Purpose**: Centralized application configuration

**Responsibilities**:
- Environment variables
- Application settings
- Error messages
- API endpoints

## Benefits of MVC Architecture

### 1. **Separation of Concerns**
- Models handle data structure and validation
- Views handle presentation and routing
- Controllers handle request orchestration
- Services handle business logic

### 2. **Maintainability**
- Clear code organization
- Easy to locate specific functionality
- Reduced code duplication
- Modular design

### 3. **Testability**
- Each layer can be tested independently
- Mock services for unit testing
- Clear interfaces between components

### 4. **Scalability**
- Easy to add new features
- Modular service architecture
- Clear dependency management
- Configuration-driven design

### 5. **Reusability**
- Services can be reused across controllers
- Utils can be shared across components
- Models provide consistent data structures

## Data Flow

```
HTTP Request → Views → Controllers → Services → Models
                ↓
HTTP Response ← Views ← Controllers ← Services ← Models
```

1. **HTTP Request** arrives at a route in `views/api_routes.py`
2. **View** delegates to appropriate **Controller** method
3. **Controller** validates request using **Models**
4. **Controller** calls appropriate **Service** methods
5. **Service** processes business logic and returns results
6. **Controller** formats response using **Models**
7. **View** returns HTTP response

## Key Features

### 1. **Configuration Management**
- Centralized configuration in `config.py`
- Environment variable validation
- Error message management
- API endpoint definitions

### 2. **Error Handling**
- Consistent error messages
- Proper HTTP status codes
- Detailed error logging
- Graceful fallbacks

### 3. **Type Safety**
- Pydantic models for API contracts
- TypedDict for internal state
- Type hints throughout codebase
- Runtime validation

### 4. **Modular Services**
- AI service for Gemini interactions
- Workflow service for LangGraph
- Easy to add new services
- Clear service interfaces

## Usage

### Running the Application
```bash
# Set environment variable
export GOOGLE_API_KEY="your-api-key"

# Run the application
python app.py
```

### API Endpoints
- `POST /api/v1/summarize`: Content summarization
- `POST /api/v1/highlight`: Text highlighting
- `POST /api/v1/autofill`: Form autofill
- `GET /api/v1/health`: Health check
- `GET /`: API information

### Adding New Features
1. **Add Model**: Define data structure in `models/`
2. **Add Service**: Implement business logic in `services/`
3. **Add Controller**: Handle requests in `controllers/`
4. **Add View**: Define routes in `views/`
5. **Update Config**: Add configuration in `config.py`

## Migration from Legacy

The original `langgraph_server.py` has been preserved for reference. The new MVC structure provides:

- Better code organization
- Improved maintainability
- Enhanced testability
- Clearer separation of concerns
- More scalable architecture

All functionality from the original server has been preserved while improving the overall code structure and maintainability. 