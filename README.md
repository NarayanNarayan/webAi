# WebAI Chrome Extension with Gemini & LangGraph

A Chrome extension that uses **Gemini LLM** and **LangGraph** for intelligent web page analysis, including text summarization, agentic highlighting, and form autofill. The extension leverages the Parser.js file to extract and minify HTML content, then sends it to a LangGraph API powered by Gemini for advanced AI processing.

## Features

- **🤖 Gemini LLM Integration**: Uses Google's Gemini Pro model for intelligent content analysis
- **🔄 LangGraph Workflows**: Implements structured LangGraph workflows for different AI tasks
- **✨ Agentic Text Highlighting**: Intelligently highlights relevant text based on user queries
- **📝 Form Autofill**: Suggests and applies form field values using AI analysis
- **📊 Intelligent Summarization**: Advanced summarization with key points and highlights
- **🎯 Content Extraction**: Uses the Parser.js DOM bridge to extract and minify web page content
- **💾 Copy & Save**: Copy results to clipboard or save them as text files
- **🎨 Modern UI**: Clean, responsive popup interface with loading states and error handling
- **⚡ Real-time Updates**: Automatically updates when navigating between pages

## Installation

### 1. Clone or Download the Extension

```bash
git clone <repository-url>
cd WebAI
```

### 2. Configure Gemini API

1. Get your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set the environment variable:
   ```bash
   export GOOGLE_API_KEY="your-gemini-api-key-here"
   ```
3. Edit `background.js` and update the API endpoint:
   ```javascript
   this.apiEndpoint = 'http://localhost:8000/summarize'; // Your LangGraph API endpoint
   ```

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory
4. The extension should now appear in your extensions list

## Usage

### Basic Usage

1. Navigate to any web page you want to analyze
2. Click the WebAI extension icon in your browser toolbar
3. Use the different features:
   - **Summarize Page**: Generate intelligent summaries using Gemini
   - **Simple Summary**: Basic text extraction
   - **Agentic Highlighting**: Find and highlight specific content
   - **Form Autofill**: Get AI suggestions for form fields

### Advanced Features

#### Agentic Highlighting
1. Enter a query in the "What would you like to highlight?" field
2. Click "Highlight" to find relevant text sections
3. Click "Apply to Page" to highlight the text on the actual webpage

#### Form Autofill
1. Enter form field names (comma-separated) in the "Form fields" field
2. Click "Suggest" to get AI-powered form suggestions
3. Click "Apply to Forms" to automatically fill forms on the page

### Features

- **Summarize Page**: Uses LangGraph API for intelligent summarization
- **Simple Summary**: Extracts first 100 words as a quick summary
- **Copy**: Copy the generated summary to clipboard
- **Save**: Download the summary as a text file

## File Structure

```
WebAI/
├── manifest.json          # Extension manifest
├── Parser.js             # DOM parsing and content extraction
├── content.js            # Content script for web pages
├── background.js         # Background service worker
├── popup.html           # Extension popup interface
├── popup.css            # Popup styling
├── popup.js             # Popup functionality
└── README.md            # This file
```

## Configuration

### LangGraph API Setup

The extension expects a LangGraph API endpoint that accepts POST requests with the following payload:

```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "content": "minified JSON content",
  "flatText": "extracted text content",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

The API returns responses with different structures based on the endpoint:

#### Summarization Response
```json
{
  "summary": "Generated summary text",
  "method": "langgraph_gemini",
  "key_points": ["Point 1", "Point 2"],
  "highlights": [{"text": "highlighted text", "reasoning": "why", "confidence": 0.8}]
}
```

#### Highlighting Response
```json
{
  "highlights": [{"text": "found text", "reasoning": "explanation", "confidence": 0.9}],
  "reasoning": "Overall reasoning",
  "method": "gemini_agentic"
}
```

#### Autofill Response
```json
{
  "form_data": {"name": "John Doe", "email": "john@example.com"},
  "confidence": 0.85,
  "reasoning": "Based on page context",
  "method": "gemini_autofill"
}
```

### API Key Configuration

1. Obtain your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set the environment variable before starting the server:
   ```bash
   export GOOGLE_API_KEY="your-gemini-api-key-here"
   ```
3. The server will automatically use the Gemini API key for all AI operations

## Development

### Local Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the WebAI extension
4. Test your changes

### Debugging

- **Content Script**: Check browser console for content script logs
- **Background Script**: Check extension service worker in DevTools
- **Popup**: Right-click extension icon and select "Inspect popup"

## API Integration

### LangGraph API Requirements

Your LangGraph API should:

1. Accept POST requests with JSON payload
2. Process the minified JSON content and flat text
3. Return a structured response with summary
4. Handle errors gracefully

### Example LangGraph Implementation

```python
from langgraph import StateGraph, END
from typing import TypedDict, Annotated
import json

class SummaryState(TypedDict):
    url: str
    title: str
    content: str
    flat_text: str
    summary: str

def extract_key_points(state: SummaryState) -> SummaryState:
    # Your LangGraph logic here
    # Process state["content"] and state["flat_text"]
    return state

def generate_summary(state: SummaryState) -> SummaryState:
    # Generate final summary
    return state

# Build your LangGraph workflow
workflow = StateGraph(SummaryState)
workflow.add_node("extract", extract_key_points)
workflow.add_node("summarize", generate_summary)
workflow.set_entry_point("extract")
workflow.add_edge("extract", "summarize")
workflow.add_edge("summarize", END)

app = workflow.compile()
```

## Troubleshooting

### Common Issues

1. **Extension not loading**: Check manifest.json syntax and file paths
2. **API errors**: Verify your API endpoint and key configuration
3. **No page data**: Ensure content script is running on the page
4. **CORS issues**: Configure your LangGraph API to accept requests from Chrome extensions

### Error Messages

- "No page data available": Content script hasn't loaded or page is not accessible
- "API request failed": Check your API endpoint and authentication
- "Failed to generate summary": Network or API configuration issue

## Security Notes

- API keys are stored in the background script (not secure for production)
- Consider using OAuth or other secure authentication methods
- The extension requests broad permissions for content access
- Review permissions before installing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the Chrome extension documentation
3. Open an issue in the repository 