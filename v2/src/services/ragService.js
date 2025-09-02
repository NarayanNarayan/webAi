import { CONFIG } from '../config/config.js';

export class RAGService {
  constructor() {
    this.baseUrl = CONFIG.RAG_SERVER_URL;
  }

  async findSimilarWebpages(summary, currentUrl) {
    try {
      const response = await fetch(`${this.baseUrl}/api/similar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          currentUrl,
          threshold: CONFIG.DEFAULT_SETTINGS.similarityThreshold
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        similarPages: data.similarPages || [],
        totalFound: data.totalFound || 0
      };
    } catch (error) {
      console.error('Error finding similar webpages:', error);
      return {
        success: false,
        error: error.message,
        similarPages: [],
        totalFound: 0
      };
    }
  }

  async storeWebpageSummary(summary, url, title) {
    try {
      const response = await fetch(`${this.baseUrl}/api/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          url,
          title,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Summary stored successfully'
      };
    } catch (error) {
      console.error('Error storing webpage summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getWebpageStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        stats: data
      };
    } catch (error) {
      console.error('Error getting webpage stats:', error);
      return {
        success: false,
        error: error.message,
        stats: {}
      };
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
