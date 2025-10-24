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
