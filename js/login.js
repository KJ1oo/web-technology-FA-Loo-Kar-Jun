document.addEventListener('DOMContentLoaded', function() {
    const errorMessage = document.getElementById('errorMessage');
    const loginForm = document.querySelector('form');
    
    // Show error
    if (window.location.search.includes('error=1')) {
        if (errorMessage) {
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.style.display = 'block';
        }
    }
    
    // Form validation
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                e.preventDefault();
                if (errorMessage) {
                    errorMessage.textContent = 'Please fill in both fields';
                    errorMessage.style.display = 'block';
                }
            }
        });
    }
    
    // Auto-focus username field
    const usernameField = document.getElementById('username');
    if (usernameField) {
        usernameField.focus();
    }
});