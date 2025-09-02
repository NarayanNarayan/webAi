/**
 * Main Popup Script for WebAI Extension
 * Uses MVC architecture for better organization
 */

// Import MVC components
// Note: In a real extension, you would need to bundle these or load them separately
// For now, we'll assume the classes are available globally

// Initialize MVC components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the popup controller
  const popupController = new PopupController();
  
  // The controller will handle all the setup and event binding
  console.log('WebAI Popup initialized with MVC architecture');
});

// Fallback for when MVC components are not available
if (typeof PopupController === 'undefined') {
  console.warn('MVC components not loaded, using fallback popup');
  
  // Fallback to original popup functionality
  class WebAIPopup {
    constructor() {
      this.currentSummary = null;
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.loadCurrentPageInfo();
    }

    setupEventListeners() {
      // Summarize button
      document.getElementById('summarizeBtn')?.addEventListener('click', () => {
        this.handleSummarize('langgraph');
      });

      // Simple summarize button
      document.getElementById('simpleSummarizeBtn')?.addEventListener('click', () => {
        this.handleSummarize('simple');
      });

      // Highlight button
      document.getElementById('highlightBtn')?.addEventListener('click', () => {
        this.handleHighlight();
      });

      // Autofill button
      document.getElementById('autofillBtn')?.addEventListener('click', () => {
        this.handleAutofill();
      });

      // Apply highlight button
      document.getElementById('applyHighlightBtn')?.addEventListener('click', () => {
        this.applyHighlights();
      });

      // Apply autofill button
      document.getElementById('applyAutofillBtn')?.addEventListener('click', () => {
        this.applyAutofill();
      });

      // Copy button
      document.getElementById('copyBtn')?.addEventListener('click', () => {
        this.copySummary();
      });

      // Save button
      document.getElementById('saveBtn')?.addEventListener('click', () => {
        this.saveSummary();
      });
    }

    async loadCurrentPageInfo() {
      try {
        // Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
          const titleElement = document.getElementById('pageTitle');
          const urlElement = document.getElementById('pageUrl');
          
          if (titleElement) titleElement.textContent = tab.title || 'Unknown Title';
          if (urlElement) urlElement.textContent = tab.url || 'Unknown URL';
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

    async handleSummarize(method) {
      const summarizeBtn = document.getElementById('summarizeBtn');
      const simpleBtn = document.getElementById('simpleSummarizeBtn');
      const btnText = summarizeBtn?.querySelector('.btn-text');
      const btnLoading = summarizeBtn?.querySelector('.btn-loading');

      try {
        // Show loading state
        if (summarizeBtn) summarizeBtn.disabled = true;
        if (simpleBtn) simpleBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-block';
        this.updateStatus('Summarizing...');
        this.hideError();

        // Send message to background script
        chrome.runtime.sendMessage({ 
          action: 'summarize',
          method: method 
        }, (response) => {
          if (response.success) {
            this.displaySummary(response.summary);
            this.updateStatus('Summary generated successfully');
          } else {
            this.showError(`Summarization failed: ${response.error}`);
            this.updateStatus('Summarization failed');
          }
        });
      } catch (error) {
        console.error('Summarization error:', error);
        this.showError(`Summarization failed: ${error.message}`);
        this.updateStatus('Summarization failed');
      } finally {
        // Reset button state
        if (summarizeBtn) summarizeBtn.disabled = false;
        if (simpleBtn) simpleBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline-block';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    }

    displaySummary(summary) {
      this.currentSummary = summary;
      
      const summaryText = document.getElementById('summaryText');
      if (summaryText) {
        summaryText.textContent = summary.summary || summary;
      }
      
      const summarySection = document.getElementById('summarySection');
      const actionButtons = document.getElementById('actionButtons');
      
      if (summarySection) summarySection.style.display = 'block';
      if (actionButtons) actionButtons.style.display = 'flex';
    }

    copySummary() {
      if (this.currentSummary) {
        const text = this.currentSummary.summary || this.currentSummary;
        navigator.clipboard.writeText(text).then(() => {
          this.updateStatus('Summary copied to clipboard');
        }).catch(() => {
          this.updateStatus('Failed to copy summary');
        });
      }
    }

    saveSummary() {
      if (this.currentSummary) {
        const text = this.currentSummary.summary || this.currentSummary;
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

    async handleHighlight() {
      const query = prompt('Enter search term to highlight:');
      if (!query) return;

      try {
        this.updateStatus('Highlighting...');
        this.hideError();

        chrome.runtime.sendMessage({ 
          action: 'highlight',
          query: query 
        }, (response) => {
          if (response.success) {
            this.displayHighlights(response.result);
            this.updateStatus('Highlights generated');
          } else {
            this.showError(`Highlighting failed: ${response.error}`);
            this.updateStatus('Highlighting failed');
          }
        });
      } catch (error) {
        console.error('Highlighting error:', error);
        this.showError(`Highlighting failed: ${error.message}`);
        this.updateStatus('Highlighting failed');
      }
    }

    displayHighlights(result) {
      const highlightsSection = document.getElementById('highlightsSection');
      const highlightsList = document.getElementById('highlightsList');
      const highlightsReasoning = document.getElementById('highlightsReasoning');
      const applyHighlightBtn = document.getElementById('applyHighlightBtn');

      if (highlightsList && result.highlights) {
        highlightsList.innerHTML = result.highlights.map(highlight => 
          `<li>${highlight.text} <small>(Confidence: ${highlight.confidence})</small></li>`
        ).join('');
      }

      if (highlightsReasoning && result.reasoning) {
        highlightsReasoning.textContent = result.reasoning;
      }

      if (highlightsSection) highlightsSection.style.display = 'block';
      if (applyHighlightBtn) applyHighlightBtn.style.display = 'inline-block';
    }

    applyHighlights() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'highlightOnPage',
          highlights: this.currentHighlights
        }, (response) => {
          if (response && response.success) {
            this.updateStatus(`Applied ${response.result.highlightedCount} highlights`);
          } else {
            this.updateStatus('Failed to apply highlights');
          }
        });
      });
    }

    async handleAutofill() {
      try {
        this.updateStatus('Analyzing forms...');
        this.hideError();

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'extractFormFields'
          }, (response) => {
            if (response && response.success) {
              this.processAutofill(response.formData);
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

    async processAutofill(formData) {
      try {
        chrome.runtime.sendMessage({ 
          action: 'autofill',
          formData: formData 
        }, (response) => {
          if (response.success) {
            this.displayAutofillSuggestions(response.result);
            this.updateStatus('Autofill suggestions generated');
          } else {
            this.showError(`Autofill failed: ${response.error}`);
            this.updateStatus('Autofill failed');
          }
        });
      } catch (error) {
        console.error('Autofill processing error:', error);
        this.showError(`Autofill failed: ${error.message}`);
        this.updateStatus('Autofill failed');
      }
    }

    displayAutofillSuggestions(result) {
      const autofillSection = document.getElementById('autofillSection');
      const autofillSuggestions = document.getElementById('autofillSuggestions');
      const autofillConfidence = document.getElementById('autofillConfidence');
      const autofillReasoning = document.getElementById('autofillReasoning');
      const applyAutofillBtn = document.getElementById('applyAutofillBtn');

      if (autofillSuggestions && result.form_data) {
        autofillSuggestions.innerHTML = Object.entries(result.form_data).map(([field, value]) => 
          `<li><strong>${field}:</strong> ${value}</li>`
        ).join('');
      }

      if (autofillConfidence && result.confidence) {
        autofillConfidence.textContent = `Confidence: ${result.confidence}`;
      }

      if (autofillReasoning && result.reasoning) {
        autofillReasoning.textContent = result.reasoning;
      }

      if (autofillSection) autofillSection.style.display = 'block';
      if (applyAutofillBtn) applyAutofillBtn.style.display = 'inline-block';
    }

    applyAutofill() {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'autofillForm',
          formData: this.currentAutofill
        }, (response) => {
          if (response && response.success) {
            this.updateStatus(`Filled ${response.result.filledCount} fields`);
          } else {
            this.updateStatus('Failed to apply autofill');
          }
        });
      });
    }

    showError(message) {
      const errorElement = document.getElementById('errorMessage');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    }

    hideError() {
      const errorElement = document.getElementById('errorMessage');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }

    updateStatus(message) {
      const statusElement = document.getElementById('statusMessage');
      if (statusElement) {
        statusElement.textContent = message;
      }
    }
  }

  // Initialize fallback popup
  new WebAIPopup();
} 