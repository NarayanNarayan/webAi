import { AIService } from '../services/aiService.js';
import { RAGService } from '../services/ragService.js';
import { StorageService } from '../services/storageService.js';
import { PopupView } from '../views/popupView.js';

export class PopupController {
  constructor() {
    this.aiService = new AIService();
    this.ragService = new RAGService();
    this.view = new PopupView();
    this.currentTab = null;
    this.isProcessing = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Initialize view
      this.view.initialize();
      
      // Bind events
      this.bindEvents();
      
      // Check AI service status
      await this.checkAIStatus();
      
      // Load current page info
      await this.loadCurrentPageInfo();
    } catch (error) {
      console.error('Error initializing popup controller:', error);
      this.view.showError('Failed to initialize extension');
    }
  }

  bindEvents() {
    // Summarize button
    this.view.bindSummarizeButton(async () => {
      await this.handleSummarize();
    });

    // Settings button
    this.view.bindSettingsButton(() => {
      chrome.runtime.openOptionsPage();
    });

    // Similar pages button
    this.view.bindSimilarPagesButton(async () => {
      await this.handleFindSimilar();
    });

    // Autofill button
    this.view.bindAutofillButton(async () => {
      await this.handleAutofill();
    });
  }

  async checkAIStatus() {
    try {
      const apiKeys = await StorageService.getApiKeys();
      if (!apiKeys.geminiApiKey) {
        this.view.showWarning('Please configure your Gemini API key in the options page');
        return false;
      }

      const initialized = await this.aiService.initialize();
      if (initialized) {
        this.view.showSuccess('AI service ready');
        return true;
      } else {
        this.view.showError('Failed to initialize AI service');
        return false;
      }
    } catch (error) {
      this.view.showError('Error checking AI service status');
      return false;
    }
  }

  async loadCurrentPageInfo() {
    try {
      if (!this.currentTab) return;

      const pageInfo = {
        title: this.currentTab.title,
        url: this.currentTab.url,
        domain: new URL(this.currentTab.url).hostname
      };

      this.view.updatePageInfo(pageInfo);

      // Check if we already have a summary for this page
      const summaries = await StorageService.getSummaries();
      if (summaries[this.currentTab.url]) {
        this.view.showExistingSummary(summaries[this.currentTab.url]);
      }
    } catch (error) {
      console.error('Error loading current page info:', error);
    }
  }

  async handleSummarize() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      this.view.showLoading('Summarizing webpage...');

      // Execute content script to get page content
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: () => {
          const contentService = new ContentService();
          return contentService.extractWebpageContent();
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract page content');
      }

      // Get summary length preference
      const settings = await StorageService.getSettings();
      
      // Generate summary
      const summaryResult = await this.aiService.summarizeWebpage(
        result.content,
        result.url,
        settings.summaryLength
      );

      if (!summaryResult.success) {
        throw new Error(summaryResult.error);
      }

      // Store summary in RAG server
      await this.ragService.storeWebpageSummary(
        summaryResult.summary,
        result.url,
        result.title
      );

      // Update view
      this.view.showSummary(summaryResult.summary);
      this.view.showSuccess('Summary generated and stored successfully');

    } catch (error) {
      console.error('Error summarizing webpage:', error);
      this.view.showError(`Failed to summarize: ${error.message}`);
    } finally {
      this.isProcessing = false;
      this.view.hideLoading();
    }
  }

  async handleFindSimilar() {
    try {
      this.view.showLoading('Finding similar pages...');

      // Get current page summary
      const summaries = await StorageService.getSummaries();
      const currentSummary = summaries[this.currentTab.url];

      if (!currentSummary) {
        this.view.showWarning('Please generate a summary first');
        return;
      }

      // Find similar pages
      const similarResult = await this.ragService.findSimilarWebpages(
        currentSummary.summary,
        this.currentTab.url
      );

      if (!similarResult.success) {
        throw new Error(similarResult.error);
      }

      if (similarResult.similarPages.length === 0) {
        this.view.showInfo('No similar pages found');
        return;
      }

      // Display similar pages
      this.view.showSimilarPages(similarResult.similarPages);

    } catch (error) {
      console.error('Error finding similar pages:', error);
      this.view.showError(`Failed to find similar pages: ${error.message}`);
    } finally {
      this.view.hideLoading();
    }
  }

  async handleAutofill() {
    try {
      this.view.showLoading('Analyzing forms...');

      // Execute content script to analyze forms
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        function: () => {
          const contentService = new ContentService();
          return contentService.extractWebpageContent();
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze forms');
      }

      if (!result.formFields || result.formFields.length === 0) {
        this.view.showInfo('No forms found on this page');
        return;
      }

      // Show form analysis
      this.view.showFormAnalysis(result.formFields);

    } catch (error) {
      console.error('Error analyzing forms:', error);
      this.view.showError(`Failed to analyze forms: ${error.message}`);
    } finally {
      this.view.hideLoading();
    }
  }
}
