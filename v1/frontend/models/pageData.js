/**
 * Page Data Models for WebAI Frontend
 * Defines data structures for page content and API requests
 */

class PageData {
  /**
   * Model for page content data
   */
  constructor(url, title, content, timestamp) {
    this.url = url || '';
    this.title = title || '';
    this.content = content || '';
    this.timestamp = timestamp || new Date().toISOString();
  }

  /**
   * Create PageData from DOM content
   */
  static fromDOM() {
    return new PageData(
      window.location.href,
      document.title,
      null, // Will be set by content extraction
      new Date().toISOString()
    );
  }

  /**
   * Validate page data
   */
  validate() {
    return this.url && this.title && this.content;
  }

  /**
   * Convert to API payload format
   */
  toAPIPayload() {
    return {
      url: this.url,
      title: this.title,
      content: this.content,
      timestamp: this.timestamp
    };
  }
}

class SummaryRequest {
  /**
   * Model for summarization request
   */
  constructor(pageData, method = 'langgraph') {
    this.pageData = pageData;
    this.method = method;
  }

  /**
   * Convert to API request format
   */
  toAPIRequest() {
    return {
      url: this.pageData.url,
      title: this.pageData.title,
      content: this.pageData.content,
      timestamp: this.pageData.timestamp,
      action: 'summarize'
    };
  }
}

class HighlightRequest {
  /**
   * Model for highlighting request
   */
  constructor(pageData, query) {
    this.pageData = pageData;
    this.query = query;
  }

  /**
   * Convert to API request format
   */
  toAPIRequest() {
    return {
      url: this.pageData.url,
      title: this.pageData.title,
      content: this.pageData.content,
      query: this.query
    };
  }
}

class AutofillRequest {
  /**
   * Model for autofill request
   */
  constructor(pageData, formData) {
    this.pageData = pageData;
    this.formData = formData;
  }

  /**
   * Convert to API request format
   */
  toAPIRequest() {
    return {
      url: this.pageData.url,
      title: this.pageData.title,
      content: this.pageData.content,
      form_data: this.formData
    };
  }
}

class SummaryResponse {
  /**
   * Model for summarization response
   */
  constructor(data) {
    this.summary = data.summary || '';
    this.method = data.method || 'langgraph_gemini';
    this.word_count = data.word_count || 0;
    this.key_points = data.key_points || [];
    this.highlights = data.highlights || [];
  }

  /**
   * Check if response is valid
   */
  isValid() {
    return this.summary && this.summary.length > 0;
  }

  /**
   * Get summary text
   */
  getSummaryText() {
    return this.summary;
  }

  /**
   * Get key points as array
   */
  getKeyPoints() {
    return Array.isArray(this.key_points) ? this.key_points : [];
  }

  /**
   * Get highlights as array
   */
  getHighlights() {
    return Array.isArray(this.highlights) ? this.highlights : [];
  }
}

class HighlightResponse {
  /**
   * Model for highlighting response
   */
  constructor(data) {
    this.highlights = data.highlights || [];
    this.reasoning = data.reasoning || '';
    this.method = data.method || 'gemini_agentic';
  }

  /**
   * Check if response is valid
   */
  isValid() {
    return Array.isArray(this.highlights) && this.highlights.length > 0;
  }

  /**
   * Get highlights as array
   */
  getHighlights() {
    return this.highlights;
  }

  /**
   * Get reasoning text
   */
  getReasoning() {
    return this.reasoning;
  }
}

class AutofillResponse {
  /**
   * Model for autofill response
   */
  constructor(data) {
    this.form_data = data.form_data || {};
    this.confidence = data.confidence || 0.0;
    this.reasoning = data.reasoning || '';
    this.method = data.method || 'gemini_autofill';
  }

  /**
   * Check if response is valid
   */
  isValid() {
    return Object.keys(this.form_data).length > 0;
  }

  /**
   * Get form data
   */
  getFormData() {
    return this.form_data;
  }

  /**
   * Get confidence score
   */
  getConfidence() {
    return this.confidence;
  }

  /**
   * Get reasoning text
   */
  getReasoning() {
    return this.reasoning;
  }
}

// Export models for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PageData,
    SummaryRequest,
    HighlightRequest,
    AutofillRequest,
    SummaryResponse,
    HighlightResponse,
    AutofillResponse
  };
} 