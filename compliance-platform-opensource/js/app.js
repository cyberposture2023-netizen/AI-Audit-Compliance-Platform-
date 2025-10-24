// Main Application JavaScript
class CompliancePlatform {
    constructor() {
        this.currentPlan = null;
        this.controls = [];
        this.currentControl = null;
        this.currentDocumentType = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadExistingData();
        this.setupFrameworkSelection();
    }

    setupFrameworkSelection() {
        // Framework selection cards
        document.querySelectorAll(".framework-option").forEach(option => {
            option.addEventListener("click", () => {
                // Remove active class from all options
                document.querySelectorAll(".framework-option").forEach(opt => {
                    opt.style.border = "none";
                    opt.style.background = "white";
                });
                
                // Add active class to clicked option
                option.style.border = "2px solid #6366f1";
                option.style.background = "#f0f4ff";
                
                // Update hidden input
                document.getElementById("framework").value = option.dataset.value;
            });
        });

        // Set first option as active by default
        const firstOption = document.querySelector(".framework-option");
        if (firstOption) {
            firstOption.style.border = "2px solid #6366f1";
            firstOption.style.background = "#f0f4ff";
        }
    }
    constructor() {
        this.currentPlan = null;
        this.controls = [];
        this.currentControl = null;
        this.currentDocumentType = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadExistingData();
    }

    bindEvents() {
        // Tab navigation
        document.getElementById('tab-intake').addEventListener('click', () => this.showTab('intake'));
        document.getElementById('tab-dashboard').addEventListener('click', () => this.showTab('dashboard'));
        document.getElementById('close-control-view').addEventListener('click', () => this.showTab('dashboard'));

        // Form submission
        document.getElementById('audit-form').addEventListener('submit', (e) => this.generateAuditPlan(e));

        // Filters
        document.getElementById('filter-status').addEventListener('change', () => this.filterControls());
        document.getElementById('filter-risk').addEventListener('change', () => this.filterControls());
        document.getElementById('filter-type').addEventListener('change', () => this.filterControls());
        document.getElementById('search-controls').addEventListener('input', () => this.filterControls());

        // Control actions
        document.getElementById('control-status').addEventListener('change', (e) => this.updateControlStatus(e.target.value));

        // AI Helper
        document.getElementById('generate-policy').addEventListener('click', () => this.generateDocument('policy'));
        document.getElementById('generate-procedure').addEventListener('click', () => this.generateDocument('procedure'));

        // Modal
        document.getElementById('close-policy-modal').addEventListener('click', () => this.hidePolicyModal());
        document.getElementById('cancel-policy').addEventListener('click', () => this.hidePolicyModal());
        document.getElementById('save-policy').addEventListener('click', () => this.savePolicy());
    }

