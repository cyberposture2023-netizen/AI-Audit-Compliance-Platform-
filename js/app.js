// Enhanced Compliance Platform JavaScript
class CompliancePlatform {
    constructor() {
        this.currentTab = 'intake';
        this.controls = [];
        this.assessments = [];
        this.auditPlans = [];
        this.currentControl = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.showTab('intake');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.showTab(tab);
            });
        });

        // Form submissions
        document.getElementById('intakeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateAssessment();
        });

        document.getElementById('generateAssessmentBtn').addEventListener('click', () => {
            this.showTab('intake');
        });

        document.getElementById('generateAuditPlanBtn').addEventListener('click', () => {
            this.generateAuditPlan();
        });

        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadControls(),
                this.loadAssessments(),
                this.loadAuditPlans()
            ]);
        } catch (error) {
            this.showNotification('Error loading data', 'error');
        }
    }

    async loadControls() {
        const response = await fetch('/api/controls');
        const data = await response.json();
        this.controls = data.controls || [];
        this.updateControlsDashboard();
    }

    async loadAssessments() {
        const response = await fetch('/api/assessments');
        const data = await response.json();
        this.assessments = data.assessments || [];
    }

    async loadAuditPlans() {
        const response = await fetch('/api/audit-plans');
        const data = await response.json();
        this.auditPlans = data.audit_plans || [];
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.remove('hidden');
            targetTab.classList.add('active');
        }

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-500');
            btn.classList.add('text-gray-500');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
            activeBtn.classList.remove('text-gray-500');
        }

        this.currentTab = tabName;

        // Load tab-specific content
        switch(tabName) {
            case 'controls':
                this.updateControlsDashboard();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'assessment':
                this.loadAssessmentsView();
                break;
            case 'audit-plan':
                this.loadAuditPlansView();
                break;
        }
    }

    async generateAssessment() {
        const formData = new FormData(document.getElementById('intakeForm'));
        const infrastructureComponents = [];
        
        document.querySelectorAll('input[name="infrastructure_components"]:checked').forEach(checkbox => {
            infrastructureComponents.push(checkbox.value);
        });

        const assessmentData = {
            company_size: formData.get('company_size'),
            industry: formData.get('industry'),
            framework: formData.get('framework'),
            environment: formData.get('environment'),
            infrastructure_components: infrastructureComponents
        };

        try {
            this.showNotification('Generating assessment...', 'info');
            
            const response = await fetch('/api/assessments/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            });

            const assessment = await response.json();
            
            this.assessments.push(assessment);
            this.controls = this.controls.concat(assessment.controls || []);
            
            this.showNotification('Assessment generated successfully!', 'success');
            this.showTab('assessment');
            this.loadAssessmentsView();
            
        } catch (error) {
            this.showNotification('Failed to generate assessment', 'error');
        }
    }

    loadAssessmentsView() {
        const content = document.getElementById('assessmentContent');
        if (!content) return;

        if (this.assessments.length === 0) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500 mb-4">No assessments generated yet</p>
                    <button onclick="platform.showTab('intake')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                        Create First Assessment
                    </button>
                </div>
            `;
            return;
        }

        const latestAssessment = this.assessments[this.assessments.length - 1];
        
        content.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-xl font-semibold">${latestAssessment.name}</h3>
                        <p class="text-gray-600">Generated: ${new Date(latestAssessment.generated_date).toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-blue-600">${latestAssessment.compliance_score}%</div>
                        <div class="text-sm text-gray-600">Compliance Score</div>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="text-2xl font-bold">${latestAssessment.summary.total_controls}</div>
                        <div class="text-sm text-gray-600">Total Controls</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${latestAssessment.summary.automated_controls}</div>
                        <div class="text-sm text-green-600">Automated</div>
                    </div>
                    <div class="text-center p-4 bg-yellow-50 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">${latestAssessment.summary.manual_controls}</div>
                        <div class="text-sm text-yellow-600">Manual</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${latestAssessment.summary.hybrid_controls}</div>
                        <div class="text-sm text-blue-600">Hybrid</div>
                    </div>
                </div>

                <h4 class="font-semibold mb-4">Infrastructure Components:</h4>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${latestAssessment.infrastructure_components.map(comp => 
                        `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${comp}</span>`
                    ).join('')}
                </div>

                <h4 class="font-semibold mb-4">Generated Controls:</h4>
                <div class="space-y-3">
                    ${(latestAssessment.controls || []).slice(0, 5).map(control => `
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h5 class="font-medium">${control.name}</h5>
                                    <p class="text-sm text-gray-600">${control.description}</p>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                        control.risk === 'High' ? 'bg-red-100 text-red-800' :
                                        control.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }">${control.risk} Risk</span>
                                    <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">${control.control_type}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${(latestAssessment.controls || []).length > 5 ? `
                    <div class="text-center mt-4">
                        <button onclick="platform.showTab('controls')" class="text-blue-500 hover:text-blue-700">
                            View all ${latestAssessment.controls.length} controls â†’
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async generateAuditPlan() {
        if (this.assessments.length === 0) {
            this.showNotification('Please generate an assessment first', 'warning');
            return;
        }

        const latestAssessment = this.assessments[this.assessments.length - 1];
        
        try {
            this.showNotification('Generating audit plan...', 'info');
            
            const response = await fetch('/api/audit-plans/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assessment_id: latestAssessment.id })
            });

            const auditPlan = await response.json();
            this.auditPlans.push(auditPlan);
            
            this.showNotification('Audit plan generated successfully!', 'success');
            this.loadAuditPlansView();
            
        } catch (error) {
            this.showNotification('Failed to generate audit plan', 'error');
        }
    }

    loadAuditPlansView() {
        const content = document.getElementById('auditPlanContent');
        if (!content) return;

        if (this.auditPlans.length === 0) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500 mb-4">No audit plans generated yet</p>
                    <button onclick="platform.generateAuditPlan()" class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">
                        Generate Audit Plan
                    </button>
                </div>
            `;
            return;
        }

        const latestAuditPlan = this.auditPlans[this.auditPlans.length - 1];
        
        content.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-xl font-semibold">${latestAuditPlan.name}</h3>
                        <p class="text-gray-600">Framework: ${latestAuditPlan.framework}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-semibold">${latestAuditPlan.timeline.start_date} to ${latestAuditPlan.timeline.end_date}</div>
                        <div class="text-sm text-gray-600">Audit Timeline</div>
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Audit Scope:</h4>
                    <p class="text-gray-700">${latestAuditPlan.audit_scope}</p>
                </div>

                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Methodology:</h4>
                    <p class="text-gray-700">${latestAuditPlan.methodology}</p>
                </div>

                <h4 class="font-semibold mb-4">Control Testing Plan:</h4>
                <div class="space-y-4">
                    ${(latestAuditPlan.controls || []).slice(0, 5).map(control => `
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h5 class="font-medium">${control.control_name}</h5>
                                <span class="px-2 py-1 text-xs rounded-full ${
                                    control.risk_level === 'High' ? 'bg-red-100 text-red-800' :
                                    control.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }">${control.risk_level} Risk</span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <strong>Test Plan:</strong>
                                    <p class="text-gray-600">${control.test_plan}</p>
                                </div>
                                <div>
                                    <strong>Evidence Required:</strong>
                                    <p class="text-gray-600">${control.evidence_required.join(', ')}</p>
                                </div>
                            </div>
                            <div class="mt-2 text-sm text-gray-500">
                                Due: ${control.due_date} | Responsible: ${control.responsible_auditor}
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${(latestAuditPlan.controls || []).length > 5 ? `
                    <div class="text-center mt-4">
                        <button onclick="platform.showTab('controls')" class="text-purple-500 hover:text-purple-700">
                            View all ${latestAuditPlan.controls.length} control tests â†’
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateControlsDashboard() {
        this.updateControlsStats();
        this.updateControlsTable();
    }

    updateControlsStats() {
        const total = this.controls.length;
        const completed = this.controls.filter(c => c.status === 'completed').length;
        const inProgress = this.controls.filter(c => c.status === 'in_progress').length;
        const notStarted = this.controls.filter(c => c.status === 'not_started' || !c.status).length;

        document.getElementById('totalControls').textContent = total;
        document.getElementById('completedControls').textContent = completed;
        document.getElementById('inProgressControls').textContent = inProgress;
        document.getElementById('notStartedControls').textContent = notStarted;
    }

    updateControlsTable() {
        const tbody = document.getElementById('controlsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.controls.map(control => `
            <tr class="hover:bg-gray-50" onclick="platform.showControlDetails('${control.id}')" style="cursor: pointer;">
                <td class="border border-gray-300 px-4 py-2">${control.id}</td>
                <td class="border border-gray-300 px-4 py-2">
                    <div class="font-medium">${control.name}</div>
                    <div class="text-sm text-gray-600">${control.framework_reference}</div>
                </td>
                <td class="border border-gray-300 px-4 py-2">
                    <span class="px-2 py-1 text-xs rounded-full ${
                        control.control_type === 'Automatic' ? 'bg-green-100 text-green-800' :
                        control.control_type === 'Manual' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                    }">${control.control_type}</span>
                </td>
                <td class="border border-gray-300 px-4 py-2">
                    <span class="px-2 py-1 text-xs rounded-full ${
                        control.risk === 'High' ? 'bg-red-100 text-red-800' :
                        control.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }">${control.risk}</span>
                </td>
                <td class="border border-gray-300 px-4 py-2">
                    <span class="px-2 py-1 text-xs rounded-full ${
                        control.status === 'completed' ? 'bg-green-100 text-green-800' :
                        control.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }">${control.status || 'not_started'}</span>
                </td>
                <td class="border border-gray-300 px-4 py-2">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${control.progress || 0}%"></div>
                    </div>
                    <div class="text-xs text-gray-600 mt-1">${control.progress || 0}%</div>
                </td>
                <td class="border border-gray-300 px-4 py-2">
                    <button onclick="event.stopPropagation(); platform.showControlDetails('${control.id}')" 
                            class="text-blue-500 hover:text-blue-700 text-sm">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showControlDetails(controlId) {
        const control = this.controls.find(c => c.id === controlId);
        if (!control) return;

        this.currentControl = control;
        this.showTab('control-details');
        
        const content = document.getElementById('controlDetailsContent');
        content.innerHTML = `
            <div class="space-y-6">
                <!-- Control Header -->
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-semibold">${control.name}</h3>
                        <p class="text-gray-600">${control.framework_reference}</p>
                    </div>
                    <div class="flex space-x-2">
                        <span class="px-3 py-1 rounded-full text-sm ${
                            control.risk === 'High' ? 'bg-red-100 text-red-800' :
                            control.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }">${control.risk} Risk</span>
                        <span class="px-3 py-1 rounded-full text-sm ${
                            control.control_type === 'Automatic' ? 'bg-green-100 text-green-800' :
                            control.control_type === 'Manual' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                        }">${control.control_type}</span>
                    </div>
                </div>

                <!-- Control Information Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Left Column -->
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold mb-2">Description</h4>
                            <p class="text-gray-700">${control.description}</p>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold mb-2">Test Plan</h4>
                            <p class="text-gray-700">${control.test_plan}</p>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold mb-2">Evidence Required</h4>
                            <div class="space-y-2">
                                ${control.evidence_required ? control.evidence_required.map(evidence => `
                                    <div class="flex items-center space-x-2">
                                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        <span>${evidence}</span>
                                    </div>
                                `).join('') : '<p class="text-gray-500">No specific evidence requirements</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold mb-2">Infrastructure Components</h4>
                            <div class="flex flex-wrap gap-2">
                                ${control.infrastructure_components ? control.infrastructure_components.map(comp => `
                                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${comp}</span>
                                `).join('') : '<span class="text-gray-500">No specific components</span>'}
                            </div>
                        </div>

                        ${control.api_code ? `
                        <div>
                            <h4 class="font-semibold mb-2">API Code</h4>
                            <div class="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
                                ${control.api_code}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Progress Tracking -->
                        <div>
                            <h4 class="font-semibold mb-2">Implementation Progress</h4>
                            <div class="space-y-4">
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm font-medium">Progress</span>
                                        <span class="text-sm">${control.progress || 0}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: ${control.progress || 0}%"></div>
                                    </div>
                                </div>
                                
                                <div class="flex space-x-2">
                                    <button onclick="platform.updateControlProgress('${control.id}', 0)" 
                                            class="flex-1 bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm">
                                        Not Started
                                    </button>
                                    <button onclick="platform.updateControlProgress('${control.id}', 50)" 
                                            class="flex-1 bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 text-sm">
                                        In Progress
                                    </button>
                                    <button onclick="platform.updateControlProgress('${control.id}', 100)" 
                                            class="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-sm">
                                        Complete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="border-t pt-6">
                    <h4 class="font-semibold mb-4">Control Actions</h4>
                    <div class="flex flex-wrap gap-4">
                        <button onclick="platform.generatePolicy('${control.id}')" 
                                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            Generate Policy
                        </button>
                        <button onclick="platform.generateProcedure('${control.id}')" 
                                class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                            Generate Procedure
                        </button>
                        <button onclick="platform.uploadEvidence('${control.id}')" 
                                class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                            Upload Evidence
                        </button>
                        <button onclick="platform.submitToAudit('${control.id}')" 
                                class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                            Submit to Audit
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async updateControlProgress(controlId, progress) {
        const control = this.controls.find(c => c.id === controlId);
        if (!control) return;

        control.progress = progress;
        control.status = progress === 0 ? 'not_started' : 
                        progress === 100 ? 'completed' : 'in_progress';

        try {
            await fetch('/api/controls/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: controlId,
                    progress: progress,
                    status: control.status
                })
            });

            this.updateControlsDashboard();
            this.showControlDetails(controlId);
            this.showNotification('Progress updated successfully', 'success');
            
        } catch (error) {
            this.showNotification('Failed to update progress', 'error');
        }
    }

    generatePolicy(controlId) {
        const control = this.controls.find(c => c.id === controlId);
        if (!control) return;

        this.showNotification("Generating policy for " + control.name + "...", 'info');
        setTimeout(() => {
            this.showNotification('Policy generated successfully', 'success');
        }, 2000);
    }

    generateProcedure(controlId) {
        const control = this.controls.find(c => c.id === controlId);
        if (!control) return;

        this.showNotification("Generating procedure for " + control.name + "...", 'info');
        setTimeout(() => {
            this.showNotification('Procedure generated successfully', 'success');
        }, 2000);
    }

    uploadEvidence(controlId) {
        const control = this.controls.find(c => c.id === controlId);
        if (!control) return;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.txt';
        
        fileInput.onchange = (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.showNotification("Uploaded " + files.length + " file(s) for " + control.name, 'success');
            }
        };
        
        fileInput.click();
    }

    submitToAudit(controlId) {
        const control = this.controls.find(c => c.id === controlId);
        if (!control) return;

        this.showNotification("Submitted " + control.name + " to audit team", 'success');
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const timeframe = 'Q1 2025';

        try {
            this.showNotification('Generating report...', 'info');
            
            const response = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: reportType,
                    timeframe: timeframe
                })
            });

            const report = await response.json();
            this.displayReport(report);
            this.showNotification('Report generated successfully', 'success');
            
        } catch (error) {
            this.showNotification('Failed to generate report', 'error');
        }
    }

    displayReport(report) {
        const content = document.getElementById('reportsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-semibold">${report.name}</h3>
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Generated: ${new Date(report.generated_date).toLocaleDateString()}
                    </span>
                </div>
                
                <div class="grid grid-cols-4 gap-4 mb-6">
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${report.compliance_score}%</div>
                        <div class="text-sm text-green-800">Compliance Score</div>
                    </div>
                    <div class="text-center p-4 bg-red-50 rounded-lg">
                        <div class="text-2xl font-bold text-red-600">${report.high_risk_controls}</div>
                        <div class="text-sm text-red-800">High Risk</div>
                    </div>
                    <div class="text-center p-4 bg-yellow-50 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">${report.medium_risk_controls}</div>
                        <div class="text-sm text-yellow-800">Medium Risk</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${report.low_risk_controls}</div>
                        <div class="text-sm text-blue-800">Low Risk</div>
                    </div>
                </div>

                ${report.sections.map(section => `
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-2">${section.title}</h4>
                        <p class="text-gray-700">${section.content}</p>
                    </div>
                `).join('')}

                <div class="mt-6 flex justify-end space-x-4">
                    <button onclick="platform.exportReport('${report.id}', 'pdf')" 
                            class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        Export PDF
                    </button>
                    <button onclick="platform.exportReport('${report.id}', 'excel')" 
                            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                        Export Excel
                    </button>
                </div>
            </div>
        `;
    }

    async loadReports() {
        try {
            const response = await fetch('/api/reports');
            const data = await response.json();
            
            if (data.compliance_reports && data.compliance_reports.length > 0) {
                this.displayReport(data.compliance_reports[0]);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    exportReport(reportId, format) {
        this.showNotification("Exporting report as " + format.toUpperCase() + "...", 'info');
        setTimeout(() => {
            this.showNotification("Report exported successfully as " + format.toUpperCase(), 'success');
        }, 1500);
    }

    exportData() {
        const data = {
            assessments: this.assessments,
            controls: this.controls,
            audit_plans: this.auditPlans,
            export_date: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "compliance-data-" + new Date().toISOString().split('T')[0] + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        const iconEl = document.getElementById('notificationIcon');

        if (!notification || !messageEl || !iconEl) return;

        const styles = {
            success: { bg: 'bg-green-500', icon: 'âœ“' },
            error: { bg: 'bg-red-500', icon: 'âœ—' },
            warning: { bg: 'bg-yellow-500', icon: 'âš ' },
            info: { bg: 'bg-blue-500', icon: 'â„¹' }
        };

        const style = styles[type] || styles.info;

        notification.className = "fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white " + style.bg + " z-50";
        iconEl.textContent = style.icon;
        messageEl.textContent = message;

        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.platform = new CompliancePlatform();
});
