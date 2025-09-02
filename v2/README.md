# Web AI Extension

A Chrome extension that provides AI-powered webpage summarization, similarity search, and form analysis using LangChain.js and a RAG (Retrieval-Augmented Generation) server.

## Features

- **AI-Powered Summarization**: Generate intelligent summaries of webpages using Google's Gemini API
- **Similarity Search**: Find similar webpages based on content summaries using semantic similarity
- **Form Analysis**: Analyze and understand form structures on webpages
- **Autofill Capabilities**: Intelligent form filling based on analyzed content
- **Modular Architecture**: Clean, maintainable code structure following MVC patterns
- **RAG Integration**: Connect to a RAG server for advanced similarity search
- **Configurable Settings**: Customize API keys, summary lengths, and similarity thresholds

## Architecture

The extension follows a modular architecture with clear separation of concerns:

```
v2/
├── src/
│   ├── config/           # Configuration and constants
│   ├── controllers/      # Business logic controllers
│   ├── services/         # Core services (AI, RAG, Storage, Content)
│   ├── views/           # UI components and views
│   ├── popup.html       # Extension popup interface
│   ├── options.html     # Settings and configuration page
│   ├── popup.js         # Popup entry point
│   ├── options.js       # Options page entry point
│   ├── background.js    # Background service worker
│   ├── content.js       # Content script for webpage interaction
│   ├── popup.css        # Popup styling
│   └── options.css      # Options page styling
├── rag-server-example.py # Example RAG server implementation
├── requirements.txt      # Python dependencies for RAG server
├── package.json         # Node.js dependencies and scripts
├── vite.config.js       # Vite build configuration
└── README.md            # This file
```

### Core Components

1. **Services Layer**
   - `AIService`: Handles Gemini API integration and summarization
   - `RAGService`: Communicates with RAG server for similarity search
   - `StorageService`: Manages Chrome extension storage operations
   - `ContentService`: Extracts webpage content and analyzes forms

2. **Controllers Layer**
   - `PopupController`: Manages popup interface and user interactions
   - `OptionsController`: Handles settings and configuration

3. **Views Layer**
   - `PopupView`: UI management for the extension popup
   - `OptionsView`: UI management for the options page

## Setup Instructions

### 1. Install Dependencies

```bash
cd v2
npm install
```

### 2. Configure API Keys

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open the extension options page
3. Enter your Gemini API key
4. Save the settings

### 3. Set up RAG Server (Optional)

The extension can work without a RAG server, but for full functionality:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the RAG server
python rag-server-example.py
```

The RAG server will be available at `http://localhost:8000`.

### 4. Build the Extension

```bash
# Development build
npm run dev

# Production build
npm run build

# Build for extension
npm run build:extension
```

### 5. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `v2/dist` folder

## Usage

### Basic Workflow

1. **Navigate to a webpage** you want to analyze
2. **Click the extension icon** to open the popup
3. **Click "Summarize Page"** to generate an AI summary
4. **Click "Find Similar"** to discover related webpages
5. **Click "Analyze Forms"** to examine form structures

### Features in Detail

#### Webpage Summarization
- Automatically extracts main content from webpages
- Generates intelligent summaries using Gemini AI
- Configurable summary lengths (short, medium, long)
- Stores summaries locally and in RAG server

#### Similarity Search
- Compares webpage summaries using semantic similarity
- Configurable similarity threshold
- Returns relevant webpages with similarity scores
- Integrates with RAG server for advanced search

#### Form Analysis
- Identifies forms on webpages
- Analyzes form fields, types, and requirements
- Provides insights for potential autofill operations
- Visual indicators for detected forms

#### Settings & Configuration
- Gemini API key management
- RAG server configuration
- Summary length preferences
- Similarity threshold adjustment
- Auto-summarization toggle

## API Endpoints

The RAG server provides the following endpoints:

- `GET /api/health` - Server health check
- `POST /api/store` - Store webpage summary
- `POST /api/similar` - Find similar webpages
- `GET /api/stats` - Get server statistics
- `GET /api/webpages` - List all stored webpages
- `POST /api/clear` - Clear all data (for testing)

## Configuration

### Extension Settings

- **Gemini API Key**: Required for AI summarization
- **RAG Server URL**: Optional, defaults to `http://localhost:8000`
- **Auto-summarize**: Automatically summarize pages on visit
- **Summary Length**: Choose between short, medium, or long summaries
- **Similarity Threshold**: Adjust sensitivity for similarity search (0.0 - 1.0)

### RAG Server Settings

- **Model**: Uses `all-MiniLM-L6-v2` for sentence embeddings
- **Storage**: File-based storage (JSON) - can be replaced with database
- **Similarity**: Cosine similarity with configurable threshold
- **Port**: Defaults to 8000

## Development

### Project Structure

The extension uses modern JavaScript modules and Vite for building:

- **ES6 Modules**: All code uses ES6 import/export syntax
- **Vite Build**: Fast development and optimized production builds
- **Chrome Extension**: Manifest V3 compatible
- **Service Worker**: Background script for extension logic

### Adding New Features

1. **Create a new service** in `src/services/`
2. **Add controller logic** in `src/controllers/`
3. **Update views** in `src/views/`
4. **Add UI components** in HTML files
5. **Style with CSS** in respective CSS files

### Testing

- Use Chrome DevTools for debugging
- Check the console for error messages
- Test with different webpage types
- Verify RAG server connectivity

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure Gemini API key is correctly configured
2. **RAG Server Connection**: Check if server is running and accessible
3. **Content Extraction**: Some websites may block content extraction
4. **Storage Issues**: Clear extension data if storage becomes corrupted

### Debug Mode

Enable debug logging in the browser console:

```javascript
// In browser console
localStorage.setItem('webAiDebug', 'true');
```

## Security Considerations

- API keys are stored in Chrome's secure storage
- Content extraction is limited to user-accessible pages
- No sensitive data is transmitted to external servers
- RAG server should be hosted securely in production

## Performance

- Content extraction is optimized for speed
- Summaries are cached locally
- RAG server uses efficient similarity algorithms
- Extension minimizes memory usage

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## License

This project is provided as-is for educational and development purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console for error messages
3. Verify API keys and server connectivity
4. Check browser compatibility

---

**Note**: This extension requires an active internet connection for AI services and RAG server communication.
