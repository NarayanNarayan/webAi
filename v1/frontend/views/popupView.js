/**
 * Popup View for WebAI Frontend
 * Handles UI rendering and user interactions
 */

class PopupView {
  /**
   * Initialize popup view
   */
  constructor() {
    this.elements = this.initializeElements();
    this.init();
  }

  /**
   * Initialize the view
   */
  init() {
    this.setupUI();
    this.bindEvents();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    return {
      // Page info
      pageTitle: document.getElementById('pageTitle'),
      pageUrl: document.getElementById('pageUrl'),
      
      // Buttons
      summarizeBtn: document.getElementById('summarizeBtn'),
      simpleSummarizeBtn: document.getElementById('simpleSummarizeBtn'),
      highlightBtn: document.getElementById('highlightBtn'),
      autofillBtn: document.getElementById('autofillBtn'),
      applyHighlightBtn: document.getElementById('applyHighlightBtn'),
      applyAutofillBtn: document.getElementById('applyAutofillBtn'),
      copyBtn: document.getElementById('copyBtn'),
      saveBtn: document.getElementById('saveBtn'),
      
      // Loading states
      btnText: document.querySelector('.btn-text'),
      btnLoading: document.querySelector('.btn-loading'),
      
      // Sections
      summarySection: document.getElementById('summarySection'),
      highlightsSection: document.getElementById('highlightsSection'),
      autofillSection: document.getElementById('autofillSection'),
      actionButtons: document.getElementById('actionButtons'),
      
      // Content areas
      summaryText: document.getElementById('summaryText'),
      keyPoints: document.getElementById('keyPoints'),
      highlightsList: document.getElementById('highlightsList'),
      highlightsReasoning: document.getElementById('highlightsReasoning'),
      autofillSuggestions: document.getElementById('autofillSuggestions'),
      autofillConfidence: document.getElementById('autofillConfidence'),
      autofillReasoning: document.getElementById('autofillReasoning'),
      
      // Messages
      statusMessage: document.getElementById('statusMessage'),
      errorMessage: document.getElementById('errorMessage')
    };
  }

  /**
   * Setup initial UI state
   */
  setupUI() {
    // Hide sections initially
    this.hideSection(this.elements.summarySection);
    this.hideSection(this.elements.highlightsSection);
    this.hideSection(this.elements.autofillSection);
    this.hideSection(this.elements.actionButtons);
    this.hideSection(this.elements.applyHighlightBtn);
    this.hideSection(this.elements.applyAutofillBtn);
    
    // Hide error message
    this.hideError();
    
    // Set initial status
    this.updateStatus('Ready');
  }

  /**
   * Bind UI events
   */
  bindEvents() {
    // This will be handled by the controller
    // Events are bound in the controller for better separation of concerns
  }

  /**
   * Update page information
   */
  updatePageInfo(title, url) {
    if (this.elements.pageTitle) {
      this.elements.pageTitle.textContent = title || 'Unknown Title';
    }
    if (this.elements.pageUrl) {
      this.elements.pageUrl.textContent = url || 'Unknown URL';
    }
  }

  /**
   * Show loading state for buttons
   */
  showLoading(buttonIds = []) {
    buttonIds.forEach(id => {
      const button = document.getElementById(id);
      if (button) {
        button.disabled = true;
        const text = button.querySelector('.btn-text');
        const loading = button.querySelector('.btn-loading');
        if (text) text.style.display = 'none';
        if (loading) loading.style.display = 'inline-block';
      }
    });
  }

  /**
   * Hide loading state for buttons
   */
  hideLoading(buttonIds = []) {
    buttonIds.forEach(id => {
      const button = document.getElementById(id);
      if (button) {
        button.disabled = false;
        const text = button.querySelector('.btn-text');
        const loading = button.querySelector('.btn-loading');
        if (text) text.style.display = 'inline-block';
        if (loading) loading.style.display = 'none';
      }
    });
  }

  /**
   * Display summary content
   */
  displaySummary(summaryText, keyPoints = []) {
    if (this.elements.summaryText) {
      this.elements.summaryText.textContent = summaryText;
    }
    
    if (this.elements.keyPoints && keyPoints.length > 0) {
      this.elements.keyPoints.innerHTML = keyPoints.map(point => 
        `<li>${point}</li>`
      ).join('');
      this.showSection(this.elements.keyPoints);
    }
    
    this.showSection(this.elements.summarySection);
    this.showSection(this.elements.actionButtons);
  }

  /**
   * Display highlights content
   */
  displayHighlights(highlights, reasoning) {
    if (this.elements.highlightsList) {
      this.elements.highlightsList.innerHTML = highlights.map(highlight => 
        `<li>${highlight.text} <small>(Confidence: ${highlight.confidence})</small></li>`
      ).join('');
    }
    
    if (this.elements.highlightsReasoning) {
      this.elements.highlightsReasoning.textContent = reasoning;
    }
    
    this.showSection(this.elements.highlightsSection);
    this.showSection(this.elements.applyHighlightBtn);
  }

  /**
   * Display autofill suggestions
   */
  displayAutofillSuggestions(formData, confidence, reasoning) {
    if (this.elements.autofillSuggestions) {
      this.elements.autofillSuggestions.innerHTML = Object.entries(formData).map(([field, value]) => 
        `<li><strong>${field}:</strong> ${value}</li>`
      ).join('');
    }
    
    if (this.elements.autofillConfidence) {
      this.elements.autofillConfidence.textContent = `Confidence: ${confidence}`;
    }
    
    if (this.elements.autofillReasoning) {
      this.elements.autofillReasoning.textContent = reasoning;
    }
    
    this.showSection(this.elements.autofillSection);
    this.showSection(this.elements.applyAutofillBtn);
  }

  /**
   * Clear all sections
   */
  clearSections() {
    this.hideSection(this.elements.summarySection);
    this.hideSection(this.elements.highlightsSection);
    this.hideSection(this.elements.autofillSection);
    this.hideSection(this.elements.actionButtons);
    this.hideSection(this.elements.applyHighlightBtn);
    this.hideSection(this.elements.applyAutofillBtn);
  }

  /**
   * Show a section
   */
  showSection(element) {
    if (element) {
      element.style.display = 'block';
    }
  }

  /**
   * Hide a section
   */
  hideSection(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
      this.elements.errorMessage.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.style.display = 'none';
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.textContent = message;
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.updateStatus(message);
    // Could add a success toast or notification here
  }

  /**
   * Create loading spinner
   */
  createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = '<div class="spinner-inner"></div>';
    return spinner;
  }

  /**
   * Show loading overlay
   */
  showLoadingOverlay(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Show confirmation dialog
   */
  showConfirmation(message, onConfirm, onCancel) {
    const confirmed = confirm(message);
    if (confirmed && onConfirm) {
      onConfirm();
    } else if (!confirmed && onCancel) {
      onCancel();
    }
  }

  /**
   * Show prompt dialog
   */
  showPrompt(message, defaultValue = '') {
    return prompt(message, defaultValue);
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Download file
   */
  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

// Export view for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopupView;
} 