/**
 * Content Service for WebAI Frontend
 * Handles page content extraction and manipulation
 */

class ContentService {
  /**
   * Initialize content service
   */
  constructor() {
    this.db = null;
    this.init();
  }

  /**
   * Initialize the service
   */
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Setup the content service
   */
  setup() {
    // Initialize the DomBridge from Parser.js
    this.db = new DomBridge();
    
    // Send initial page data
    this.sendPageData();
    
    // Listen for page navigation events
    window.addEventListener('beforeunload', () => {
      this.db = null;
    });
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(() => this.sendPageData(), 100);
    });
  }

  /**
   * Get current page content
   */
  async getPageContent() {
    // Update the DOM bridge to get current page content
    this.db.update();
    
    return {
      url: window.location.href,
      title: document.title,
      miniBodyJson: this.db.miniBodyJson,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send page data to background
   */
  sendPageData() {
    this.getPageContent().then(content => {
      chrome.runtime.sendMessage({
        action: 'pageData',
        data: content
      });
    });
  }
  
  /**
   * Force refresh page data
   */
  refreshPageData() {
    // Reinitialize the DOM bridge to get fresh content
    this.db = new DomBridge();
    this.db.update();
    return this.getPageContent();
  }

  /**
   * Highlight text on the page
   */
  async highlightOnPage(highlights) {
    // Remove existing highlights
    const existingHighlights = document.querySelectorAll('.webai-highlight');
    existingHighlights.forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });

    let highlightedCount = 0;
    
    highlights.forEach(highlight => {
      // Find text nodes containing the highlight text
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent;
        if (text.includes(highlight.text)) {
          // Create highlight element
          const highlightEl = document.createElement('span');
          highlightEl.className = 'webai-highlight';
          highlightEl.style.backgroundColor = '#ffeb3b';
          highlightEl.style.color = '#000';
          highlightEl.style.padding = '2px 4px';
          highlightEl.style.borderRadius = '3px';
          highlightEl.style.fontWeight = 'bold';
          highlightEl.textContent = highlight.text;
          
          // Replace text with highlight
          const regex = new RegExp(highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const newText = text.replace(regex, highlightEl.outerHTML);
          
          if (newText !== text) {
            node.parentNode.innerHTML = newText;
            highlightedCount++;
            break; // Only highlight first occurrence
          }
        }
      }
    });

    return { highlightedCount };
  }

  /**
   * Autofill form on the page
   */
  async autofillForm(formData) {
    const forms = document.querySelectorAll('form');
    let filledCount = 0;

    forms.forEach(form => {
      Object.entries(formData).forEach(([fieldName, value]) => {
        // Try different selectors for form fields
        const selectors = [
          `input[name*="${fieldName}" i]`,
          `input[placeholder*="${fieldName}" i]`,
          `input[id*="${fieldName}" i]`,
          `textarea[name*="${fieldName}" i]`,
          `textarea[placeholder*="${fieldName}" i]`,
          `textarea[id*="${fieldName}" i]`
        ];

        for (const selector of selectors) {
          const field = form.querySelector(selector);
          if (field && value) {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
            break;
          }
        }
      });
    });

    return { filledCount };
  }

  /**
   * Extract form fields from the page
   */
  extractFormFields() {
    const forms = document.querySelectorAll('form');
    const formData = {};

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const name = input.name || input.id || input.placeholder || '';
        if (name && !formData[name]) {
          formData[name] = '';
        }
      });
    });

    return formData;
  }

  /**
   * Get page metadata
   */
  getPageMetadata() {
    return {
      url: window.location.href,
      title: document.title,
      description: this.getMetaDescription(),
      keywords: this.getMetaKeywords(),
      author: this.getMetaAuthor()
    };
  }

  /**
   * Get meta description
   */
  getMetaDescription() {
    const meta = document.querySelector('meta[name="description"]');
    return meta ? meta.getAttribute('content') : '';
  }

  /**
   * Get meta keywords
   */
  getMetaKeywords() {
    const meta = document.querySelector('meta[name="keywords"]');
    return meta ? meta.getAttribute('content') : '';
  }

  /**
   * Get meta author
   */
  getMetaAuthor() {
    const meta = document.querySelector('meta[name="author"]');
    return meta ? meta.getAttribute('content') : '';
  }
}

// Export service for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentService;
} 