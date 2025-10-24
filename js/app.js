// Final Compliance Platform JavaScript - Complete Working Version
class CompliancePlatform {
    constructor() {
        this.currentPlan = null;
        this.controls = [];
        this.currentControl = null;
        this.currentDocumentType = null;
        this.init();
    }

    init() {
        console.log('Initializing Compliance Platform...');
        this.bindEvents();
        this.setupFrameworkSelection();
        this.showTab('assessment'); // Start with Assessment tab
    }

    setupFrameworkSelection() {
        const options = document.querySelectorAll('.framework-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                document.getElementById('framework').value = option.dataset.value;
            });
        });
    }

    bindEvents() {
        // Tab navigation
        document.getElementById('tab-assessment').addEventListener('click', () => this.showTab('assessment'));
        document.getElementById('tab-audit-plan').addEventListener('click', () => this.showTab('audit-plan'));
        document.getElementById('tab-dashboard').addEventListener('click', () => this.showTab('dashboard'));
        document.getElementById('back-to-dashboard').addEventListener('click', () => this.showTab('dashboard'));

        // Form submission
        document.getElementById('audit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateAuditPlan(e);
        });

        // Filters
        document.getElementById('filter-status').addEventListener('change', () => this.filterControls());
        document.getElementById('filter-risk').addEventListener('change', () => this.filterControls());
        document.getElementById('search-controls').addEventListener('input', () => this.filterControls());

        // Modal events
        document.getElementById('close-policy-modal').addEventListener('click', () => this.hidePolicyModal());
        document.getElementById('cancel-policy').addEventListener('click', () => this.hidePolicyModal());
        document.getElementById('save-policy').addEventListener('click', () => this.savePolicy());

        console.log('All events bound successfully');
    }

    showTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Hide all contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('tab-active');
            tab.classList.add('tab-inactive');
        });

        // Show selected
        const content = document.getElementById(`content-${tabName}`);
        const tab = document.getElementById(`tab-${tabName}`);
        
        if (content) content.style.display = 'block';
        if (tab) {
            tab.classList.remove('tab-inactive');
            tab.classList.add('tab-active');
        }

        // Update content based on tab
        if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'audit-plan') {
            this.updateAuditPlanView();
        }
    }

    async generateAuditPlan(e) {
        console.log('Starting audit plan generation...');
        
        const formData = new FormData(e.target);
        const techStack = formData.getAll('techStack');
        
        const requestData = {
            framework: formData.get('framework'),
            industry: formData.get('industry'),
            tech_stack: techStack
        };

        console.log('Sending request:', requestData);
        this.showLoading(true);

        try {
            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data);

            if (data.success) {
                this.currentPlan = data.plan;
                this.controls = data.controls;
                console.log('Generated controls:', this.controls);
                
                // Save controls
                for (const control of this.controls) {
                    await this.saveControl(control);
                }
                
                this.updateDashboard();
                this.updateAuditPlanView();
                this.showTab('audit-plan'); // Switch to Audit Plan tab
                this.showNotification('Audit plan generated successfully!', 'success');
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.showNotification('Failed to generate audit plan: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateAuditPlanView() {
        const content = document.getElementById('audit-plan-content');
        
        if (!this.currentPlan) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-file-alt text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No Audit Plan Generated</h3>
                    <p class="text-gray-500">Go to the Assessment tab to generate your audit plan</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="space-y-6">
                <div class="card p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Plan Overview</h4>
                    <table class="control-table">
                        <tr>
                            <td style="width: 30%; font-weight: 600;">Framework</td>
                            <td>${this.currentPlan.framework}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Industry</td>
                            <td>${this.currentPlan.industry}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Technology Stack</td>
                            <td>${this.currentPlan.tech_stack.join(', ')}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Total Controls</td>
                            <td>${this.currentPlan.total_controls}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">High Risk Controls</td>
                            <td>${this.currentPlan.high_risk_count}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Generated</td>
                            <td>${new Date().toLocaleDateString()}</td>
                        </tr>
                    </table>
                </div>

                <div class="card p-6">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Generated Controls</h4>
                    <p class="text-gray-600 mb-4">Your audit plan includes ${this.controls.length} controls across different areas.</p>
                    <button onclick="app.showTab('dashboard')" class="btn btn-primary">
                        <i class="fas fa-list-check mr-2"></i>View All Controls
                    </button>
                </div>
            </div>
        `;
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
            const result = await response.json();
            console.log('Saved control:', control.control_id, result);
            return result;
        } catch (error) {
            console.error('Error saving control:', error);
        }
    }

    updateDashboard() {
        console.log('Updating dashboard with controls:', this.controls);
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
        
        if (!this.controls || this.controls.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No controls generated yet. Create an audit plan to get started!</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        const filteredControls = this.getFilteredControls();
        console.log('Rendering filtered controls:', filteredControls);

        filteredControls.forEach(control => {
            const row = document.createElement('tr');
            
            const statusColor = this.getStatusColor(control.status);
            const riskColor = this.getRiskColor(control.risk_rating);

            row.innerHTML = `
                <td class="font-semibold text-gray-900">${control.control_id}</td>
                <td class="text-gray-600">${control.control_description}</td>
                <td><span class="badge ${statusColor}">${control.status}</span></td>
                <td><span class="badge ${riskColor}">${control.risk_rating}</span></td>
                <td class="text-gray-600">${control.control_type}</td>
                <td>
                    <button onclick="app.openControl('${control.control_id}')" class="text-blue-600 hover:text-blue-800 font-medium">
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
        const searchFilter = document.getElementById('search-controls').value.toLowerCase();

        return this.controls.filter(control => {
            const matchesStatus = !statusFilter || control.status === statusFilter;
            const matchesRisk = !riskFilter || control.risk_rating === riskFilter;
            const matchesSearch = !searchFilter || 
                control.control_id.toLowerCase().includes(searchFilter) ||
                control.control_description.toLowerCase().includes(searchFilter) ||
                control.control_area.toLowerCase().includes(searchFilter);

            return matchesStatus && matchesRisk && matchesSearch;
        });
    }

    filterControls() {
        this.renderControlsTable();
    }

    getStatusColor(status) {
        const colors = {
            'Not Started': 'badge-gray',
            'In Progress': 'badge-warning',
            'Pending Review': 'badge-info',
            'Approved': 'badge-success'
        };
        return colors[status] || 'badge-gray';
    }

    getRiskColor(risk) {
        const colors = {
            'High': 'badge-danger',
            'Medium': 'badge-warning',
            'Low': 'badge-success'
        };
        return colors[risk] || 'badge-gray';
    }

    openControl(controlId) {
        console.log('Opening control:', controlId);
        this.currentControl = this.controls.find(c => c.control_id === controlId);
        
        if (!this.currentControl) {
            console.error('Control not found:', controlId);
            return;
        }

        this.populateControlView();
        this.showTab('control');
    }

    populateControlView() {
        if (!this.currentControl) return;

        // Basic info
        document.getElementById('control-view-title').textContent = this.currentControl.control_id;
        document.getElementById('control-subtitle').textContent = this.currentControl.control_area;
        document.getElementById('control-id').textContent = this.currentControl.control_id;
        document.getElementById('control-area').textContent = this.currentControl.control_area;
        document.getElementById('control-type').textContent = this.currentControl.control_type;
        document.getElementById('control-risk-rating').textContent = this.currentControl.risk_rating;
        document.getElementById('control-description').textContent = this.currentControl.control_description;
        document.getElementById('control-risk').textContent = this.currentControl.risk;

        // Test of Design
        if (this.currentControl.test_of_design) {
            document.getElementById('test-of-design-steps').textContent = 
                this.currentControl.test_of_design.steps ? this.currentControl.test_of_design.steps.join('; ') : 'No steps defined';
            document.getElementById('test-of-design-evidence').textContent = 
                this.currentControl.test_of_design.evidence ? this.currentControl.test_of_design.evidence.join(', ') : 'No evidence defined';
        }

        // Test of Effectiveness
        if (this.currentControl.test_of_effectiveness) {
            document.getElementById('test-of-effectiveness-steps').textContent = 
                this.currentControl.test_of_effectiveness.steps ? this.currentControl.test_of_effectiveness.steps.join('; ') : 'No steps defined';
            document.getElementById('test-of-effectiveness-evidence').textContent = 
                this.currentControl.test_of_effectiveness.evidence ? this.currentControl.test_of_effectiveness.evidence.join(', ') : 'No evidence defined';
        }

        // Evidence table
        this.populateEvidenceTable();

        // Status
        document.getElementById('control-status').value = this.currentControl.status;

        // Bind AI helper
        this.bindAIHelper();
    }

    populateEvidenceTable() {
        const tbody = document.getElementById('evidence-table-body');
        tbody.innerHTML = '';

        const allEvidence = [];
        
        // Collect evidence from test of design
        if (this.currentControl.test_of_design && this.currentControl.test_of_design.evidence) {
            this.currentControl.test_of_design.evidence.forEach(evidence => {
                allEvidence.push({
                    type: 'Design Evidence',
                    description: evidence,
                    status: 'Required'
                });
            });
        }

        // Collect evidence from test of effectiveness
        if (this.currentControl.test_of_effectiveness && this.currentControl.test_of_effectiveness.evidence) {
            this.currentControl.test_of_effectiveness.evidence.forEach(evidence => {
                allEvidence.push({
                    type: 'Effectiveness Evidence',
                    description: evidence,
                    status: 'Required'
                });
            });
        }

        if (allEvidence.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-500 py-4">No evidence requirements defined</td></tr>';
            return;
        }

        allEvidence.forEach(evidence => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${evidence.type}</td>
                <td>${evidence.description}</td>
                <td><span class="badge badge-warning">${evidence.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    bindAIHelper() {
        const policyBtn = document.getElementById('generate-policy');
        const procedureBtn = document.getElementById('generate-procedure');
        const statusSelect = document.getElementById('control-status');

        // Remove existing listeners
        const newPolicyBtn = policyBtn.cloneNode(true);
        const newProcedureBtn = procedureBtn.cloneNode(true);
        const newStatusSelect = statusSelect.cloneNode(true);

        policyBtn.parentNode.replaceChild(newPolicyBtn, policyBtn);
        procedureBtn.parentNode.replaceChild(newProcedureBtn, procedureBtn);
        statusSelect.parentNode.replaceChild(newStatusSelect, statusSelect);

        // Add new listeners
        newPolicyBtn.addEventListener('click', () => this.generateDocument('policy'));
        newProcedureBtn.addEventListener('click', () => this.generateDocument('procedure'));
        newStatusSelect.addEventListener('change', (e) => this.updateControlStatus(e.target.value));
    }

    async updateControlStatus(newStatus) {
        if (!this.currentControl) return;

        this.currentControl.status = newStatus;
        await this.saveControl(this.currentControl);
        this.updateDashboard();
        this.showNotification(`Status updated to ${newStatus}`, 'success');
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
                throw new Error(data.error || 'Generation failed');
            }
        } catch (error) {
            this.showNotification(`Failed to generate ${type}: ` + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showPolicyModal(type, content) {
        const title = type === 'policy' ? 'Generated Policy' : 'Generated Procedure';
        document.getElementById('policy-modal-title').textContent = title;
        document.getElementById('policy-content').textContent = content;
        document.getElementById('policy-modal').style.display = 'flex';
    }

    hidePolicyModal() {
        document.getElementById('policy-modal').style.display = 'none';
    }

    async savePolicy() {
        if (!this.currentControl || !this.currentDocumentType) return;

        const content = document.getElementById('policy-content').textContent;
        
        try {
            const requestData = {
                title: `${this.currentControl.control_area} ${this.currentDocumentType}`,
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
                this.showNotification(`${this.currentDocumentType} saved successfully!`, 'success');
            } else {
                throw new Error(data.error || 'Save failed');
            }
        } catch (error) {
            this.showNotification('Failed to save: ' + error.message, 'error');
        }
    }

    showLoading(show) {
        document.getElementById('loading-spinner').style.display = show ? 'flex' : 'none';
    }

    showNotification(message, type) {
        // Simple notification implementation
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new CompliancePlatform();
    });
} else {
    window.app = new CompliancePlatform();
}
