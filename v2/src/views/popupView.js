export class PopupView {
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
      pageInfo: document.getElementById('page-info'),
      summaryContainer: document.getElementById('summary-container'),
      similarPagesContainer: document.getElementById('similar-pages-container'),
      formAnalysisContainer: document.getElementById('form-analysis-container'),
      loadingIndicator: document.getElementById('loading-indicator'),
      statusMessage: document.getElementById('status-message'),
      summarizeBtn: document.getElementById('summarize-btn'),
      similarPagesBtn: document.getElementById('similar-pages-btn'),
      autofillBtn: document.getElementById('autofill-btn'),
      settingsBtn: document.getElementById('settings-btn')
    };
  }

  setupInitialState() {
    // Hide containers initially
    this.hideElement(this.elements.summaryContainer);
    this.hideElement(this.elements.similarPagesContainer);
    this.hideElement(this.elements.formAnalysisContainer);
    this.hideElement(this.elements.loadingIndicator);
    
    // Clear status message
    this.clearStatusMessage();
  }

  bindSummarizeButton(callback) {
    if (this.elements.summarizeBtn) {
      this.elements.summarizeBtn.addEventListener('click', callback);
    }
  }

  bindSimilarPagesButton(callback) {
    if (this.elements.similarPagesBtn) {
      this.elements.similarPagesBtn.addEventListener('click', callback);
    }
  }

  bindAutofillButton(callback) {
    if (this.elements.autofillBtn) {
      this.elements.autofillBtn.addEventListener('click', callback);
    }
  }

  bindSettingsButton(callback) {
    if (this.elements.settingsBtn) {
      this.elements.settingsBtn.addEventListener('click', callback);
    }
  }

  updatePageInfo(pageInfo) {
    if (!this.elements.pageInfo) return;

    this.elements.pageInfo.innerHTML = `
      <div class="page-title">${this.escapeHtml(pageInfo.title)}</div>
      <div class="page-domain">${this.escapeHtml(pageInfo.domain)}</div>
      <div class="page-url">${this.escapeHtml(pageInfo.url)}</div>
    `;
  }

  showSummary(summary) {
    if (!this.elements.summaryContainer) return;

    this.elements.summaryContainer.innerHTML = `
      <h3>Page Summary</h3>
      <div class="summary-content">
        ${this.escapeHtml(summary)}
      </div>
    `;

    this.showElement(this.elements.summaryContainer);
  }

  showExistingSummary(summaryData) {
    if (!this.elements.summaryContainer) return;

    this.elements.summaryContainer.innerHTML = `
      <h3>Existing Summary</h3>
      <div class="summary-content">
        ${this.escapeHtml(summaryData.summary)}
      </div>
      <div class="summary-meta">
        <small>Generated: ${new Date(summaryData.timestamp).toLocaleString()}</small>
      </div>
    `;

    this.showElement(this.elements.summaryContainer);
  }

  showSimilarPages(similarPages) {
    if (!this.elements.similarPagesContainer) return;

    const pagesHtml = similarPages.map(page => `
      <div class="similar-page">
        <div class="page-title">
          <a href="${this.escapeHtml(page.url)}" target="_blank">
            ${this.escapeHtml(page.title)}
          </a>
        </div>
        <div class="page-url">${this.escapeHtml(page.url)}</div>
        <div class="similarity-score">
          Similarity: ${(page.similarity * 100).toFixed(1)}%
        </div>
        <div class="page-summary">
          ${this.escapeHtml(page.summary.substring(0, 150))}...
        </div>
      </div>
    `).join('');

    this.elements.similarPagesContainer.innerHTML = `
      <h3>Similar Pages (${similarPages.length})</h3>
      <div class="similar-pages-list">
        ${pagesHtml}
      </div>
    `;

    this.showElement(this.elements.similarPagesContainer);
  }

  showFormAnalysis(formFields) {
    if (!this.elements.formAnalysisContainer) return;

    const formsHtml = formFields.map((form, formIndex) => `
      <div class="form-analysis">
        <h4>Form ${formIndex + 1}</h4>
        <div class="form-meta">
          <span>Action: ${this.escapeHtml(form.action || 'N/A')}</span>
          <span>Method: ${this.escapeHtml(form.method)}</span>
        </div>
        <div class="form-fields">
          ${form.fields.map(field => `
            <div class="field-info">
              <span class="field-name">${this.escapeHtml(field.name)}</span>
              <span class="field-type">${this.escapeHtml(field.type)}</span>
              ${field.required ? '<span class="required">Required</span>' : ''}
              ${field.label ? `<span class="field-label">${this.escapeHtml(field.label)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    this.elements.formAnalysisContainer.innerHTML = `
      <h3>Form Analysis</h3>
      <div class="forms-list">
        ${formsHtml}
      </div>
    `;

    this.showElement(this.elements.formAnalysisContainer);
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
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.clearStatusMessage();
    }, 5000);
  }

  clearStatusMessage() {
    if (this.elements.statusMessage) {
      this.elements.statusMessage.innerHTML = '';
      this.hideElement(this.elements.statusMessage);
    }
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

  // Utility methods
  scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }

  enableButton(button) {
    if (button) {
      button.disabled = false;
      button.classList.remove('disabled');
    }
  }

  disableButton(button) {
    if (button) {
      button.disabled = true;
      button.classList.add('disabled');
    }
  }
}
