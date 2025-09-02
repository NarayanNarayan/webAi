import { OptionsController } from './controllers/optionsController.js';

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new OptionsController();
        
        // Add range slider functionality
        const thresholdSlider = document.getElementById('similarity-threshold');
        const thresholdValue = document.getElementById('threshold-value');
        
        if (thresholdSlider && thresholdValue) {
            thresholdSlider.addEventListener('input', (e) => {
                thresholdValue.textContent = e.target.value;
            });
        }
        
    } catch (error) {
        console.error('Failed to initialize options controller:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'status-message status-error';
        errorDiv.textContent = 'Failed to initialize options page. Please check the console for details.';
        errorDiv.style.display = 'block';
        
        const container = document.querySelector('.options-container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }
});