    async loadExistingData() {
        try {
            const response = await fetch('/api/get-data?type=controls');
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                this.controls = data.data;
                this.updateDashboard();
                this.showTab('dashboard');
            }
        } catch (error) {
            console.log('No existing data found');
        }
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('active');
        });

        // Remove active state from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('border-blue-500', 'text-blue-600');
            button.classList.add('border-transparent', 'text-gray-500');
        });

        // Show selected tab
        document.getElementById(`content-${tabName}`).classList.remove('hidden');
        document.getElementById(`content-${tabName}`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-gray-500');
        document.getElementById(`tab-${tabName}`).classList.add('border-blue-500', 'text-blue-600');

        // Show controls tab button if we're in control view
        const controlsTab = document.getElementById('tab-controls');
        if (tabName === 'controls') {
            controlsTab.style.display = 'block';
        } else {
            controlsTab.style.display = 'none';
        }

        if (tabName === 'dashboard') {
            this.updateDashboard();
        }
    }

    async generateAuditPlan(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const techStack = formData.getAll('techStack');
        
        const requestData = {
            framework: formData.get('framework'),
            industry: formData.get('industry'),
            tech_stack: techStack
        };

        this.showLoading(true);

        try {
            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                this.currentPlan = data.plan;
                this.controls = data.controls;
                
                // Save controls to local storage
                for (const control of this.controls) {
                    await this.saveControl(control);
                }
                
                this.updateDashboard();
                this.showTab('dashboard');
                this.showNotification('Audit plan generated successfully!', 'success');
            } else {
                this.showNotification('Failed to generate audit plan: ' + data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error generating audit plan: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async saveControl(control) {
        try {
            const response = await fetch('/api/save-control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(control)
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving control:', error);
        }
    }

    updateDashboard() {
        this.updateStats();
        this.renderControlsTable();
    }

    updateStats() {
        const total = this.controls.length;
        const highRisk = this.controls.filter(c => c.risk_rating === 'High').length;
        const completed = this.controls.filter(c => c.status === 'Approved').length;
        const inProgress = this.controls.filter(c => c.status === 'In Progress' || c.status === 'Pending Review').length;

        document.getElementById('total-controls').textContent = total;
        document.getElementById('high-risk-count').textContent = highRisk;
        document.getElementById('completed-count').textContent = completed;
        document.getElementById('inprogress-count').textContent = inProgress;
    }

    renderControlsTable() {
        const tbody = document.getElementById('controls-table-body');
        tbody.innerHTML = '';

        const filteredControls = this.getFilteredControls();

        filteredControls.forEach(control => {
            const row = document.createElement('tr');
            
            const statusColor = this.getStatusColor(control.status);
            const riskColor = this.getRiskColor(control.risk_rating);

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${control.control_id}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${control.control_description}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                        ${control.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor}">
                        ${control.risk_rating}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${control.control_type}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="app.openControl('${control.control_id}')" class="text-blue-600 hover:text-blue-900">
                        Open
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    getFilteredControls() {
        const statusFilter = document.getElementById('filter-status').value;
        const riskFilter = document.getElementById('filter-risk').value;
        const typeFilter = document.getElementById('filter-type').value;
        const searchFilter = document.getElementById('search-controls').value.toLowerCase();

        return this.controls.filter(control => {
            const matchesStatus = !statusFilter || control.status === statusFilter;
            const matchesRisk = !riskFilter || control.risk_rating === riskFilter;
            const matchesType = !typeFilter || control.control_type === typeFilter;
            const matchesSearch = !searchFilter || 
                control.control_id.toLowerCase().includes(searchFilter) ||
                control.control_description.toLowerCase().includes(searchFilter) ||
                control.control_area.toLowerCase().includes(searchFilter);

            return matchesStatus && matchesRisk && matchesType && matchesSearch;
        });
    }

    filterControls() {
        this.renderControlsTable();
    }

    getStatusColor(status) {
        const colors = {
            'Not Started': 'bg-gray-100 text-gray-800',
            'In Progress': 'bg-yellow-100 text-yellow-800',
            'Pending Review': 'bg-blue-100 text-blue-800',
            'Approved': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getRiskColor(risk) {
        const colors = {
            'High': 'bg-red-100 text-red-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'Low': 'bg-green-100 text-green-800'
        };
        return colors[risk] || 'bg-gray-100 text-gray-800';
    }

    openControl(controlId) {
        this.currentControl = this.controls.find(c => c.control_id === controlId);
        if (!this.currentControl) return;

        this.populateControlView();
        this.showTab('controls');
    }

    populateControlView() {
        if (!this.currentControl) return;

        // Basic info
        document.getElementById('control-view-title').textContent = this.currentControl.control_id;
        document.getElementById('control-id').textContent = this.currentControl.control_id;
        document.getElementById('control-area').textContent = this.currentControl.control_area;
        document.getElementById('control-type').textContent = this.currentControl.control_type;
        document.getElementById('control-risk-rating').textContent = this.currentControl.risk_rating;
        document.getElementById('control-description').textContent = this.currentControl.control_description;
        document.getElementById('control-risk').textContent = this.currentControl.risk;

        // Status
        document.getElementById('control-status').value = this.currentControl.status;

        // Test of Design
        const testOfDesign = document.getElementById('test-of-design');
        testOfDesign.innerHTML = this.renderTestSteps(this.currentControl.test_of_design);

        // Test of Effectiveness
        const testOfEffectiveness = document.getElementById('test-of-effectiveness');
        testOfEffectiveness.innerHTML = this.renderTestSteps(this.currentControl.test_of_effectiveness);

        // Custom Testing Steps
        const customSteps = document.getElementById('custom-testing-steps');
        if (this.currentControl.custom_testing_steps && this.currentControl.custom_testing_steps.length > 0) {
            customSteps.innerHTML = this.currentControl.custom_testing_steps.map(step => `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-medium text-gray-900">${step.technology}</h5>
                            <p class="text-sm text-gray-600">${step.steps}</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <p class="text-sm font-medium text-gray-700 mb-1">${step.automation_artifact.description}</p>
                        <div class="bg-gray-900 text-gray-100 rounded p-3 text-sm font-mono relative">
                            <pre class="whitespace-pre-wrap">${step.automation_artifact.snippet}</pre>
                            <button onclick="app.copyToClipboard('${step.automation_artifact.snippet.replace(/'/g, "\\'")}')" class="absolute top-2 right-2 text-gray-400 hover:text-white">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            document.getElementById('custom-testing-section').style.display = 'block';
        } else {
            document.getElementById('custom-testing-section').style.display = 'none';
        }

        // Update workflow buttons
        this.updateWorkflowButtons();
    }

    renderTestSteps(test) {
        if (!test || !test.steps) return '<p class="text-gray-500">No test steps defined</p>';
        
        return `
            <div class="space-y-2">
                <div>
                    <h5 class="text-sm font-medium text-gray-700">Steps:</h5>
                    <ul class="list-disc list-inside text-sm text-gray-600 space-y-1">
                        ${test.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h5 class="text-sm font-medium text-gray-700">Evidence:</h5>
                    <p class="text-sm text-gray-600">${test.evidence.join(', ')}</p>
                </div>
            </div>
        `;
    }

    updateWorkflowButtons() {
        const buttonsContainer = document.getElementById('workflow-buttons');
        const status = this.currentControl.status;

        let buttons = '';
        
        switch (status) {
            case 'Not Started':
                buttons = '<button onclick="app.updateControlStatus(\'In Progress\')" class="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700">Start Working</button>';
                break;
            case 'In Progress':
                buttons = '<button onclick="app.updateControlStatus(\'Pending Review\')" class="w-full bg-yellow-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-yellow-700">Submit for Review</button>';
                break;
            case 'Pending Review':
                buttons = '<button onclick="app.updateControlStatus(\'Approved\')" class="w-full bg-green-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-green-700">Approve</button>';
                break;
        }

        buttonsContainer.innerHTML = buttons || '';
    }

    async updateControlStatus(newStatus) {
        if (!this.currentControl) return;

        this.currentControl.status = newStatus;
        document.getElementById('control-status').value = newStatus;

        await this.saveControl(this.currentControl);
        this.updateDashboard();
        this.updateWorkflowButtons();
        
        this.showNotification(`Control status updated to ${newStatus}`, 'success');
    }

    async generateDocument(type) {
        if (!this.currentControl) return;

        this.currentDocumentType = type;
        this.showLoading(true);

        try {
            const requestData = {
                control_area: this.currentControl.control_area,
                tech_stack: this.currentPlan?.tech_stack || []
            };

            const endpoint = type === 'policy' ? '/api/generate-policy' : '/api/generate-procedure';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                this.showPolicyModal(type, data.content);
            } else {
                this.showNotification(`Failed to generate ${type}: ` + data.error, 'error');
            }
        } catch (error) {
            this.showNotification(`Error generating ${type}: ` + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showPolicyModal(type, content) {
        const title = type === 'policy' ? 'Generated Policy' : 'Generated Procedure';
        document.getElementById('policy-modal-title').textContent = title;
        document.getElementById('policy-content').textContent = content;
        document.getElementById('policy-modal').classList.remove('hidden');
    }

    hidePolicyModal() {
        document.getElementById('policy-modal').classList.add('hidden');
        document.getElementById('policy-content').textContent = '';
    }

    async savePolicy() {
        if (!this.currentControl || !this.currentDocumentType) return;

        const content = document.getElementById('policy-content').textContent;
        
        try {
            const requestData = {
                title: `${this.currentControl.control_area} ${this.currentDocumentType === 'policy' ? 'Policy' : 'Procedure'}`,
                content: content,
                type: this.currentDocumentType,
                control_id: this.currentControl.control_id
            };

            const response = await fetch('/api/save-policy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                this.hidePolicyModal();
                this.showNotification(`${this.currentDocumentType.charAt(0).toUpperCase() + this.currentDocumentType.slice(1)} saved successfully!`, 'success');
                
                // Update linked documents
                this.updateLinkedDocuments();
            } else {
                this.showNotification('Failed to save document: ' + data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error saving document: ' + error.message, 'error');
        }
    }

    updateLinkedDocuments() {
        // This would typically fetch linked documents from the backend
        // For now, we'll just show a placeholder
        const container = document.getElementById('linked-documents');
        container.innerHTML = `
            <div class="text-sm">
                <p class="text-green-600 font-medium">✓ Policy Linked</p>
                <p class="text-gray-500 text-xs">Document saved to policy hub</p>
            </div>
        `;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copied to clipboard!', 'success');
        }).catch(err => {
            this.showNotification('Failed to copy text', 'error');
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const app = new CompliancePlatform();

