/**
 * API Service for WebAI Frontend
 * Handles all communication with the backend API
 */

class APIService {
  /**
   * Initialize API service
   */
  constructor() {
    this.baseURL = 'http://localhost:8000/api/v1';
    this.endpoints = {
      summarize: '/summarize',
      highlight: '/highlight',
      autofill: '/autofill',
      health: '/health'
    };
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, data = null, options = {}) {
    try {
      const url = this.baseURL + endpoint;
      const requestOptions = {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      if (data) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('API request error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Summarize content using backend API
   */
  async summarizeContent(pageData) {
    const payload = {
      url: pageData.url,
      title: pageData.title,
      content: pageData.content,
      timestamp: pageData.timestamp
    };

    return await this.makeRequest(this.endpoints.summarize, payload);
  }

  /**
   * Highlight content using backend API
   */
  async highlightContent(pageData, query) {
    const payload = {
      url: pageData.url,
      title: pageData.title,
      content: pageData.content,
      query: query
    };

    return await this.makeRequest(this.endpoints.highlight, payload);
  }

  /**
   * Autofill form using backend API
   */
  async autofillForm(pageData, formData) {
    const payload = {
      url: pageData.url,
      title: pageData.title,
      content: pageData.content,
      form_data: formData
    };

    return await this.makeRequest(this.endpoints.autofill, payload);
  }

  /**
   * Check API health
   */
  async checkHealth() {
    return await this.makeRequest(this.endpoints.health);
  }

  /**
   * Simple summarization (client-side fallback)
   */
  simpleSummarize(pageData) {
    try {
      const content = JSON.parse(pageData.content);
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
        success: true,
        data: {
          summary,
          word_count: words.length,
          method: 'simple'
        }
      };
    } catch (error) {
      console.error('Error in simple summarization:', error);
      return {
        success: false,
        error: 'Unable to generate summary'
      };
    }
  }
}

// Export service for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
} 