/**
 * Main Background Script for WebAI Extension
 * Uses MVC architecture for better organization
 */

// Import MVC components
// Note: In a real extension, you would need to bundle these or load them separately
// For now, we'll assume the classes are available globally

// Initialize MVC components
if (typeof BackgroundController !== 'undefined') {
  // Initialize the background controller
  const backgroundController = new BackgroundController();
  console.log('WebAI Background initialized with MVC architecture');
} else {
  console.warn('MVC components not loaded, using fallback background');
  
  // Fallback to original background functionality
  class WebAIBackground {
    constructor() {
      this.currentPageData = null;
      this.apiEndpoint = 'http://localhost:8000/api/v1/summarize';
      this.init();
    }

    init() {
      // Listen for messages from content scripts and popup
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'refreshPageData') {
          this.getCurrentPageData().then(data => {
            sendResponse({ success: true, data });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
        } else if (request.action === 'pageData') {
          this.currentPageData = request.data;
          sendResponse({ success: true });
        } else if (request.action === 'summarize') {
          const method = request.method || 'langgraph';
          if (method === 'simple') {
            this.simpleSummarize().then(summary => {
              sendResponse({ success: true, summary });
            }).catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          } else {
            this.summarizeContent().then(summary => {
              sendResponse({ success: true, summary });
            }).catch(error => {
              sendResponse({ success: false, error: error.message });
            });
          }
          return true; // Keep message channel open for async response
        } else if (request.action === 'highlight') {
          this.highlightContent(request.query).then(result => {
            sendResponse({ success: true, result });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
        } else if (request.action === 'autofill') {
          this.autofillForm(request.formData).then(result => {
            sendResponse({ success: true, result });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
        } else if (request.action === 'getCurrentPageData') {
          this.getCurrentPageData().then(data => {
            sendResponse({ success: true, data });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // Keep message channel open for async response
        }
      });
    }

    async summarizeContent() {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      try {
        // Prepare the data for LangGraph
        const langGraphPayload = {
          url: this.currentPageData.url,
          title: this.currentPageData.title,
          content: this.currentPageData.miniBodyJson,
          timestamp: this.currentPageData.timestamp
        };

        // Call LangGraph API
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY' // Replace with your API key
          },
          body: JSON.stringify(langGraphPayload)
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("Narayan result", result);
        return result.summary || result;
      } catch (error) {
        console.error('Summarization error:', error);
        throw error;
      }
    }

    // Alternative method using a simple summarization approach
    async simpleSummarize() {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      // Simple summarization: extract text from content structure
      try {
        const content = JSON.parse(this.currentPageData.miniBodyJson);
        const textNodes = [];
        
        function extractText(node) {
          if (typeof node === 'object' && node !== null) {
            if (node.text && node.text.trim()) {
              textNodes.push(node.text.trim());
            }
            if (node.childs) {
              node.childs.forEach(extractText);
            }
          }
        }
        
        extractText(content);
        const words = textNodes.join(' ').split(/\s+/);
        
        // Simple summarization: take first 100 words and add ellipsis
        const summary = words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');
        
        return {
          summary,
          wordCount: words.length,
          method: 'simple'
        };
      } catch (error) {
        console.error('Error in simple summarization:', error);
        return {
          summary: 'Unable to generate summary',
          wordCount: 0,
          method: 'simple'
        };
      }
    }

    // Agentic highlighting using Gemini
    async highlightContent(query) {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      try {
        const payload = {
          url: this.currentPageData.url,
          title: this.currentPageData.title,
          content: this.currentPageData.miniBodyJson,
          query: query
        };

        const response = await fetch(this.apiEndpoint.replace('/summarize', '/highlight'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY' // Replace with your API key
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Highlighting error:', error);
        throw error;
      }
    }

    // Get current page data from content script
    async getCurrentPageData() {
      try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
          throw new Error('No active tab found');
        }

        // Query content script for current page data
        return new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error('Failed to get page content'));
              return;
            }

            if (response && response.success) {
              this.currentPageData = response.content;
              resolve(response.content);
            } else {
              reject(new Error('No page data available'));
            }
          });
        });
      } catch (error) {
        console.error('Error getting current page data:', error);
        throw error;
      }
    }

    // Intelligent form autofill using Gemini
    async autofillForm(formData) {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      try {
        const payload = {
          url: this.currentPageData.url,
          title: this.currentPageData.title,
          content: this.currentPageData.miniBodyJson,
          form_data: formData
        };

        const response = await fetch(this.apiEndpoint.replace('/summarize', '/autofill'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY' // Replace with your API key
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Autofill error:', error);
        throw error;
      }
    }
  }

  // Initialize fallback background
  new WebAIBackground();
} 