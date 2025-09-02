# Quick Installation Guide

## Prerequisites

- Node.js 16+ and npm
- Chrome browser (or Chromium-based)
- Python 3.8+ (for RAG server)

## Quick Start

1. **Install dependencies:**
   ```bash
   cd v2
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build:extension
   ```

3. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `v2/dist` folder

4. **Configure API key:**
   - Click the extension icon
   - Click "Settings"
   - Enter your Gemini API key
   - Save settings

## Optional: RAG Server

For similarity search functionality:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run server
python rag-server-example.py
```

The server will be available at `http://localhost:8000`.

## Usage

1. Navigate to any webpage
2. Click the extension icon
3. Use "Summarize Page" to generate AI summaries
4. Use "Find Similar" to discover related content
5. Use "Analyze Forms" to examine page forms

## Troubleshooting

- Check browser console for errors
- Verify API key is correct
- Ensure RAG server is running (if using similarity search)
- Check extension permissions in Chrome

## Support

See `README.md` for detailed documentation and troubleshooting.
