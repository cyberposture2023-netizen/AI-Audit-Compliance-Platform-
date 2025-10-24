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
