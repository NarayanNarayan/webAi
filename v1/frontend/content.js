/**
 * Main Content Script for WebAI Extension
 * Uses MVC architecture for better organization
 */

// Import MVC components
// Note: In a real extension, you would need to bundle these or load them separately
// For now, we'll assume the classes are available globally

// Initialize MVC components
if (typeof ContentService !== 'undefined') {
  // Initialize the content service
  const contentService = new ContentService();
  console.log('WebAI Content Script initialized with MVC architecture');
} else {
  console.warn('MVC components not loaded, using fallback content script');
  
  // Fallback to original content script functionality
  class WebAIContentScript {
    constructor() {
      this.db = null;
      this.init();
    }

    init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      // Initialize the DomBridge from Parser.js
      this.db = new DomBridge();
      
      // Listen for messages from popup or background
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getPageContent') {
          this.getPageContent().then(content => {
            sendResponse({ success: true, content });
          });
          return true; // Keep message channel open for async response
        } else if (request.action === 'refreshPageContent') {
          this.refreshPageData().then(content => {
            sendResponse({ success: true, content });
          });
          return true; // Keep message channel open for async response
        } else if (request.action === 'highlightOnPage') {
          this.highlightOnPage(request.highlights).then(result => {
            sendResponse({ success: true, result });
          });
          return true;
        } else if (request.action === 'autofillForm') {
          this.autofillForm(request.formData).then(result => {
            sendResponse({ success: true, result });
          });
          return true;
        } else if (request.action === 'extractFormFields') {
          const formData = this.extractFormFields();
          sendResponse({ success: true, formData });
          return true;
        }
      });

      // Send initial page data to background
      this.sendPageData();
      
      // Listen for page navigation events
      window.addEventListener('beforeunload', () => {
        // Clear any cached data when navigating away
        this.db = null;
      });
      
      // Listen for popstate (back/forward navigation)
      window.addEventListener('popstate', () => {
        setTimeout(() => this.sendPageData(), 100);
      });
    }

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

    sendPageData() {
      this.getPageContent().then(content => {
        chrome.runtime.sendMessage({
          action: 'pageData',
          data: content
        });
      });
    }
    
    // Force refresh page data (called when background requests fresh data)
    refreshPageData() {
      // Reinitialize the DOM bridge to get fresh content
      this.db = new DomBridge();
      this.db.update();
      return this.getPageContent();
    }

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
  }

  // Initialize fallback content script
  new WebAIContentScript();
} 