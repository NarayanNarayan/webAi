export class OptionsView {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.cacheElements();
    this.setupInitialState();
    this.isInitialized = true;
  }

  cacheElements() {
    this.elements = {
      form: document.getElementById('options-form'),
      geminiApiKeyInput: document.getElementById('gemini-api-key'),
      autoSummarizeCheckbox: document.getElementById('auto-summarize'),
      summaryLengthSelect: document.getElementById('summary-length'),
      similarityThresholdInput: document.getElementById('similarity-threshold'),
      ragServerUrlInput: document.getElementById('rag-server-url'),
      saveButton: document.getElementById('save-btn'),
      testConnectionButton: document.getElementById('test-connection-btn'),
      resetButton: document.getElementById('reset-btn'),
      clearDataButton: document.getElementById('clear-data-btn'),
      statusMessage: document.getElementById('status-message'),
      loadingIndicator: document.getElementById('loading-indicator'),
      serverStatsContainer: document.getElementById('server-stats-container')
    };
  }

  setupInitialState() {
    this.hideElement(this.elements.loadingIndicator);
    this.hideElement(this.elements.serverStatsContainer);
    this.clearStatusMessage();
  }

  bindSaveButton(callback) {
    if (this.elements.saveButton) {
      this.elements.saveButton.addEventListener('click', callback);
    }
  }

  bindTestConnectionButton(callback) {
    if (this.elements.testConnectionButton) {
      this.elements.testConnectionButton.addEventListener('click', callback);
    }
  }

  bindResetButton(callback) {
    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener('click', callback);
    }
  }

  bindClearDataButton(callback) {
    if (this.elements.clearDataButton) {
      this.elements.clearDataButton.addEventListener('click', callback);
    }
  }

  populateForm(settings, apiKeys) {
    if (this.elements.geminiApiKeyInput) {
      this.elements.geminiApiKeyInput.value = apiKeys.geminiApiKey || '';
    }

    if (this.elements.autoSummarizeCheckbox) {
      this.elements.autoSummarizeCheckbox.checked = settings.autoSummarize || false;
    }

    if (this.elements.summaryLengthSelect) {
      this.elements.summaryLengthSelect.value = settings.summaryLength || 'medium';
    }

    if (this.elements.similarityThresholdInput) {
      this.elements.similarityThresholdInput.value = settings.similarityThreshold || 0.7;
    }

    if (this.elements.ragServerUrlInput) {
      this.elements.ragServerUrlInput.value = 'http://localhost:8000'; // Default value
    }
  }

  getFormData() {
    return {
      apiKeys: {
        geminiApiKey: this.elements.geminiApiKeyInput?.value || ''
      },
      settings: {
        autoSummarize: this.elements.autoSummarizeCheckbox?.checked || false,
        summaryLength: this.elements.summaryLengthSelect?.value || 'medium',
        similarityThreshold: parseFloat(this.elements.similarityThresholdInput?.value || 0.7)
      }
    };
  }

  showLoading(message) {
    if (!this.elements.loadingIndicator) return;

    this.elements.loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${this.escapeHtml(message)}</div>
    `;

    this.showElement(this.elements.loadingIndicator);
  }

  hideLoading() {
    this.hideElement(this.elements.loadingIndicator);
  }

  showSuccess(message) {
    this.showStatusMessage(message, 'success');
  }

  showError(message) {
    this.showStatusMessage(message, 'error');
  }

  showWarning(message) {
    this.showStatusMessage(message, 'warning');
  }

  showInfo(message) {
    this.showStatusMessage(message, 'info');
  }

  showStatusMessage(message, type = 'info') {
    if (!this.elements.statusMessage) return;

    this.elements.statusMessage.innerHTML = `
      <div class="status-message status-${type}">
        ${this.escapeHtml(message)}
      </div>
    `;

    this.showElement(this.elements.statusMessage);
    
    // Auto-hide after 8 seconds for options page
    setTimeout(() => {
      this.clearStatusMessage();
    }, 8000);
  }

  clearStatusMessage() {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.innerHTML = '';
      this.hideElement(this.elements.statusMessage);
    }
  }

  showServerStats(stats) {
    if (!this.elements.serverStatsContainer) return;

    const statsHtml = `
      <h3>RAG Server Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Pages:</span>
          <span class="stat-value">${stats.totalPages || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Summaries:</span>
          <span class="stat-value">${stats.totalSummaries || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Server Status:</span>
          <span class="stat-value status-${stats.status || 'unknown'}">${stats.status || 'Unknown'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Last Updated:</span>
          <span class="stat-value">${stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}</span>
        </div>
      </div>
    `;

    this.elements.serverStatsContainer.innerHTML = statsHtml;
    this.showElement(this.elements.serverStatsContainer);
  }

  showElement(element) {
    if (element) {
      element.style.display = 'block';
    }
  }

  hideElement(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Form validation
  validateForm() {
    const errors = [];
    
    if (!this.elements.geminiApiKeyInput?.value.trim()) {
      errors.push('Gemini API key is required');
    }

    const threshold = parseFloat(this.elements.similarityThresholdInput?.value || 0);
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      errors.push('Similarity threshold must be between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  showValidationErrors(errors) {
    if (errors.length === 0) return;

    const errorHtml = errors.map(error => `<div class="error-item">• ${this.escapeHtml(error)}</div>`).join('');
    
    this.elements.statusMessage.innerHTML = `
      <div class="status-message status-error">
        <h4>Please fix the following errors:</h4>
        ${errorHtml}
      </div>
    `;

    this.showElement(this.elements.statusMessage);
  }

  // Utility methods
  enableForm() {
    const inputs = this.elements.form?.querySelectorAll('input, select, textarea');
    inputs?.forEach(input => {
      input.disabled = false;
    });
    
    if (this.elements.saveButton) {
      this.elements.saveButton.disabled = false;
    }
  }

  disableForm() {
    const inputs = this.elements.form?.querySelectorAll('input, select, textarea');
    inputs?.forEach(input => {
      input.disabled = true;
    });
    
    if (this.elements.saveButton) {
      this.elements.saveButton.disabled = true;
    }
  }

  resetForm() {
    if (this.elements.form) {
      this.elements.form.reset();
    }
  }
}
