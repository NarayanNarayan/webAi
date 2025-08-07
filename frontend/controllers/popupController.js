/**
 * Popup Controller for WebAI Frontend
 * Handles popup UI interactions and business logic
 */

class PopupController {
  /**
   * Initialize popup controller
   */
  constructor() {
    this.currentSummary = null;
    this.currentHighlights = null;
    this.currentAutofill = null;
    this.apiService = new APIService();
    this.init();
  }

  /**
   * Initialize the controller
   */
  init() {
    this.setupEventListeners();
    this.loadCurrentPageInfo();
  }

  /**
   * Setup event listeners for popup UI
   */
  setupEventListeners() {
    // Summarize button
    document.getElementById('summarizeBtn').addEventListener('click', () => {
      this.handleSummarize('langgraph');
    });

    // Simple summarize button
    document.getElementById('simpleSummarizeBtn').addEventListener('click', () => {
      this.handleSummarize('simple');
    });

    // Highlight button
    document.getElementById('highlightBtn').addEventListener('click', () => {
      this.handleHighlight();
    });

    // Autofill button
    document.getElementById('autofillBtn').addEventListener('click', () => {
      this.handleAutofill();
    });

    // Apply highlight button
    document.getElementById('applyHighlightBtn').addEventListener('click', () => {
      this.applyHighlights();
    });

    // Apply autofill button
    document.getElementById('applyAutofillBtn').addEventListener('click', () => {
      this.applyAutofill();
    });

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', () => {
      this.copySummary();
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSummary();
    });
  }

  /**
   * Load current page information
   */
  async loadCurrentPageInfo() {
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        document.getElementById('pageTitle').textContent = tab.title || 'Unknown Title';
        document.getElementById('pageUrl').textContent = tab.url || 'Unknown URL';
      }

      // Get page data from background
      chrome.runtime.sendMessage({ action: 'getCurrentPageData' }, (response) => {
        if (response.success && response.data) {
          this.updateStatus('Page data loaded');
        } else {
          this.updateStatus('No page data available');
        }
      });
    } catch (error) {
      console.error('Error loading page info:', error);
      this.updateStatus('Error loading page info');
    }
  }

  /**
   * Handle summarization request
   */
  async handleSummarize(method) {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const simpleBtn = document.getElementById('simpleSummarizeBtn');
    const btnText = summarizeBtn.querySelector('.btn-text');
    const btnLoading = summarizeBtn.querySelector('.btn-loading');

    try {
      // Show loading state
      summarizeBtn.disabled = true;
      simpleBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
      this.updateStatus('Summarizing...');
      this.hideError();

      // Get page data from background
      const pageData = await this.getPageData();
      
      let result;
      if (method === 'simple') {
        result = this.apiService.simpleSummarize(pageData);
      } else {
        result = await this.apiService.summarizeContent(pageData);
      }

      if (result.success) {
        const summaryResponse = new SummaryResponse(result.data);
        this.displaySummary(summaryResponse);
        this.updateStatus('Summary generated successfully');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Summarization error:', error);
      this.showError(`Summarization failed: ${error.message}`);
      this.updateStatus('Summarization failed');
    } finally {
      // Reset button state
      summarizeBtn.disabled = false;
      simpleBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoading.style.display = 'none';
    }
  }

  /**
   * Display summary in popup
   */
  displaySummary(summaryResponse) {
    this.currentSummary = summaryResponse;
    
    const summaryText = summaryResponse.getSummaryText();
    const keyPoints = summaryResponse.getKeyPoints();
    
    document.getElementById('summaryText').textContent = summaryText;
    
    // Display key points if available
    const keyPointsContainer = document.getElementById('keyPoints');
    if (keyPointsContainer && keyPoints.length > 0) {
      keyPointsContainer.innerHTML = keyPoints.map(point => 
        `<li>${point}</li>`
      ).join('');
      keyPointsContainer.style.display = 'block';
    }
    
    // Show summary section
    document.getElementById('summarySection').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'flex';
  }

  /**
   * Copy summary to clipboard
   */
  copySummary() {
    if (this.currentSummary) {
      const text = this.currentSummary.getSummaryText();
      navigator.clipboard.writeText(text).then(() => {
        this.updateStatus('Summary copied to clipboard');
      }).catch(() => {
        this.updateStatus('Failed to copy summary');
      });
    }
  }

  /**
   * Save summary
   */
  saveSummary() {
    if (this.currentSummary) {
      const text = this.currentSummary.getSummaryText();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webai-summary.txt';
      a.click();
      
      URL.revokeObjectURL(url);
      this.updateStatus('Summary saved');
    }
  }

  /**
   * Handle highlighting request
   */
  async handleHighlight() {
    const query = prompt('Enter search term to highlight:');
    if (!query) return;

    try {
      this.updateStatus('Highlighting...');
      this.hideError();

      const pageData = await this.getPageData();
      const result = await this.apiService.highlightContent(pageData, query);

      if (result.success) {
        const highlightResponse = new HighlightResponse(result.data);
        this.displayHighlights(highlightResponse);
        this.updateStatus('Highlights generated');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Highlighting error:', error);
      this.showError(`Highlighting failed: ${error.message}`);
      this.updateStatus('Highlighting failed');
    }
  }

  /**
   * Display highlights in popup
   */
  displayHighlights(highlightResponse) {
    this.currentHighlights = highlightResponse;
    
    const highlights = highlightResponse.getHighlights();
    const reasoning = highlightResponse.getReasoning();
    
    const highlightsContainer = document.getElementById('highlightsList');
    highlightsContainer.innerHTML = highlights.map(highlight => 
      `<li>${highlight.text} <small>(Confidence: ${highlight.confidence})</small></li>`
    ).join('');
    
    document.getElementById('highlightsReasoning').textContent = reasoning;
    document.getElementById('highlightsSection').style.display = 'block';
    document.getElementById('applyHighlightBtn').style.display = 'inline-block';
  }

  /**
   * Apply highlights to page
   */
  applyHighlights() {
    if (this.currentHighlights) {
      const highlights = this.currentHighlights.getHighlights();
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'highlightOnPage',
          highlights: highlights
        }, (response) => {
          if (response && response.success) {
            this.updateStatus(`Applied ${response.result.highlightedCount} highlights`);
          } else {
            this.updateStatus('Failed to apply highlights');
          }
        });
      });
    }
  }

  /**
   * Handle autofill request
   */
  async handleAutofill() {
    try {
      this.updateStatus('Analyzing forms...');
      this.hideError();

      const pageData = await this.getPageData();
      
      // Extract form fields from page
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'extractFormFields'
        }, (response) => {
          if (response && response.success) {
            this.processAutofill(pageData, response.formData);
          } else {
            this.updateStatus('No forms found on page');
          }
        });
      });
    } catch (error) {
      console.error('Autofill error:', error);
      this.showError(`Autofill failed: ${error.message}`);
      this.updateStatus('Autofill failed');
    }
  }

  /**
   * Process autofill with form data
   */
  async processAutofill(pageData, formData) {
    try {
      const result = await this.apiService.autofillForm(pageData, formData);

      if (result.success) {
        const autofillResponse = new AutofillResponse(result.data);
        this.displayAutofillSuggestions(autofillResponse);
        this.updateStatus('Autofill suggestions generated');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Autofill processing error:', error);
      this.showError(`Autofill failed: ${error.message}`);
      this.updateStatus('Autofill failed');
    }
  }

  /**
   * Display autofill suggestions
   */
  displayAutofillSuggestions(autofillResponse) {
    this.currentAutofill = autofillResponse;
    
    const formData = autofillResponse.getFormData();
    const confidence = autofillResponse.getConfidence();
    const reasoning = autofillResponse.getReasoning();
    
    const suggestionsContainer = document.getElementById('autofillSuggestions');
    suggestionsContainer.innerHTML = Object.entries(formData).map(([field, value]) => 
      `<li><strong>${field}:</strong> ${value}</li>`
    ).join('');
    
    document.getElementById('autofillConfidence').textContent = `Confidence: ${confidence}`;
    document.getElementById('autofillReasoning').textContent = reasoning;
    document.getElementById('autofillSection').style.display = 'block';
    document.getElementById('applyAutofillBtn').style.display = 'inline-block';
  }

  /**
   * Apply autofill to page
   */
  applyAutofill() {
    if (this.currentAutofill) {
      const formData = this.currentAutofill.getFormData();
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'autofillForm',
          formData: formData
        }, (response) => {
          if (response && response.success) {
            this.updateStatus(`Filled ${response.result.filledCount} fields`);
          } else {
            this.updateStatus('Failed to apply autofill');
          }
        });
      });
    }
  }

  /**
   * Get page data from background
   */
  async getPageData() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getCurrentPageData' }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error('Failed to get page data'));
        }
      });
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
}

// Export controller for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupController;
} 