/**
 * DOM Utilities for WebAI Frontend
 * Utility functions for DOM manipulation and content extraction
 */

class DOMUtils {
  /**
   * Extract text content from DOM element
   */
  static extractText(element) {
    if (!element) return '';
    
    // Remove script and style elements
    const scripts = element.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    return element.textContent || element.innerText || '';
  }

  /**
   * Extract all text nodes from DOM
   */
  static extractTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text) {
        textNodes.push(text);
      }
    }

    return textNodes;
  }

  /**
   * Find elements by multiple selectors
   */
  static findElements(selectors, context = document) {
    for (const selector of selectors) {
      const elements = context.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    }
    return [];
  }

  /**
   * Find form fields by various attributes
   */
  static findFormFields(form, fieldName) {
    const selectors = [
      `input[name*="${fieldName}" i]`,
      `input[placeholder*="${fieldName}" i]`,
      `input[id*="${fieldName}" i]`,
      `textarea[name*="${fieldName}" i]`,
      `textarea[placeholder*="${fieldName}" i]`,
      `textarea[id*="${fieldName}" i]`,
      `select[name*="${fieldName}" i]`,
      `select[id*="${fieldName}" i]`
    ];

    return this.findElements(selectors, form);
  }

  /**
   * Get all forms on the page
   */
  static getAllForms() {
    return Array.from(document.querySelectorAll('form'));
  }

  /**
   * Get form field information
   */
  static getFormFieldInfo(field) {
    return {
      name: field.name || field.id || field.placeholder || '',
      type: field.type || 'text',
      value: field.value || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      id: field.id || '',
      className: field.className || ''
    };
  }

  /**
   * Extract all form fields from page
   */
  static extractFormFields() {
    const forms = this.getAllForms();
    const formData = {};

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const info = this.getFormFieldInfo(input);
        if (info.name && !formData[info.name]) {
          formData[info.name] = '';
        }
      });
    });

    return formData;
  }

  /**
   * Fill form field with value
   */
  static fillFormField(field, value) {
    if (!field || !value) return false;

    try {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (error) {
      console.error('Error filling form field:', error);
      return false;
    }
  }

  /**
   * Highlight text in DOM
   */
  static highlightText(text, highlightClass = 'webai-highlight') {
    const highlights = [];
    
    // Find all text nodes containing the text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.textContent;
      if (nodeText.includes(text)) {
        // Create highlight element
        const highlightEl = document.createElement('span');
        highlightEl.className = highlightClass;
        highlightEl.style.backgroundColor = '#ffeb3b';
        highlightEl.style.color = '#000';
        highlightEl.style.padding = '2px 4px';
        highlightEl.style.borderRadius = '3px';
        highlightEl.style.fontWeight = 'bold';
        highlightEl.textContent = text;
        
        // Replace text with highlight
        const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const newText = nodeText.replace(regex, highlightEl.outerHTML);
        
        if (newText !== nodeText) {
          node.parentNode.innerHTML = newText;
          highlights.push(highlightEl);
        }
      }
    }

    return highlights;
  }

  /**
   * Remove highlights from DOM
   */
  static removeHighlights(highlightClass = 'webai-highlight') {
    const highlights = document.querySelectorAll(`.${highlightClass}`);
    highlights.forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  }

  /**
   * Get page metadata
   */
  static getPageMetadata() {
    return {
      title: document.title,
      url: window.location.href,
      description: this.getMetaContent('description'),
      keywords: this.getMetaContent('keywords'),
      author: this.getMetaContent('author'),
      viewport: this.getMetaContent('viewport'),
      robots: this.getMetaContent('robots')
    };
  }

  /**
   * Get meta content by name
   */
  static getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  }

  /**
   * Get all links on the page
   */
  static getAllLinks() {
    return Array.from(document.querySelectorAll('a')).map(link => ({
      href: link.href,
      text: link.textContent.trim(),
      title: link.title
    }));
  }

  /**
   * Get all images on the page
   */
  static getAllImages() {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      title: img.title,
      width: img.width,
      height: img.height
    }));
  }

  /**
   * Check if element is visible
   */
  static isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  /**
   * Get visible text content
   */
  static getVisibleText(element = document.body) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          return parent && this.isElementVisible(parent) ? 
                 NodeFilter.FILTER_ACCEPT : 
                 NodeFilter.FILTER_REJECT;
        }
      },
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text) {
        textNodes.push(text);
      }
    }

    return textNodes.join(' ');
  }

  /**
   * Debounce function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Export utilities for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMUtils;
} 