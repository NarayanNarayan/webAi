export const CONFIG = {
  // API Configuration
  RAG_SERVER_URL: 'http://localhost:8000', // Change this to your RAG server URL
  
  // Default settings
  DEFAULT_SETTINGS: {
    geminiApiKey: '',
    autoSummarize: false,
    summaryLength: 'medium', // short, medium, long
    similarityThreshold: 0.7
  },
  
  // Storage keys
  STORAGE_KEYS: {
    SETTINGS: 'webAiSettings',
    API_KEYS: 'webAiApiKeys',
    SUMMARIES: 'webAiSummaries'
  },
  
  // UI Configuration
  UI: {
    POPUP_WIDTH: 400,
    POPUP_HEIGHT: 600,
    OPTIONS_WIDTH: 800,
    OPTIONS_HEIGHT: 600
  }
};
