// Enhanced Compliance Platform JavaScript
// Phase 2 Enhancements

const ENHANCED_FRAMEWORKS = {
    \"SOC 2\": [\"Security\", \"Availability\", \"Processing Integrity\", \"Confidentiality\", \"Privacy\"],
    \"HIPAA\": [\"Privacy Rule\", \"Security Rule\", \"Breach Notification\"],
    \"NIST CSF\": [\"Identify\", \"Protect\", \"Detect\", \"Respond\", \"Recover\"],
    \"PCI DSS\": [\"Build Secure Systems\", \"Protect Cardholder Data\", \"Vulnerability Management\", \"Access Control\", \"Monitoring\", \"Security Policies\"],
    \"ISO 27001\": [\"Context Establishment\", \"Leadership\", \"Planning\", \"Support\", \"Operation\", \"Performance Evaluation\", \"Improvement\"]
};

// User Management Functions
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
}

function hideRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
}

function showRegister() {
    hideLoginModal();
    showRegisterModal();
}

function showLogin() {
    hideRegisterModal();
    showLoginModal();
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userRole', result.role);
            hideLoginModal();
            updateUserInterface();
            alert('Login successful! Welcome ' + username);
        } else {
            alert('Login failed: ' + result.error);
        }
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert('Registration failed: ' + result.error);
        }
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
}

function updateUserInterface() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        document.body.classList.add('user-logged-in');
        // Add user-specific UI updates here
    } else {
        document.body.classList.remove('user-logged-in');
    }
}

// Export Functions
async function exportToPDF() {
    try {
        const controls = await loadAllControls();
        const framework = document.getElementById('frameworkSelect').value;
        
        const response = await fetch('/export/pdf', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({controls, framework})
        });
        
        const result = await response.json();
        alert('PDF exported successfully: ' + result.filename);
    } catch (error) {
        alert('PDF export failed: ' + error.message);
    }
}

async function exportToExcel() {
    try {
        const controls = await loadAllControls();
        
        const response = await fetch('/export/excel', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({controls})
        });
        
        const result = await response.json();
        alert('Excel exported successfully: ' + result.filename);
    } catch (error) {
        alert('Excel export failed: ' + error.message);
    }
}

// Evidence Upload
async function handleEvidenceUpload() {
    const files = document.getElementById('evidenceUpload').files;
    if (files.length === 0) return;
    
    const formData = new FormData();
    for (let file of files) {
        formData.append('evidence', file);
    }
    
    try {
        const response = await fetch('/upload-evidence', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Evidence uploaded successfully: ' + result.filename);
        } else {
            alert('Upload failed: ' + result.error);
        }
    } catch (error) {
        alert('Upload error: ' + error.message);
    }
}

// Enhanced Framework Support
function updateFrameworkOptions() {
    const frameworkSelect = document.getElementById('frameworkSelect');
    if (frameworkSelect) {
        // Framework options are now hardcoded in HTML
        console.log('Framework selector enhanced');
    }
}

// Load all controls for export
async function loadAllControls() {
    try {
        const response = await fetch('/load-controls');
        return await response.json();
    } catch (error) {
        console.error('Error loading controls:', error);
        return [];
    }
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function() {
    updateFrameworkOptions();
    updateUserInterface();
    
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        console.log('User already logged in:', currentUser);
    }
    
    console.log('Phase 2 enhancements loaded successfully');
});
