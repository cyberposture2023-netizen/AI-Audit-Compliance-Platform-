# Compliance Platform Patch-2: Advanced Features + GitHub Integration
# FIXED VERSION - Handles missing directories and replacement errors
# Run from: C:\compliance-platform-opensource\

Write-Host "=== COMPLIANCE PLATFORM PATCH-2 DEPLOYMENT ===" -ForegroundColor Green

$PROJECT_ROOT = "C:\compliance-platform-opensource"
$REPO_URL = "https://github.com/cyberposture2023-netizen/AI-Audit-Compliance-Platform-.git"
$BACKUP_DIR = "$PROJECT_ROOT\backup_patch_2_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Step 1: Git setup
Write-Host "`n1. INITIALIZING GITHUB..." -ForegroundColor Cyan
try {
    git --version | Out-Null
    Write-Host "Git is installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git not installed" -ForegroundColor Red
    exit 1
}

Set-Location $PROJECT_ROOT
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git..." -ForegroundColor Yellow
    git init
    git remote add origin $REPO_URL
}

# Step 2: Backup and create directories
Write-Host "`n2. CREATING BACKUP AND DIRECTORIES..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
Copy-Item "$PROJECT_ROOT\*" $BACKUP_DIR -Recurse -Force -ErrorAction SilentlyContinue

# Create required directories
$directories = @("services", "js", "uploads", "uploads/evidence", "exports", "data")
foreach ($dir in $directories) {
    $fullPath = "$PROJECT_ROOT\$dir"
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

Write-Host "Backup created: $BACKUP_DIR" -ForegroundColor Green

# Step 3: Create Evidence Manager
Write-Host "`n3. CREATING EVIDENCE MANAGER..." -ForegroundColor Cyan

$evidenceManager = @"
import os
import json
from datetime import datetime
from typing import Dict, List, Optional

class EvidenceManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.evidence_file = os.path.join(data_dir, "evidence.json")
        self.uploads_dir = "uploads/evidence"
        self._ensure_directories()
        self.load_evidence()
    
    def _ensure_directories(self):
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.uploads_dir, exist_ok=True)
    
    def load_evidence(self):
        if os.path.exists(self.evidence_file):
            with open(self.evidence_file, 'r') as f:
                self.evidence = json.load(f)
        else:
            self.evidence = {}
    
    def save_evidence(self):
        with open(self.evidence_file, 'w') as f:
            json.dump(self.evidence, f, indent=2)
    
    def add_evidence(self, control_id: str, filename: str, file_path: str, file_type: str, uploaded_by: str) -> Dict:
        evidence_id = f"evid_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        evidence_record = {
            "id": evidence_id, "control_id": control_id, "filename": filename,
            "file_path": file_path, "file_type": file_type, "uploaded_by": uploaded_by,
            "upload_date": datetime.now().isoformat(), "status": "pending_review"
        }
        if control_id not in self.evidence:
            self.evidence[control_id] = []
        self.evidence[control_id].append(evidence_record)
        self.save_evidence()
        return evidence_record
    
    def get_evidence_for_control(self, control_id: str) -> List[Dict]:
        return self.evidence.get(control_id, [])
    
    def get_all_evidence(self) -> Dict:
        return self.evidence
    
    def update_evidence_status(self, control_id: str, evidence_id: str, status: str) -> bool:
        if control_id in self.evidence:
            for evidence in self.evidence[control_id]:
                if evidence["id"] == evidence_id:
                    evidence["status"] = status
                    evidence["review_date"] = datetime.now().isoformat()
                    self.save_evidence()
                    return True
        return False
    
    def get_evidence_stats(self) -> Dict:
        total_evidence = 0
        approved_evidence = 0
        pending_evidence = 0
        for control_id, evidence_list in self.evidence.items():
            total_evidence += len(evidence_list)
            for evidence in evidence_list:
                if evidence.get("status") == "approved":
                    approved_evidence += 1
                elif evidence.get("status") == "pending_review":
                    pending_evidence += 1
        return {
            "total_evidence": total_evidence, "approved_evidence": approved_evidence,
            "pending_evidence": pending_evidence, "approval_rate": (approved_evidence / total_evidence * 100) if total_evidence > 0 else 0
        }
