// Dashboard Analytics Charts
console.log("Dashboard Charts JS loaded");
class DashboardCharts {
    constructor() {
        this.charts = {};
        console.log("Initializing Dashboard Charts");
        this.init();
    }
    async init() {
        await this.loadAnalyticsData();
        this.renderCharts();
    }
    async loadAnalyticsData() {
        console.log("Loading analytics data");
        try {
            const [complianceScore, riskAssessment, timeline] = await Promise.all([
                this.fetchData('/api/analytics/compliance-score'),
                this.fetchData('/api/analytics/risk-assessment'),
                this.fetchData('/api/analytics/implementation-timeline')
            ]);
            this.analyticsData = { complianceScore, riskAssessment, timeline };
            console.log("Analytics data loaded:", this.analyticsData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }
    async fetchData(endpoint) {
        const response = await fetch(endpoint);
        return await response.json();
    }
    renderCharts() {
        console.log("Rendering charts");
        this.renderComplianceScore();
        this.renderRiskAssessment();
        this.renderImplementationTimeline();
    }
    renderComplianceScore() {
        const data = this.analyticsData.complianceScore;
        const container = document.getElementById('complianceChart');
        if (!container) {
            console.error("Compliance chart container not found");
            return;
        }
        console.log("Rendering compliance score:", data);
        let frameworkHTML = '';
        Object.entries(data.framework_scores).forEach(([framework, score]) => {
            frameworkHTML += '<div class="flex justify-between"><span>' + framework + ':</span><span class="font-semibold">' + score + '%</span></div>';
        });
        container.innerHTML = '<div class="bg-white p-4 rounded-lg shadow"><h3 class="text-lg font-semibold mb-3">Compliance Score</h3><div class="text-center"><div class="text-4xl font-bold text-blue-600 mb-2">' + data.overall_score + '%</div><div class="text-sm text-gray-600">' + data.implemented_controls + ' of ' + data.total_controls + ' controls implemented</div></div><div class="mt-4 grid grid-cols-2 gap-2 text-sm">' + frameworkHTML + '</div></div>';
    }
    renderRiskAssessment() {
        const data = this.analyticsData.riskAssessment;
        const container = document.getElementById('riskChart');
        if (!container) {
            console.error("Risk chart container not found");
            return;
        }
        console.log("Rendering risk assessment:", data);
        let riskHTML = '';
        Object.entries(data.risk_counts).forEach(([level, count]) => {
            const percentage = data.risk_percentages[level];
            const color = level === 'High' ? 'red' : level === 'Medium' ? 'yellow' : 'green';
            riskHTML += '<div><div class="flex justify-between text-sm mb-1"><span>' + level + ' Risk</span><span>' + count + ' (' + percentage.toFixed(1) + '%)</span></div><div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-' + color + '-500 h-2 rounded-full" style="width: ' + percentage + '%"></div></div></div>';
        });
        container.innerHTML = '<div class="bg-white p-4 rounded-lg shadow"><h3 class="text-lg font-semibold mb-3">Risk Assessment</h3><div class="space-y-2">' + riskHTML + '</div></div>';
    }
    renderImplementationTimeline() {
        const data = this.analyticsData.timeline;
        const container = document.getElementById('timelineChart');
        if (!container) {
            console.error("Timeline chart container not found");
            return;
        }
        console.log("Rendering timeline:", data);
        const maxValue = Math.max(...data.totals);
        let timelineHTML = '';
        data.months.forEach((month, index) => {
            const total = data.totals[index];
            const implemented = data.implemented[index];
            const implementedWidth = (implemented / total) * 100;
            timelineHTML += '<div><div class="text-sm mb-1">' + month + '</div><div class="flex items-center space-x-1"><div class="flex-1 bg-gray-200 rounded-full h-4"><div class="bg-green-500 h-4 rounded-full" style="width: ' + implementedWidth + '%"></div></div><span class="text-xs text-gray-600">' + implemented + '/' + total + '</span></div></div>';
        });
        container.innerHTML = '<div class="bg-white p-4 rounded-lg shadow"><h3 class="text-lg font-semibold mb-3">Implementation Timeline</h3><div class="space-y-2">' + timelineHTML + '</div></div>';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing dashboard charts");
    window.dashboardCharts = new DashboardCharts();
});
