import { PopupController } from './controllers/popupController.js';

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new PopupController();
    } catch (error) {
        console.error('Failed to initialize popup controller:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'status-message status-error';
        errorDiv.textContent = 'Failed to initialize extension. Please check the console for details.';
        errorDiv.style.display = 'block';
        
        const container = document.querySelector('.popup-container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
});
