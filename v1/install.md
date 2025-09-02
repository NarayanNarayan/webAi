# Installation Guide for WebAI Chrome Extension

## Quick Start

### Step 1: Set up the LangGraph API Server (Optional)

If you want to use the provided example server:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the server
python langgraph_server.py
```

The server will run at `http://localhost:8000`

### Step 2: Configure the Extension

1. Open `background.js`
2. Update the API endpoint:
   ```javascript
   this.apiEndpoint = 'http://localhost:8000/summarize'; // For local testing
   ```
3. Remove or update the API key line:
   ```javascript
   // Remove this line for local testing
   // 'Authorization': 'Bearer YOUR_API_KEY'
   ```

### Step 3: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the WebAI directory containing all the extension files
5. The extension should now appear in your extensions list

### Step 4: Test the Extension

1. Navigate to any web page
2. Click the WebAI extension icon in your browser toolbar
3. Click "Summarize Page" to test the LangGraph integration
4. Use "Simple Summary" for a basic text extraction

## Troubleshooting

### Extension Not Loading
- Check that all files are in the same directory
- Verify `manifest.json` syntax is correct
- Ensure "Developer mode" is enabled in Chrome extensions

### API Connection Issues
- Verify the LangGraph server is running
- Check the API endpoint URL in `background.js`
- Test the API endpoint directly in your browser

### No Page Data
- Refresh the web page
- Check browser console for content script errors
- Ensure the page is fully loaded before using the extension

## File Checklist

Make sure you have all these files in your extension directory:

- [ ] `manifest.json`
- [ ] `Parser.js`
- [ ] `content.js`
- [ ] `background.js`
- [ ] `popup.html`
- [ ] `popup.css`
- [ ] `popup.js`
- [ ] `README.md`

## Next Steps

1. **Customize the API**: Modify `langgraph_server.py` to integrate with your own LangGraph workflows
2. **Add Authentication**: Implement proper API key management
3. **Enhance UI**: Customize the popup interface in `popup.html` and `popup.css`
4. **Add Features**: Extend the functionality with highlighting, note-taking, etc.

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are present and correctly named
3. Test the API endpoint independently
4. Review the README.md for detailed documentation 