/**
 * Frontend Configuration for WebAI Extension
 * Centralized configuration settings for the frontend
 */

class FrontendConfig {
  /**
   * API Configuration
   */
  static API = {
    BASE_URL: 'http://localhost:8000/api/v1',
    ENDPOINTS: {
      SUMMARIZE: '/summarize',
      HIGHLIGHT: '/highlight',
      AUTOFILL: '/autofill',
      HEALTH: '/health'
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  };

  /**
   * UI Configuration
   */
  static UI = {
    HIGHLIGHT_COLOR: '#ffeb3b',
    HIGHLIGHT_TEXT_COLOR: '#000',
    HIGHLIGHT_PADDING: '2px 4px',
    HIGHLIGHT_BORDER_RADIUS: '3px',
    HIGHLIGHT_FONT_WEIGHT: 'bold',
    HIGHLIGHT_CLASS: 'webai-highlight',
    LOADING_DELAY: 1000, // 1 second
    ANIMATION_DURATION: 300 // 300ms
  };

  /**
   * Content Configuration
   */
  static CONTENT = {
    MAX_SUMMARY_LENGTH: 200,
    MAX_HIGHLIGHTS: 10,
    MIN_TEXT_LENGTH: 10,
    EXTRACT_TEXT_NODES: 5,
    FORM_SELECTORS: [
      'input[name*="{field}" i]',
      'input[placeholder*="{field}" i]',
      'input[id*="{field}" i]',
      'textarea[name*="{field}" i]',
      'textarea[placeholder*="{field}" i]',
      'textarea[id*="{field}" i]'
    ]
  };

  /**
   * Error Messages
   */
  static ERROR_MESSAGES = {
    API_REQUEST_FAILED: 'API request failed: {error}',
    SUMMARIZATION_FAILED: 'Summarization failed: {error}',
    HIGHLIGHTING_FAILED: 'Highlighting failed: {error}',
    AUTOFILL_FAILED: 'Autofill failed: {error}',
    NO_PAGE_DATA: 'No page data available',
    NO_FORMS_FOUND: 'No forms found on page',
    FAILED_TO_COPY: 'Failed to copy to clipboard',
    FAILED_TO_SAVE: 'Failed to save summary'
  };

  /**
   * Success Messages
   */
  static SUCCESS_MESSAGES = {
    SUMMARY_GENERATED: 'Summary generated successfully',
    HIGHLIGHTS_GENERATED: 'Highlights generated',
    AUTOFILL_GENERATED: 'Autofill suggestions generated',
    HIGHLIGHTS_APPLIED: 'Applied {count} highlights',
    AUTOFILL_APPLIED: 'Filled {count} fields',
    SUMMARY_COPIED: 'Summary copied to clipboard',
    SUMMARY_SAVED: 'Summary saved'
  };

  /**
   * Status Messages
   */
  static STATUS_MESSAGES = {
    READY: 'Ready',
    LOADING: 'Loading...',
    SUMMARIZING: 'Summarizing...',
    HIGHLIGHTING: 'Highlighting...',
    ANALYZING_FORMS: 'Analyzing forms...',
    PAGE_DATA_LOADED: 'Page data loaded',
    NO_PAGE_DATA: 'No page data available',
    ERROR_LOADING_PAGE: 'Error loading page info'
  };

  /**
   * Feature Flags
   */
  static FEATURES = {
    ENABLE_SIMPLE_SUMMARIZATION: true,
    ENABLE_AGENTIC_HIGHLIGHTING: true,
    ENABLE_INTELLIGENT_AUTOFILL: true,
    ENABLE_COPY_TO_CLIPBOARD: true,
    ENABLE_SAVE_SUMMARY: true,
    ENABLE_FORM_EXTRACTION: true,
    ENABLE_PAGE_METADATA: true
  };

  /**
   * Performance Settings
   */
  static PERFORMANCE = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_CACHE_SIZE: 50,
    CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes
  };

  /**
   * Debug Settings
   */
  static DEBUG = {
    ENABLE_LOGGING: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_PERFORMANCE_MONITORING: false,
    LOG_LEVEL: 'info' // 'debug', 'info', 'warn', 'error'
  };

  /**
   * Get API endpoint URL
   */
  static getAPIEndpoint(endpoint) {
    return this.API.BASE_URL + this.API.ENDPOINTS[endpoint];
  }

  /**
   * Get error message with placeholder replacement
   */
  static getErrorMessage(key, params = {}) {
    let message = this.ERROR_MESSAGES[key] || key;
    Object.entries(params).forEach(([placeholder, value]) => {
      message = message.replace(`{${placeholder}}`, value);
    });
    return message;
  }

  /**
   * Get success message with placeholder replacement
   */
  static getSuccessMessage(key, params = {}) {
    let message = this.SUCCESS_MESSAGES[key] || key;
    Object.entries(params).forEach(([placeholder, value]) => {
      message = message.replace(`{${placeholder}}`, value);
    });
    return message;
  }

  /**
   * Check if feature is enabled
   */
  static isFeatureEnabled(feature) {
    return this.FEATURES[feature] === true;
  }

  /**
   * Get form selectors for a field
   */
  static getFormSelectors(fieldName) {
    return this.CONTENT.FORM_SELECTORS.map(selector => 
      selector.replace('{field}', fieldName)
    );
  }

  /**
   * Get highlight styles
   */
  static getHighlightStyles() {
    return {
      backgroundColor: this.UI.HIGHLIGHT_COLOR,
      color: this.UI.HIGHLIGHT_TEXT_COLOR,
      padding: this.UI.HIGHLIGHT_PADDING,
      borderRadius: this.UI.HIGHLIGHT_BORDER_RADIUS,
      fontWeight: this.UI.HIGHLIGHT_FONT_WEIGHT
    };
  }

  /**
   * Log message if debugging is enabled
   */
  static log(level, message, ...args) {
    if (this.DEBUG.ENABLE_LOGGING) {
      const logLevels = ['debug', 'info', 'warn', 'error'];
      const currentLevel = logLevels.indexOf(this.DEBUG.LOG_LEVEL);
      const messageLevel = logLevels.indexOf(level);
      
      if (messageLevel >= currentLevel) {
        console[level](`[WebAI] ${message}`, ...args);
      }
    }
  }
}

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendConfig;
} 