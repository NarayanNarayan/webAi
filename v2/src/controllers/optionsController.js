import { StorageService } from '../services/storageService.js';
import { RAGService } from '../services/ragService.js';
import { OptionsView } from '../views/optionsView.js';

export class OptionsController {
  constructor() {
    this.view = new OptionsView();
    this.ragService = new RAGService();
    this.initialize();
  }

  async initialize() {
    try {
      this.view.initialize();
      this.bindEvents();
      await this.loadCurrentSettings();
      await this.checkRAGConnection();
    } catch (error) {
      console.error('Error initializing options controller:', error);
      this.view.showError('Failed to initialize options page');
    }
  }

  async checkRAGConnection() {
    try {
      const isConnected = await this.ragService.testConnection();
      if (isConnected) {
        this.view.showInfo('RAG server connection available');
      } else {
        this.view.showWarning('RAG server not accessible. Check if it\'s running.');
      }
    } catch (error) {
      console.error('Error checking RAG connection:', error);
      this.view.showWarning('Unable to check RAG server connection');
    }
  }

  bindEvents() {
    // Save settings button
    this.view.bindSaveButton(async () => {
      await this.handleSaveSettings();
    });

    // Test connection button
    this.view.bindTestConnectionButton(async () => {
      await this.handleTestConnection();
    });

    // Reset settings button
    this.view.bindResetButton(async () => {
      await this.handleResetSettings();
    });

    // Clear data button
    this.view.bindClearDataButton(async () => {
      await this.handleClearData();
    });
  }

  async loadCurrentSettings() {
    try {
      const [settings, apiKeys] = await Promise.all([
        StorageService.getSettings(),
        StorageService.getApiKeys()
      ]);

      this.view.populateForm(settings, apiKeys);
    } catch (error) {
      console.error('Error loading settings:', error);
      this.view.showError('Failed to load current settings');
    }
  }

  async handleSaveSettings() {
    try {
      this.view.showLoading('Saving settings...');

      const formData = this.view.getFormData();
      
      // Validate required fields
      if (!formData.apiKeys.geminiApiKey) {
        throw new Error('Gemini API key is required');
      }

      // Save settings and API keys
      const [settingsSaved, apiKeysSaved] = await Promise.all([
        StorageService.saveSettings(formData.settings),
        StorageService.saveApiKeys(formData.apiKeys)
      ]);

      if (settingsSaved && apiKeysSaved) {
        this.view.showSuccess('Settings saved successfully!');
        
        // Test AI service connection
        await this.testAIConnection(formData.apiKeys.geminiApiKey);
      } else {
        throw new Error('Failed to save some settings');
      }

    } catch (error) {
      console.error('Error saving settings:', error);
      this.view.showError(`Failed to save settings: ${error.message}`);
    } finally {
      this.view.hideLoading();
    }
  }

  async handleTestConnection() {
    try {
      this.view.showLoading('Testing RAG server connection...');

      const isConnected = await this.ragService.testConnection();
      
      if (isConnected) {
        this.view.showSuccess('RAG server connection successful!');
        
        // Get server stats
        const statsResult = await this.ragService.getWebpageStats();
        if (statsResult.success) {
          this.view.showServerStats(statsResult.stats);
        }
      } else {
        this.view.showError('Failed to connect to RAG server. Please check the server URL and ensure it\'s running.');
      }

    } catch (error) {
      console.error('Error testing connection:', error);
      this.view.showError(`Connection test failed: ${error.message}`);
    } finally {
      this.view.hideLoading();
    }
  }

  async handleResetSettings() {
    try {
      if (confirm('Are you sure you want to reset all settings to default values?')) {
        this.view.showLoading('Resetting settings...');

        // Reset to default settings
        const defaultSettings = {
          geminiApiKey: '',
          autoSummarize: false,
          summaryLength: 'medium',
          similarityThreshold: 0.7
        };

        await StorageService.saveSettings(defaultSettings);
        await StorageService.saveApiKeys({});

        this.view.populateForm(defaultSettings, {});
        this.view.showSuccess('Settings reset to default values');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.view.showError('Failed to reset settings');
    } finally {
      this.view.hideLoading();
    }
  }

  async handleClearData() {
    try {
      if (confirm('Are you sure you want to clear all stored summaries and data? This action cannot be undone.')) {
        this.view.showLoading('Clearing data...');

        // Clear summaries from storage
        await chrome.storage.local.remove('webAiSummaries');
        
        this.view.showSuccess('All data cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      this.view.showError('Failed to clear data');
    } finally {
      this.view.hideLoading();
    }
  }

  async testAIConnection(apiKey) {
    try {
      // Test if the API key works by making a simple request
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      const { HumanMessage } = await import('@langchain/core/messages');
      
      const testModel = new ChatGoogleGenerativeAI({
        modelName: 'gemini-pro',
        maxOutputTokens: 10,
        apiKey: apiKey,
      });

      const response = await testModel.invoke([
        new HumanMessage('Hello')
      ]);

      if (response.content) {
        this.view.showSuccess('Gemini API connection successful!');
      }
    } catch (error) {
      console.error('Error testing AI connection:', error);
      this.view.showWarning('Gemini API key saved, but connection test failed. Please verify your API key.');
    }
  }
}