"@

Set-Content -Path "$PROJECT_ROOT\services\evidence_manager.py" -Value $evidenceManager
Write-Host "Evidence Manager created" -ForegroundColor Green

# Step 4: Create Analytics Service
Write-Host "`n4. CREATING ANALYTICS SERVICE..." -ForegroundColor Cyan

$analyticsService = @"
import json
import os
from datetime import datetime
from typing import Dict, List

class AnalyticsService:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.controls_file = os.path.join(data_dir, "controls.json")
    
    def load_controls(self) -> List[Dict]:
        if os.path.exists(self.controls_file):
            with open(self.controls_file, 'r') as f:
                return json.load(f)
        return []
    
    def get_compliance_score(self) -> Dict:
        controls = self.load_controls()
        if not controls:
            return {"overall_score": 0, "framework_scores": {}}
        total_controls = len(controls)
        implemented_controls = len([c for c in controls if c.get('status') == 'Implemented'])
        overall_score = (implemented_controls / total_controls * 100) if total_controls > 0 else 0
        framework_scores = {}
        frameworks = set(c.get('framework', 'Unknown') for c in controls)
        for framework in frameworks:
            framework_controls = [c for c in controls if c.get('framework') == framework]
            implemented_framework = len([c for c in framework_controls if c.get('status') == 'Implemented'])
            framework_score = (implemented_framework / len(framework_controls) * 100) if framework_controls else 0
            framework_scores[framework] = round(framework_score, 1)
        return {
            "overall_score": round(overall_score, 1), "framework_scores": framework_scores,
            "total_controls": total_controls, "implemented_controls": implemented_controls,
            "in_progress_controls": len([c for c in controls if c.get('status') == 'In Progress']),
            "not_started_controls": len([c for c in controls if c.get('status') == 'Not Started'])
        }
    
    def get_risk_assessment(self) -> Dict:
        controls = self.load_controls()
        risk_levels = {"High": 0, "Medium": 0, "Low": 0}
        for control in controls:
            risk = control.get('risk_level', 'Medium')
            if risk in risk_levels:
                risk_levels[risk] += 1
        total_risks = sum(risk_levels.values())
        risk_percentages = {k: (v / total_risks * 100) if total_risks > 0 else 0 for k, v in risk_levels.items()}
        return {"risk_counts": risk_levels, "risk_percentages": risk_percentages, "total_assessed": total_risks}
    
    def get_implementation_timeline(self) -> Dict:
        controls = self.load_controls()
        timeline_data = {}
        for control in controls:
            date_str = control.get('created_date', datetime.now().isoformat())
            try:
                month_key = datetime.fromisoformat(date_str.replace('Z', '+00:00')).strftime('%Y-%m')
                if month_key not in timeline_data:
                    timeline_data[month_key] = {"total": 0, "implemented": 0}
                timeline_data[month_key]["total"] += 1
                if control.get('status') == 'Implemented':
                    timeline_data[month_key]["implemented"] += 1
            except: continue
        sorted_timeline = dict(sorted(timeline_data.items()))
        return {
            "timeline": sorted_timeline, "months": list(sorted_timeline.keys()),
            "totals": [data["total"] for data in sorted_timeline.values()],
            "implemented": [data["implemented"] for data in sorted_timeline.values()]
        }
"@

Set-Content -Path "$PROJECT_ROOT\services\analytics_service.py" -Value $analyticsService
Write-Host "Analytics Service created" -ForegroundColor Green

# Step 5: Update server endpoints
Write-Host "`n5. UPDATING SERVER ENDPOINTS..." -ForegroundColor Cyan

