from flask import Flask, request, jsonify, send_file
import json
import os
from datetime import datetime
from services.ai_service import AIService
from services.export_service import ExportService
from services.user_manager import UserManager

app = Flask(__name__)

# Initialize services
ai_service = AIService()
export_service = ExportService()
user_manager = UserManager()

# Enhanced frameworks
EXPANDED_FRAMEWORKS = {
    \"SOC 2\": [\"Security\", \"Availability\", \"Processing Integrity\", \"Confidentiality\", \"Privacy\"],
    \"HIPAA\": [\"Privacy Rule\", \"Security Rule\", \"Breach Notification\"],
    \"NIST CSF\": [\"Identify\", \"Protect\", \"Detect\", \"Respond\", \"Recover\"],
    \"PCI DSS\": [\"Build Secure Systems\", \"Protect Cardholder Data\", \"Vulnerability Management\", \"Access Control\", \"Monitoring\", \"Security Policies\"],
    \"ISO 27001\": [\"Context Establishment\", \"Leadership\", \"Planning\", \"Support\", \"Operation\", \"Performance Evaluation\", \"Improvement\"]
}

@app.route('/')
def serve_index():
    return send_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_file(path)

# Enhanced Audit Plan Generation
@app.route('/generate-audit-plan', methods=['POST'])
def generate_audit_plan():
    data = request.json
    framework = data.get('framework')
    scope = data.get('scope')
    
    # Use real AI service
    audit_plan = ai_service.generate_audit_plan(framework, scope)
    return jsonify({\"audit_plan\": audit_plan})

# Enhanced Policy Generation
@app.route('/generate-policy', methods=['POST'])
def generate_policy():
    data = request.json
    policy_type = data.get('policy_type')
    framework = data.get('framework')
    
    policy_content = ai_service.generate_policy(policy_type, framework)
    return jsonify({\"policy_content\": policy_content})

# Export endpoints
@app.route('/export/excel', methods=['POST'])
def export_excel():
    data = request.json
    controls = data.get('controls', [])
    
    filename = export_service.export_to_excel(controls)
    return jsonify({\"filename\": filename, \"message\": \"Excel export completed\"})

@app.route('/export/pdf', methods=['POST'])
def export_pdf():
    data = request.json
    controls = data.get('controls', [])
    framework = data.get('framework', 'Compliance')
    
    filename = export_service.export_to_pdf(controls, framework)
    return jsonify({\"filename\": filename, \"message\": \"PDF export completed\"})

# User management endpoints
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if user_manager.authenticate(username, password):
        return jsonify({
            \"success\": True,
            \"username\": username,
            \"role\": user_manager.get_user_role(username)
        })
    else:
        return jsonify({\"success\": False, \"error\": \"Invalid credentials\"})

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if user_manager.create_user(username, password):
        return jsonify({\"success\": True, \"message\": \"User created successfully\"})
    else:
        return jsonify({\"success\": False, \"error\": \"Username already exists\"})

# Evidence upload endpoint
@app.route('/upload-evidence', methods=['POST'])
def upload_evidence():
    if 'evidence' not in request.files:
        return jsonify({\"error\": \"No file provided\"}), 400
    
    file = request.files['evidence']
    if file.filename == '':
        return jsonify({\"error\": \"No file selected\"}), 400
    
    # Save the file
    filename = f\"uploads/evidence/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}\"
    file.save(filename)
    
    return jsonify({\"success\": True, \"filename\": filename, \"message\": \"Evidence uploaded successfully\"})

# Get frameworks endpoint
@app.route('/frameworks', methods=['GET'])
def get_frameworks():
    return jsonify(EXPANDED_FRAMEWORKS)

# Existing data endpoints (keep your existing functionality)
@app.route('/save-controls', methods=['POST'])
def save_controls():
    data = request.json
    with open('data/controls.json', 'w') as f:
        json.dump(data, f, indent=2)
    return jsonify({\"message\": \"Controls saved successfully\"})

@app.route('/load-controls', methods=['GET'])
def load_controls():
    if os.path.exists('data/controls.json'):
        with open('data/controls.json', 'r') as f:
            return jsonify(json.load(f))
    return jsonify([])

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    os.makedirs('uploads/evidence', exist_ok=True)
    os.makedirs('exports', exist_ok=True)
    
    print(\"Starting Enhanced Compliance Platform Server...\")
    print(\"New Features: Multi-user, Real AI, Export Capabilities, Evidence Upload\")
    print(\"Supported Frameworks: SOC 2, HIPAA, NIST CSF, PCI DSS, ISO 27001\")
    app.run(host='0.0.0.0', port=8000, debug=True)
