import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { StorageService } from './storageService.js';

export class AIService {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const apiKeys = await StorageService.getApiKeys();
      if (!apiKeys.geminiApiKey) {
        throw new Error('Gemini API key not found. Please configure it in the options page.');
      }

      this.model = new ChatGoogleGenerativeAI({
        modelName: 'gemini-pro',
        maxOutputTokens: 2048,
        apiKey: apiKeys.geminiApiKey,
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing AI service:', error);
      this.initialized = false;
      return false;
    }
  }

  async summarizeWebpage(content, url, summaryLength = 'medium') {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('AI service not initialized');
        }
      }

      const lengthInstructions = {
        short: 'Provide a brief summary in 2-3 sentences.',
        medium: 'Provide a comprehensive summary in 4-6 sentences.',
        long: 'Provide a detailed summary in 8-10 sentences.'
      };

      const prompt = `
        Please analyze the following webpage content and provide a ${summaryLength} summary.
        
        URL: ${url}
        
        ${lengthInstructions[summaryLength]}
        
        Focus on:
        - Main topic and key points
        - Important information and insights
        - Overall purpose of the content
        
        Webpage content:
        ${content} // Don't Limit content length for API efficiency
        
        Summary:
      `;

      const response = await this.model.invoke([
        new HumanMessage(prompt)
      ]);

      const summary = response.content;
      
      // Save summary to storage
      await StorageService.saveSummary(url, {
        summary,
        length: summaryLength,
        content: content.substring(0, 1000), // Store truncated content for reference
        url
      });

      return {
        success: true,
        summary,
        url
      };
    } catch (error) {
      console.error('Error summarizing webpage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async isInitialized() {
    return this.initialized;
  }
}
