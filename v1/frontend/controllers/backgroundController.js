/**
 * Background Controller for WebAI Frontend
 * Handles background script logic and message routing
 */

class BackgroundController {
  /**
   * Initialize background controller
   */
  constructor() {
    this.currentPageData = null;
    this.apiService = new APIService();
    this.init();
  }

  /**
   * Initialize the controller
   */
  init() {
    this.setupMessageListeners();
  }

  /**
   * Setup message listeners for communication with popup and content scripts
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'refreshPageData':
          this.handleRefreshPageData(sendResponse);
          break;
        case 'pageData':
          this.handlePageData(request.data, sendResponse);
          break;
        case 'summarize':
          this.handleSummarize(request.method, sendResponse);
          break;
        case 'highlight':
          this.handleHighlight(request.query, sendResponse);
          break;
        case 'autofill':
          this.handleAutofill(request.formData, sendResponse);
          break;
        case 'getCurrentPageData':
          this.handleGetCurrentPageData(sendResponse);
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
      return true; // Keep message channel open for async response
    });
  }

  /**
   * Handle refresh page data request
   */
  async handleRefreshPageData(sendResponse) {
    try {
      const data = await this.getCurrentPageData();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle page data from content script
   */
  handlePageData(data, sendResponse) {
    this.currentPageData = data;
    sendResponse({ success: true });
  }

  /**
   * Handle summarization request
   */
  async handleSummarize(method, sendResponse) {
    try {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      let result;
      if (method === 'simple') {
        result = this.apiService.simpleSummarize(this.currentPageData);
      } else {
        result = await this.apiService.summarizeContent(this.currentPageData);
      }

      if (result.success) {
        sendResponse({ success: true, summary: result.data });
      } else {
        sendResponse({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Summarization error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle highlighting request
   */
  async handleHighlight(query, sendResponse) {
    try {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      const result = await this.apiService.highlightContent(this.currentPageData, query);

      if (result.success) {
        sendResponse({ success: true, result: result.data });
      } else {
        sendResponse({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Highlighting error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle autofill request
   */
  async handleAutofill(formData, sendResponse) {
    try {
      // Get fresh page data if not available
      if (!this.currentPageData) {
        await this.getCurrentPageData();
      }

      const result = await this.apiService.autofillForm(this.currentPageData, formData);

      if (result.success) {
        sendResponse({ success: true, result: result.data });
      } else {
        sendResponse({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Autofill error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle get current page data request
   */
  async handleGetCurrentPageData(sendResponse) {
    try {
      const data = await this.getCurrentPageData();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Get current page data from content script
   */
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

  /**
   * Check API health
   */
  async checkAPIHealth() {
    try {
      const result = await this.apiService.checkHealth();
      return result.success;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API status
   */
  async getAPIStatus() {
    const isHealthy = await this.checkAPIHealth();
    return {
      api_available: isHealthy,
      timestamp: new Date().toISOString()
    };
  }
}

// Export controller for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundController;
} 