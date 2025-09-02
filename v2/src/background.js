// Background service worker for Web AI Extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Web AI Extension installed successfully');
        
        // Open options page for first-time setup
        chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
        console.log('Web AI Extension updated to version', chrome.runtime.getManifest().version);
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'getCurrentTab':
            handleGetCurrentTab(sendResponse);
            return true; // Keep message channel open for async response
            
        case 'executeContentScript':
            handleExecuteContentScript(request, sender, sendResponse);
            return true;
            
        case 'getStorageData':
            handleGetStorageData(request, sendResponse);
            return true;
            
        case 'setStorageData':
            handleSetStorageData(request, sendResponse);
            return true;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Handle getting current active tab
async function handleGetCurrentTab(sendResponse) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        sendResponse({ success: true, tab });
    } catch (error) {
        console.error('Error getting current tab:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle executing content script functions
async function handleExecuteContentScript(request, sender, sendResponse) {
    try {
        const { tabId, functionName, args } = request;
        
        if (!tabId) {
            sendResponse({ success: false, error: 'Tab ID is required' });
            return;
        }
        
        // Execute the content script function
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: executeContentFunction,
            args: [functionName, args]
        });
        
        if (results && results[0] && results[0].result) {
            sendResponse({ success: true, result: results[0].result });
        } else {
            sendResponse({ success: false, error: 'No result from content script' });
        }
        
    } catch (error) {
        console.error('Error executing content script:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Function to execute in content script context
function executeContentFunction(functionName, args) {
    try {
        // This function runs in the content script context
        switch (functionName) {
            case 'extractWebpageContent':
                if (typeof ContentService !== 'undefined') {
                    const contentService = new ContentService();
                    return contentService.extractWebpageContent();
                } else {
                    // Fallback content extraction
                    return extractBasicContent();
                }
                
            case 'analyzeForms':
                if (typeof ContentService !== 'undefined') {
                    const contentService = new ContentService();
                    return contentService.extractFormFields();
                } else {
                    return extractBasicForms();
                }
                
            default:
                return { success: false, error: 'Unknown function' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fallback content extraction
function extractBasicContent() {
    try {
        const content = document.body ? document.body.textContent : '';
        const title = document.title || '';
        const url = window.location.href;
        
        return {
            success: true,
            content: content.substring(0, 10000),
            title,
            url,
            formFields: extractBasicForms(),
            timestamp: Date.now()
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fallback form extraction
function extractBasicForms() {
    try {
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
                        label: findLabel(input),
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
    } catch (error) {
        return [];
    }
}

// Helper function to find labels
function findLabel(input) {
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.textContent.trim();
    }
    
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    
    if (input.getAttribute('aria-label')) {
        return input.getAttribute('aria-label');
    }
    
    return '';
}

// Handle storage operations
async function handleGetStorageData(request, sendResponse) {
    try {
        const { key, storageType = 'sync' } = request;
        const storage = storageType === 'local' ? chrome.storage.local : chrome.storage.sync;
        
        const result = await storage.get(key);
        sendResponse({ success: true, data: result[key] });
        
    } catch (error) {
        console.error('Error getting storage data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleSetStorageData(request, sendResponse) {
    try {
        const { key, value, storageType = 'sync' } = request;
        const storage = storageType === 'local' ? chrome.storage.local : chrome.storage.sync;
        
        await storage.set({ [key]: value });
        sendResponse({ success: true });
        
    } catch (error) {
        console.error('Error setting storage data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle tab updates for auto-summarization
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        // Check if auto-summarization is enabled
        chrome.storage.sync.get(['webAiSettings'], (result) => {
            const settings = result.webAiSettings || {};
            if (settings.autoSummarize) {
                // Auto-summarize the page
                handleAutoSummarize(tabId, tab);
            }
        });
    }
});

// Handle auto-summarization
async function handleAutoSummarize(tabId, tab) {
    try {
        // Check if we already have a summary for this URL
        const summaries = await chrome.storage.local.get(['webAiSummaries']);
        const existingSummaries = summaries.webAiSummaries || {};
        
        if (existingSummaries[tab.url]) {
            return; // Already summarized
        }
        
        // Extract content and generate summary
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: extractBasicContent
        });
        
        if (results && results[0] && results[0].result && results[0].result.success) {
            const content = results[0].result;
            
            // Store the extracted content for later summarization
            await chrome.storage.local.set({
                [`webAiSummaries.${tab.url}`]: {
                    ...content,
                    pendingSummary: true,
                    timestamp: Date.now()
                }
            });
            
            console.log('Auto-extracted content for:', tab.url);
        }
        
    } catch (error) {
        console.error('Error in auto-summarization:', error);
    }
}

console.log('Web AI Extension background service worker loaded');
