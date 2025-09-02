import { CONFIG } from '../config/config.js';

export class StorageService {
  static async getSettings() {
    try {
      const result = await chrome.storage.sync.get(CONFIG.STORAGE_KEYS.SETTINGS);
      return { ...CONFIG.DEFAULT_SETTINGS, ...result[CONFIG.STORAGE_KEYS.SETTINGS] };
    } catch (error) {
      console.error('Error getting settings:', error);
      return CONFIG.DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(settings) {
    try {
      await chrome.storage.sync.set({
        [CONFIG.STORAGE_KEYS.SETTINGS]: settings
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  static async getApiKeys() {
    try {
      const result = await chrome.storage.sync.get(CONFIG.STORAGE_KEYS.API_KEYS);
      return result[CONFIG.STORAGE_KEYS.API_KEYS] || {};
    } catch (error) {
      console.error('Error getting API keys:', error);
      return {};
    }
  }

  static async saveApiKeys(apiKeys) {
    try {
      await chrome.storage.sync.set({
        [CONFIG.STORAGE_KEYS.API_KEYS]: apiKeys
      });
      return true;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return false;
    }
  }

  static async getSummaries() {
    try {
      const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.SUMMARIES);
      return result[CONFIG.STORAGE_KEYS.SUMMARIES] || {};
    } catch (error) {
      console.error('Error getting summaries:', error);
      return {};
    }
  }

  static async saveSummary(url, summary) {
    try {
      const summaries = await this.getSummaries();
      summaries[url] = {
        ...summary,
        timestamp: Date.now()
      };
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.SUMMARIES]: summaries
      });
      return true;
    } catch (error) {
      console.error('Error saving summary:', error);
      return false;
    }
  }
}
