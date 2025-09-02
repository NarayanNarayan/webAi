export class ContentService {
  constructor() {
    this.currentUrl = window.location.href;
    this.pageTitle = document.title;
  }

  async extractWebpageContent() {
    try {
      // Extract main content using various selectors
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '#content',
        '#main',
        '.post-content',
        '.entry-content'
      ];

      let mainContent = '';
      
      // Try to find main content area
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = this.cleanText(element.textContent);
          break;
        }
      }

      // Fallback to body content if no main content found
      if (!mainContent) {
        mainContent = this.cleanText(document.body.textContent);
      }

      // Extract form fields for potential autofill
      const formFields = this.extractFormFields();

      return {
        success: true,
        content: mainContent,
        title: this.pageTitle,
        url: this.currentUrl,
        formFields,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error extracting webpage content:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit content length
  }

  extractFormFields() {
    const forms = document.querySelectorAll('form');
    const formFields = [];

    forms.forEach((form, formIndex) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      const fields = [];

      inputs.forEach(input => {
        if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
          fields.push({
            name: input.name || input.id || `field_${input.type}`,
            type: input.type,
            placeholder: input.placeholder || '',
            label: this.findLabel(input),
            required: input.required || false
          });
        }
      });

      if (fields.length > 0) {
        formFields.push({
          formIndex,
          action: form.action || '',
          method: form.method || 'GET',
          fields
        });
      }
    });

    return formFields;
  }

  findLabel(input) {
    // Try to find associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Check if input is wrapped in label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();

    // Check for aria-label
    if (input.getAttribute('aria-label')) {
      return input.getAttribute('aria-label');
    }

    return '';
  }

  async autofillForm(formData) {
    try {
      const forms = document.querySelectorAll('form');
      let filledCount = 0;

      forms.forEach((form, formIndex) => {
        const formConfig = formData[formIndex];
        if (!formConfig) return;

        formConfig.fields.forEach(field => {
          const input = form.querySelector(`[name="${field.name}"], [id="${field.name}"]`);
          if (input && field.value) {
            input.value = field.value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
          }
        });
      });

      return {
        success: true,
        filledCount,
        message: `Successfully filled ${filledCount} form fields`
      };
    } catch (error) {
      console.error('Error autofilling form:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getCurrentPageInfo() {
    return {
      url: this.currentUrl,
      title: this.pageTitle,
      domain: new URL(this.currentUrl).hostname
    };
  }
}