# Read the server file safely
if (Test-Path "$PROJECT_ROOT\local_server.py") {
    $serverContent = Get-Content "$PROJECT_ROOT\local_server.py" -Raw
    
    # Add imports if not present
    if (-not ($serverContent -like "*from services.evidence_manager*")) {
        $serverContent = $serverContent -replace "from services.ai_service import AIService", "from services.ai_service import AIService`nfrom services.evidence_manager import EvidenceManager`nfrom services.analytics_service import AnalyticsService"
    }
    
    # Add service initialization if not present
    if (-not ($serverContent -like "*evidence_manager = EvidenceManager*")) {
        $serverContent = $serverContent -replace "ai_service = AIService()", "ai_service = AIService()`nevidence_manager = EvidenceManager()`nanalytics_service = AnalyticsService()"
    }
    
    # Add new endpoints
    $newEndpoints = @"

# Evidence Management Endpoints
@app.route('/api/evidence/upload', methods=['POST'])
def upload_evidence():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    control_id = request.form.get('control_id')
    uploaded_by = request.form.get('uploaded_by', 'anonymous')
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not control_id:
        return jsonify({"error": "Control ID required"}), 400
    allowed_extensions = {'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'txt'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_extensions:
        return jsonify({"error": f"File type not allowed: {file_ext}"}), 400
    filename = f"{control_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = f"uploads/evidence/{filename}"
    file.save(file_path)
    evidence_record = evidence_manager.add_evidence(control_id, file.filename, file_path, file_ext, uploaded_by)
    return jsonify({"success": True, "evidence": evidence_record})

@app.route('/api/evidence/control/<control_id>', methods=['GET'])
def get_control_evidence(control_id):
    evidence = evidence_manager.get_evidence_for_control(control_id)
    return jsonify(evidence)

@app.route('/api/evidence/stats', methods=['GET'])
def get_evidence_stats():
    stats = evidence_manager.get_evidence_stats()
    return jsonify(stats)

# Analytics Endpoints
@app.route('/api/analytics/compliance-score', methods=['GET'])
def get_compliance_score():
    score_data = analytics_service.get_compliance_score()
    return jsonify(score_data)

@app.route('/api/analytics/risk-assessment', methods=['GET'])
def get_risk_assessment():
    risk_data = analytics_service.get_risk_assessment()
    return jsonify(risk_data)

@app.route('/api/analytics/implementation-timeline', methods=['GET'])
def get_implementation_timeline():
    timeline_data = analytics_service.get_implementation_timeline()
    return jsonify(timeline_data)

# Advanced Filtering Endpoint
@app.route('/api/controls/filter', methods=['POST'])
def filter_controls():
    data = request.json
    filters = data.get('filters', {})
    controls = analytics_service.load_controls()
    filtered_controls = controls
    if 'status' in filters and filters['status']:
        filtered_controls = [c for c in filtered_controls if c.get('status') in filters['status']]
    if 'framework' in filters and filters['framework']:
        filtered_controls = [c for c in filtered_controls if c.get('framework') in filters['framework']]
    if 'risk_level' in filters and filters['risk_level']:
        filtered_controls = [c for c in filtered_controls if c.get('risk_level') in filters['risk_level']]
    if 'search' in filters and filters['search']:
        search_term = filters['search'].lower()
        filtered_controls = [c for c in filtered_controls if search_term in c.get('name', '').lower() or search_term in c.get('description', '').lower()]
    return jsonify(filtered_controls)
"@

    # Insert endpoints only if not already present
    if (-not ($serverContent -like "*@app.route('/api/evidence/upload'*")) {
        $serverContent = $serverContent -replace "if __name__ == '__main__':", "$newEndpoints`n`nif __name__ == '__main__':"
    }
    
    Set-Content -Path "$PROJECT_ROOT\local_server.py" -Value $serverContent
    Write-Host "Server endpoints updated" -ForegroundColor Green
} else {
    Write-Host "ERROR: local_server.py not found!" -ForegroundColor Red
}

# Step 6: Create JavaScript files
Write-Host "`n6. CREATING JAVASCRIPT COMPONENTS..." -ForegroundColor Cyan

# Advanced Filters JS
$advancedFiltersJS = @"
// Advanced Filtering System
class AdvancedFilters {
    constructor() {
        this.currentFilters = { status: [], framework: [], risk_level: [], search: '' };
        this.init();
    }
    init() {
        this.createFilterUI();
        this.bindEvents();
    }
    createFilterUI() {
        const filterHTML = '<div class=\"advanced-filters bg-white p-4 rounded-lg shadow mb-4\"><h3 class=\"text-lg font-semibold mb-3\">Advanced Filters</h3><div class=\"grid grid-cols-1 md:grid-cols-4 gap-4\"><div><label class=\"block text-sm font-medium mb-1\">Search</label><input type=\"text\" id=\"globalSearch\" placeholder=\"Search controls...\" class=\"w-full px-3 py-2 border rounded\"></div><div><label class=\"block text-sm font-medium mb-1\">Status</label><select id=\"statusFilter\" multiple class=\"w-full px-3 py-2 border rounded\"><option value=\"Implemented\">Implemented</option><option value=\"In Progress\">In Progress</option><option value=\"Not Started\">Not Started</option></select></div><div><label class=\"block text-sm font-medium mb-1\">Framework</label><select id=\"frameworkFilter\" multiple class=\"w-full px-3 py-2 border rounded\"><option value=\"SOC 2\">SOC 2</option><option value=\"HIPAA\">HIPAA</option><option value=\"NIST CSF\">NIST CSF</option><option value=\"PCI DSS\">PCI DSS</option><option value=\"ISO 27001\">ISO 27001</option></select></div><div><label class=\"block text-sm font-medium mb-1\">Risk Level</label><select id=\"riskFilter\" multiple class=\"w-full px-3 py-2 border rounded\"><option value=\"High\">High</option><option value=\"Medium\">Medium</option><option value=\"Low\">Low</option></select></div></div><div class=\"flex justify-between mt-3\"><button onclick=\"advancedFilters.applyFilters()\" class=\"px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600\">Apply Filters</button><button onclick=\"advancedFilters.clearFilters()\" class=\"px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600\">Clear All</button><button onclick=\"advancedFilters.saveFilterPreset()\" class=\"px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600\">Save Preset</button></div><div id=\"filterPresets\" class=\"mt-3\"><label class=\"block text-sm font-medium mb-1\">Saved Presets</label><div id=\"presetsList\" class=\"flex flex-wrap gap-2\"></div></div></div>';
        const controlsSection = document.querySelector('[data-section=\"controls\"]');
        if (controlsSection) {
            controlsSection.insertAdjacentHTML('afterbegin', filterHTML);
        }
    }
    bindEvents() {
        let searchTimeout;
        document.getElementById('globalSearch')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }, 300);
        });
        ['statusFilter', 'frameworkFilter', 'riskFilter'].forEach(filterId => {
            document.getElementById(filterId)?.addEventListener('change', (e) => {
                const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                const filterType = filterId.replace('Filter', '').toLowerCase();
                this.currentFilters[filterType] = values;
            });
        });
    }
    async applyFilters() {
        try {
            const response = await fetch('/api/controls/filter', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({filters: this.currentFilters})
            });
            const filteredControls = await response.json();
            this.displayFilteredResults(filteredControls);
            this.updateFilterCounts(filteredControls.length);
        } catch (error) {
            console.error('Filter error:', error);
        }
    }
    displayFilteredResults(controls) {
        console.log('Filtered controls:', controls);
        if (window.updateControlsDisplay) {
            window.updateControlsDisplay(controls);
        }
    }
    updateFilterCounts(filteredCount) {
        const filterInfo = document.getElementById('filterInfo') || this.createFilterInfo();
        filterInfo.textContent = 'Showing ' + filteredCount + ' controls';
    }
    createFilterInfo() {
        const infoElement = document.createElement('div');
        infoElement.id = 'filterInfo';
        infoElement.className = 'text-sm text-gray-600 mt-2';
        document.querySelector('.advanced-filters').appendChild(infoElement);
        return infoElement;
    }
    clearFilters() {
        this.currentFilters = { status: [], framework: [], risk_level: [], search: '' };
        document.getElementById('globalSearch').value = '';
        ['statusFilter', 'frameworkFilter', 'riskFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                Array.from(element.options).forEach(option => {
                    option.selected = false;
                });
            }
        });
        this.applyFilters();
    }
}
const advancedFilters = new AdvancedFilters();
"@

