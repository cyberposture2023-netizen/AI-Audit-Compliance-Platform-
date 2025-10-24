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
