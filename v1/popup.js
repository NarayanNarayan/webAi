// Popup script for the WebAI extension
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

      // Send message to background script
      chrome.runtime.sendMessage({ 
        action: 'summarize',
        method: method 
      }, (response) => {
        if (response.success) {
          this.displaySummary(response.summary);
          this.updateStatus('Summary generated successfully');
        } else {
          this.showError(response.error || 'Failed to generate summary');
          this.updateStatus('Error generating summary');
        }
      });

    } catch (error) {
      console.error('Summarization error:', error);
      this.showError('Failed to generate summary');
      this.updateStatus('Error generating summary');
    } finally {
      // Reset button state
      summarizeBtn.disabled = false;
      simpleBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  displaySummary(summary) {
    const summarySection = document.querySelector('.summary-section');
    const summaryContent = document.getElementById('summaryContent');
    
    // Store the summary for copy/save operations
    this.currentSummary = summary;

    // Display the summary
    if (typeof summary === 'object') {
      // Handle structured summary response
      let displayText = '';
      if (summary.summary) {
        displayText = summary.summary;
      } else if (summary.text) {
        displayText = summary.text;
      } else {
        displayText = JSON.stringify(summary, null, 2);
      }
      summaryContent.textContent = displayText;
    } else {
      // Handle simple string summary
      summaryContent.textContent = summary;
    }

    // Show the summary section
    summarySection.style.display = 'block';
  }

  copySummary() {
    if (!this.currentSummary) {
      this.showError('No summary to copy');
      return;
    }

    const textToCopy = typeof this.currentSummary === 'object' 
      ? (this.currentSummary.summary || this.currentSummary.text || JSON.stringify(this.currentSummary))
      : this.currentSummary;

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.updateStatus('Summary copied to clipboard');
    }).catch(() => {
      this.showError('Failed to copy summary');
    });
  }

  saveSummary() {
    if (!this.currentSummary) {
      this.showError('No summary to save');
      return;
    }

    const textToSave = typeof this.currentSummary === 'object' 
      ? (this.currentSummary.summary || this.currentSummary.text || JSON.stringify(this.currentSummary))
      : this.currentSummary;

    // Create a blob and download
    const blob = new Blob([textToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.updateStatus('Summary saved');
  }

  async handleHighlight() {
    const query = document.getElementById('highlightQuery').value.trim();
    if (!query) {
      this.showError('Please enter a query to highlight');
      return;
    }

    const highlightBtn = document.getElementById('highlightBtn');
    const originalText = highlightBtn.textContent;

    try {
      highlightBtn.disabled = true;
      highlightBtn.textContent = 'Highlighting...';
      this.updateStatus('Finding highlights...');
      this.hideError();

      chrome.runtime.sendMessage({ 
        action: 'highlight',
        query: query 
      }, (response) => {
        if (response.success) {
          this.displayHighlights(response.result);
          this.updateStatus('Highlights found successfully');
        } else {
          this.showError(response.error || 'Failed to find highlights');
          this.updateStatus('Error finding highlights');
        }
      });

    } catch (error) {
      console.error('Highlighting error:', error);
      this.showError('Failed to find highlights');
      this.updateStatus('Error finding highlights');
    } finally {
      highlightBtn.disabled = false;
      highlightBtn.textContent = originalText;
    }
  }

  async handleAutofill() {
    const formFields = document.getElementById('formFields').value.trim();
    if (!formFields) {
      this.showError('Please enter form fields to autofill');
      return;
    }

    // Parse form fields (comma-separated)
    const fields = formFields.split(',').map(field => field.trim());
    const formData = {};
    fields.forEach(field => {
      formData[field] = '';
    });

    const autofillBtn = document.getElementById('autofillBtn');
    const originalText = autofillBtn.textContent;

    try {
      autofillBtn.disabled = true;
      autofillBtn.textContent = 'Suggesting...';
      this.updateStatus('Generating form suggestions...');
      this.hideError();

      chrome.runtime.sendMessage({ 
        action: 'autofill',
        formData: formData 
      }, (response) => {
        if (response.success) {
          this.displayAutofillSuggestions(response.result);
          this.updateStatus('Form suggestions generated successfully');
        } else {
          this.showError(response.error || 'Failed to generate form suggestions');
          this.updateStatus('Error generating form suggestions');
        }
      });

    } catch (error) {
      console.error('Autofill error:', error);
      this.showError('Failed to generate form suggestions');
      this.updateStatus('Error generating form suggestions');
    } finally {
      autofillBtn.disabled = false;
      autofillBtn.textContent = originalText;
    }
  }

  displayHighlights(result) {
    const highlightSection = document.querySelector('.highlight-results');
    const highlightContent = document.getElementById('highlightContent');
    
    // Store highlights for later use
    this.currentHighlights = result.highlights || [];
    
    if (!result.highlights || result.highlights.length === 0) {
      highlightContent.innerHTML = '<p>No highlights found for the given query.</p>';
    } else {
      let html = '';
      result.highlights.forEach((highlight, index) => {
        html += `
          <div class="highlight-item">
            <div class="text">${highlight.text || 'No text'}</div>
            <div class="reasoning">${highlight.reasoning || 'No reasoning provided'}</div>
            <div class="confidence">Confidence: ${(highlight.confidence * 100).toFixed(1)}%</div>
          </div>
        `;
      });
      highlightContent.innerHTML = html;
    }

    highlightSection.style.display = 'block';
  }

  displayAutofillSuggestions(result) {
    const autofillSection = document.querySelector('.autofill-results');
    const autofillContent = document.getElementById('autofillContent');
    
    // Store autofill data for later use
    this.currentAutofillData = result.form_data || {};
    
    if (!result.form_data || Object.keys(result.form_data).length === 0) {
      autofillContent.innerHTML = '<p>No form suggestions generated.</p>';
    } else {
      let html = '';
      Object.entries(result.form_data).forEach(([field, suggestion]) => {
        html += `
          <div class="autofill-item">
            <div class="field">${field}</div>
            <div class="suggestion">${suggestion}</div>
          </div>
        `;
      });
      
      if (result.confidence) {
        html += `<p><strong>Overall Confidence:</strong> ${(result.confidence * 100).toFixed(1)}%</p>`;
      }
      
      autofillContent.innerHTML = html;
    }

    autofillSection.style.display = 'block';
  }

  applyHighlights() {
    if (!this.currentHighlights) {
      this.showError('No highlights to apply');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'highlightOnPage',
        highlights: this.currentHighlights
      }, (response) => {
        if (response && response.success) {
          this.updateStatus(`Applied ${response.result.highlightedCount} highlights to the page`);
        } else {
          this.showError('Failed to apply highlights to the page');
        }
      });
    });
  }

  applyAutofill() {
    if (!this.currentAutofillData) {
      this.showError('No form data to apply');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'autofillForm',
        formData: this.currentAutofillData
      }, (response) => {
        if (response && response.success) {
          this.updateStatus(`Applied autofill to ${response.result.filledCount} form fields`);
        } else {
          this.showError('Failed to apply autofill to forms');
        }
      });
    });
  }

  showError(message) {
    const errorSection = document.querySelector('.error-section');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
  }

  hideError() {
    const errorSection = document.querySelector('.error-section');
    errorSection.style.display = 'none';
  }

  updateStatus(message) {
    const statusText = document.getElementById('statusText');
    statusText.textContent = message;
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WebAIPopup();
}); 