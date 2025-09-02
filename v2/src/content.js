// Content script for Web AI Extension

// Import the ContentService class
import { ContentService } from './services/contentService.js';

// Initialize content service
let contentService;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}

function initializeContentScript() {
    try {
        contentService = new ContentService();
        console.log('Web AI Extension content script initialized');
        
        // Set up message listener for communication with popup
        setupMessageListener();
        
        // Add visual indicators for forms (optional)
        addFormIndicators();
        
    } catch (error) {
        console.error('Failed to initialize content script:', error);
    }
}

// Set up message listener for communication with popup
function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        switch (request.action) {
            case 'extractContent':
                handleExtractContent(sendResponse);
                return true;
                
            case 'analyzeForms':
                handleAnalyzeForms(sendResponse);
                return true;
                
            case 'autofillForm':
                handleAutofillForm(request, sendResponse);
                return true;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    });
}

// Handle content extraction request
async function handleExtractContent(sendResponse) {
    try {
        if (!contentService) {
            contentService = new ContentService();
        }
        
        const result = await contentService.extractWebpageContent();
        sendResponse(result);
        
    } catch (error) {
        console.error('Error extracting content:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle form analysis request
async function handleAnalyzeForms(sendResponse) {
    try {
        if (!contentService) {
            contentService = new ContentService();
        }
        
        const result = await contentService.extractWebpageContent();
        sendResponse({
            success: true,
            formFields: result.formFields || []
        });
        
    } catch (error) {
        console.error('Error analyzing forms:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle form autofill request
async function handleAutofillForm(request, sendResponse) {
    try {
        if (!contentService) {
            contentService = new ContentService();
        }
        
        const { formData } = request;
        const result = await contentService.autofillForm(formData);
        sendResponse(result);
        
    } catch (error) {
        console.error('Error autofilling form:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Add visual indicators for forms (optional enhancement)
function addFormIndicators() {
    try {
        const forms = document.querySelectorAll('form');
        
        forms.forEach((form, index) => {
            // Add a subtle indicator that this form can be analyzed
            const indicator = document.createElement('div');
            indicator.className = 'web-ai-form-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(102, 126, 234, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            indicator.textContent = `Form ${index + 1} detected`;
            
            // Show indicator on hover
            form.addEventListener('mouseenter', () => {
                indicator.style.opacity = '1';
            });
            
            form.addEventListener('mouseleave', () => {
                indicator.style.opacity = '0';
            });
            
            // Position indicator near the form
            const rect = form.getBoundingClientRect();
            indicator.style.top = `${rect.top + window.scrollY - 30}px`;
            indicator.style.left = `${rect.left + window.scrollX}px`;
            
            document.body.appendChild(indicator);
        });
        
    } catch (error) {
        console.error('Error adding form indicators:', error);
    }
}

// Enhanced content extraction with better selectors
function enhanceContentExtraction() {
    try {
        // Look for more specific content selectors
        const enhancedSelectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.main-content',
            '#content',
            '#main',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.story-content',
            '.page-content'
        ];
        
        let mainContent = '';
        let contentElement = null;
        
        // Try to find the best content element
        for (const selector of enhancedSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
                contentElement = element;
                break;
            }
        }
        
        if (contentElement) {
            mainContent = contentElement.textContent;
        } else {
            // Fallback to body content
            mainContent = document.body.textContent;
        }
        
        return mainContent;
        
    } catch (error) {
        console.error('Error in enhanced content extraction:', error);
        return document.body.textContent || '';
    }
}

// Monitor for dynamic content changes
function setupContentMonitoring() {
    try {
        // Use MutationObserver to watch for content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // New content was added, could trigger re-analysis
                    console.log('Content changed, may need re-analysis');
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
    } catch (error) {
        console.error('Error setting up content monitoring:', error);
    }
}

// Utility function to clean and normalize text
function cleanText(text) {
    if (!text) return '';
    
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim()
        .substring(0, 10000); // Limit content length
}

// Export functions for use in background script
window.WebAIExtension = {
    extractContent: () => {
        if (contentService) {
            return contentService.extractWebpageContent();
        }
        return { success: false, error: 'Content service not initialized' };
    },
    
    analyzeForms: () => {
        if (contentService) {
            return contentService.extractFormFields();
        }
        return [];
    },
    
    getPageInfo: () => {
        if (contentService) {
            return contentService.getCurrentPageInfo();
        }
        return { url: window.location.href, title: document.title };
    }
};

// Set up content monitoring
setupContentMonitoring();

console.log('Web AI Extension content script loaded and ready');