Set-Content -Path "$PROJECT_ROOT\js\advanced-filters.js" -Value $advancedFiltersJS
Write-Host "Advanced Filters created" -ForegroundColor Green

# Dashboard Charts JS
$dashboardChartsJS = @"
// Dashboard Analytics Charts
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.init();
    }
    async init() {
        await this.loadAnalyticsData();
        this.renderCharts();
    }
    async loadAnalyticsData() {
        try {
            const [complianceScore, riskAssessment, timeline] = await Promise.all([
                this.fetchData('/api/analytics/compliance-score'),
                this.fetchData('/api/analytics/risk-assessment'),
                this.fetchData('/api/analytics/implementation-timeline')
            ]);
            this.analyticsData = { complianceScore, riskAssessment, timeline };
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }
    async fetchData(endpoint) {
        const response = await fetch(endpoint);
        return await response.json();
    }
    renderCharts() {
        this.renderComplianceScore();
        this.renderRiskAssessment();
        this.renderImplementationTimeline();
    }
    renderComplianceScore() {
        const data = this.analyticsData.complianceScore;
        const container = document.getElementById('complianceChart');
        if (!container) return;
        let frameworkHTML = '';
        Object.entries(data.framework_scores).forEach(([framework, score]) => {
            frameworkHTML += '<div class=\"flex justify-between\"><span>' + framework + ':</span><span class=\"font-semibold\">' + score + '%</span></div>';
        });
        container.innerHTML = '<div class=\"bg-white p-4 rounded-lg shadow\"><h3 class=\"text-lg font-semibold mb-3\">Compliance Score</h3><div class=\"text-center\"><div class=\"text-4xl font-bold text-blue-600 mb-2\">' + data.overall_score + '%</div><div class=\"text-sm text-gray-600\">' + data.implemented_controls + ' of ' + data.total_controls + ' controls implemented</div></div><div class=\"mt-4 grid grid-cols-2 gap-2 text-sm\">' + frameworkHTML + '</div></div>';
    }
    renderRiskAssessment() {
        const data = this.analyticsData.riskAssessment;
        const container = document.getElementById('riskChart');
        if (!container) return;
        let riskHTML = '';
        Object.entries(data.risk_counts).forEach(([level, count]) => {
            const percentage = data.risk_percentages[level];
            const color = level === 'High' ? 'red' : level === 'Medium' ? 'yellow' : 'green';
            riskHTML += '<div><div class=\"flex justify-between text-sm mb-1\"><span>' + level + ' Risk</span><span>' + count + ' (' + percentage.toFixed(1) + '%)</span></div><div class=\"w-full bg-gray-200 rounded-full h-2\"><div class=\"bg-' + color + '-500 h-2 rounded-full\" style=\"width: ' + percentage + '%\"></div></div></div>';
        });
        container.innerHTML = '<div class=\"bg-white p-4 rounded-lg shadow\"><h3 class=\"text-lg font-semibold mb-3\">Risk Assessment</h3><div class=\"space-y-2\">' + riskHTML + '</div></div>';
    }
    renderImplementationTimeline() {
        const data = this.analyticsData.timeline;
        const container = document.getElementById('timelineChart');
        if (!container) return;
        const maxValue = Math.max(...data.totals);
        let timelineHTML = '';
        data.months.forEach((month, index) => {
            const total = data.totals[index];
            const implemented = data.implemented[index];
            const implementedWidth = (implemented / total) * 100;
            timelineHTML += '<div><div class=\"text-sm mb-1\">' + month + '</div><div class=\"flex items-center space-x-1\"><div class=\"flex-1 bg-gray-200 rounded-full h-4\"><div class=\"bg-green-500 h-4 rounded-full\" style=\"width: ' + implementedWidth + '%\"></div></div><span class=\"text-xs text-gray-600\">' + implemented + '/' + total + '</span></div></div>';
        });
        container.innerHTML = '<div class=\"bg-white p-4 rounded-lg shadow\"><h3 class=\"text-lg font-semibold mb-3\">Implementation Timeline</h3><div class=\"space-y-2\">' + timelineHTML + '</div></div>';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCharts = new DashboardCharts();
});
"@

Set-Content -Path "$PROJECT_ROOT\js\dashboard-charts.js" -Value $dashboardChartsJS
Write-Host "Dashboard Charts created" -ForegroundColor Green

# Step 7: Update index.html - FIXED VERSION
Write-Host "`n7. UPDATING INDEX.HTML..." -ForegroundColor Cyan

if (Test-Path "$PROJECT_ROOT\index.html") {
    $indexContent = Get-Content "$PROJECT_ROOT\index.html" -Raw
    
    # Add script imports using simple replacement
    $scriptImports = "    <script src=`"js/advanced-filters.js`"></script>`n    <script src=`"js/dashboard-charts.js`"></script>"
    if (-not ($indexContent -like "*advanced-filters.js*")) {
        $indexContent = $indexContent.Replace("<!-- Existing scripts -->", "<!-- Existing scripts -->`n$scriptImports")
    }
    
    # Add analytics tab HTML
    $analyticsHTML = @"
<!-- Analytics Dashboard Tab -->
<div id="analyticsTab" class="hidden tab-content">
    <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Compliance Analytics</h2>
        <p class="text-gray-600">Real-time insights and compliance metrics</p>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div id="complianceChart"></div>
        <div id="riskChart"></div>
    </div>
    <div class="grid grid-cols-1 gap-6">
        <div id="timelineChart"></div>
    </div>
</div>
"@

    # Add analytics tab to navigation and content
    if (-not ($indexContent -like "*id=`"analyticsTab`"*")) {
        # Add navigation button
        $indexContent = $indexContent.Replace("<!-- Navigation tabs -->", "<!-- Navigation tabs -->`n            <button class=`"tab-btn px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors`" data-tab=`"analyticsTab`">Analytics Dashboard</button>")
        
        # Add analytics tab content before Control Details Tab
        $indexContent = $indexContent.Replace("<!-- Control Details Tab -->", "$analyticsHTML`n`n<!-- Control Details Tab -->")
    }
    
    Set-Content -Path "$PROJECT_ROOT\index.html" -Value $indexContent
    Write-Host "Index.html updated" -ForegroundColor Green
} else {
    Write-Host "ERROR: index.html not found!" -ForegroundColor Red
}

# Step 8: Create .gitignore
Write-Host "`n8. CREATING GITIGNORE..." -ForegroundColor Cyan
$gitignore = @"
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Environment
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Application specific
uploads/
exports/
backup_*/
data/evidence.json
data/users.json
"@
Set-Content -Path "$PROJECT_ROOT\.gitignore" -Value $gitignore
Write-Host ".gitignore created" -ForegroundColor Green

# Step 9: Smoke tests
Write-Host "`n9. RUNNING SMOKE TESTS..." -ForegroundColor Cyan
function Test-FileExists { param($Path) $exists = Test-Path $Path; if ($exists) { Write-Host "? $Path" -ForegroundColor Green } else { Write-Host "? $Path" -ForegroundColor Red } }
Test-FileExists "$PROJECT_ROOT\services\evidence_manager.py"
Test-FileExists "$PROJECT_ROOT\services\analytics_service.py"
Test-FileExists "$PROJECT_ROOT\js\advanced-filters.js"
Test-FileExists "$PROJECT_ROOT\js\dashboard-charts.js"
Test-FileExists "$PROJECT_ROOT\.gitignore"

try {
    python -m py_compile "$PROJECT_ROOT\services\evidence_manager.py"
    python -m py_compile "$PROJECT_ROOT\services\analytics_service.py"
    Write-Host "? Python syntax validation passed" -ForegroundColor Green
} catch {
    Write-Host "? Python syntax validation failed" -ForegroundColor Red
}

# Step 10: GitHub upload
Write-Host "`n10. UPLOADING TO GITHUB..." -ForegroundColor Cyan
try {
    git add .
    git commit -m "Patch-2: Advanced Features - Evidence Management, Analytics Dashboard, Advanced Filtering"
    git branch -M main
    git push -u origin main
    Write-Host "? Successfully uploaded to GitHub" -ForegroundColor Green
} catch {
    Write-Host "? GitHub upload failed" -ForegroundColor Red
    Write-Host "Manual: git add . -> git commit -m 'Patch-2' -> git push origin main" -ForegroundColor Yellow
}

Write-Host "`n=== PATCH-2 DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "All advanced features deployed!" -ForegroundColor Green
Write-Host "Backup: $BACKUP_DIR" -ForegroundColor Yellow
Write-Host "Run: python local_server.py to test new features" -ForegroundColor Yellow
