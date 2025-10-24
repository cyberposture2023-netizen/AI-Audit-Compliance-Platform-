import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs

PORT = 8000

class LocalAPIHandler:
    @staticmethod
    def handle_save_control(data):
        """Save control data to local JSON file"""
        try:
            controls_file = 'data/controls.json'
            os.makedirs('data', exist_ok=True)
            
            if os.path.exists(controls_file):
                with open(controls_file, 'r') as f:
                    controls = json.load(f)
            else:
                controls = []
            
            # Update or add control
            control_id = data.get('control_id')
            controls = [c for c in controls if c.get('control_id') != control_id]
            controls.append(data)
            
            with open(controls_file, 'w') as f:
                json.dump(controls, f, indent=2)
            
            return {'success': True, 'message': 'Control saved'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def handle_save_policy(data):
        """Save policy to local JSON file"""
        try:
            policies_file = 'data/policies.json'
            os.makedirs('data', exist_ok=True)
            
            if os.path.exists(policies_file):
                with open(policies_file, 'r') as f:
                    policies = json.load(f)
            else:
                policies = []
            
            policy_id = f"policy_{len(policies) + 1:03d}"
            data['id'] = policy_id
            policies.append(data)
            
            with open(policies_file, 'w') as f:
                json.dump(policies, f, indent=2)
            
            return {'success': True, 'policy_id': policy_id}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def handle_get_data(data_type):
        """Get data from local JSON files"""
        try:
            file_path = f'data/{data_type}.json'
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return {'success': True, 'data': json.load(f)}
            else:
                return {'success': True, 'data': []}
        except Exception as e:
            return {'success': False, 'error': str(e)}

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.startswith('/api/'):
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            response_data = {}
            
            if self.path == '/api/generate-plan':
                response_data = MockAIService.generate_audit_plan(data)
            elif self.path == '/api/save-control':
                response_data = LocalAPIHandler.handle_save_control(data)
            elif self.path == '/api/save-policy':
                response_data = LocalAPIHandler.handle_save_policy(data)
            elif self.path == '/api/generate-policy':
                response_data = MockAIService.generate_policy(data)
            elif self.path == '/api/generate-procedure':
                response_data = MockAIService.generate_procedure(data)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
        
        else:
            super().do_POST()
    
    def do_GET(self):
        if self.path.startswith('/api/'):
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            response_data = {}
            
            if self.path.startswith('/api/get-data'):
                data_type = query_params.get('type', ['controls'])[0]
                response_data = LocalAPIHandler.handle_get_data(data_type)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
        
        else:
            super().do_GET()

class MockAIService:
    """Mock AI service that generates realistic compliance data"""
    
    @staticmethod
    def generate_audit_plan(data):
        framework = data.get('framework', 'SOC 2 Type 2')
        industry = data.get('industry', 'SaaS')
        tech_stack = data.get('tech_stack', [])
        
        # Generate mock controls based on framework
        controls = MockAIService._generate_controls(framework, industry, tech_stack)
        
        return {
            'success': True,
            'plan': {
                'framework': framework,
                'industry': industry,
                'tech_stack': tech_stack,
                'generated_at': '2024-01-01T00:00:00Z',
                'total_controls': len(controls),
                'high_risk_count': len([c for c in controls if c['risk_rating'] == 'High'])
            },
            'controls': controls
        }
    
    @staticmethod
    def _generate_controls(framework, industry, tech_stack):
        # Base controls for different frameworks
        control_templates = {
            'SOC 2 Type 2': [
                {
                    'control_id': 'ACC-001',
                    'control_area': 'Access Management',
                    'control_description': 'User access reviews are performed quarterly',
                    'control_type': 'Manual',
                    'risk': 'Unauthorized access to systems and data',
                    'risk_rating': 'High',
                    'test_of_design': {
                        'steps': ['Review access review procedures', 'Verify quarterly review schedule'],
                        'evidence': ['Access review policy', 'Review meeting minutes']
                    },
                    'test_of_effectiveness': {
                        'steps': ['Sample user accounts to verify reviews occurred', 'Check timestamps of last reviews'],
                        'evidence': ['User access reports', 'Review documentation']
                    }
                },
                {
                    'control_id': 'CHG-001',
                    'control_area': 'Change Management',
                    'control_description': 'All production changes require approval',
                    'control_type': 'Hybrid',
                    'risk': 'Unauthorized changes causing system instability',
                    'risk_rating': 'High',
                    'test_of_design': {
                        'steps': ['Review change management policy', 'Verify approval workflows'],
                        'evidence': ['Change management policy', 'Approval workflow diagrams']
                    },
                    'test_of_effectiveness': {
                        'steps': ['Sample production changes to verify approvals', 'Check change tickets'],
                        'evidence': ['Change tickets', 'Approval records']
                    }
                }
            ],
            'HIPAA': [
                {
                    'control_id': 'ACC-001',
                    'control_area': 'Access Controls',
                    'control_description': 'Unique user identification for accessing ePHI',
                    'control_type': 'Automatic',
                    'risk': 'Unauthorized access to protected health information',
                    'risk_rating': 'High',
                    'test_of_design': {
                        'steps': ['Review user account policies', 'Verify unique user IDs are required'],
                        'evidence': ['Security policy', 'System configuration']
                    },
                    'test_of_effectiveness': {
                        'steps': ['Test login with shared credentials', 'Verify audit logs show individual users'],
                        'evidence': ['Login attempts', 'Audit logs']
                    }
                }
            ]
        }
        
        controls = control_templates.get(framework, control_templates['SOC 2 Type 2'])
        
        # Add custom testing steps based on tech stack
        for control in controls:
            control['custom_testing_steps'] = MockAIService._generate_custom_steps(control, tech_stack)
            control['status'] = 'Not Started'
        
        return controls
    
    @staticmethod
    def _generate_custom_steps(control, tech_stack):
        steps = []
        
        if 'AWS' in tech_stack and 'Access' in control['control_area']:
            steps.append({
                'technology': 'AWS IAM',
                'steps': 'Verify IAM password policy requirements',
                'automation_artifact': {
                    'type': 'AWS CLI',
                    'description': 'Check IAM password policy configuration',
                    'snippet': 'aws iam get-account-password-policy'
                }
            })
        
        if 'Jira' in tech_stack and 'Change' in control['control_area']:
            steps.append({
                'technology': 'Jira',
                'steps': 'Verify all production changes are approved',
                'automation_artifact': {
                    'type': 'JQL',
                    'description': 'Find Jira tickets moved to Done without approval',
                    'snippet': 'project = PROD AND status = Done AND approvals != Approved'
                }
            })
        
        if 'GitHub' in tech_stack:
            steps.append({
                'technology': 'GitHub',
                'steps': 'Verify branch protection rules for main branch',
                'automation_artifact': {
                    'type': 'GitHub CLI',
                    'description': 'Check branch protection settings',
                    'snippet': 'gh api repos/owner/repo/branches/main/protection'
                }
            })
        
        return steps
    
    @staticmethod
    def generate_policy(data):
        control_area = data.get('control_area', 'General')
        tech_stack = data.get('tech_stack', [])
        
        policy_template = f"""
# {control_area} Policy

## 1.0 Purpose
This policy establishes guidelines for {control_area.lower()} to ensure the security, integrity, and availability of company systems and data.

## 2.0 Scope
This policy applies to all employees, contractors, and third parties accessing company systems.

## 3.0 Policy Statements

### 3.1 General Requirements
- All {control_area.lower()} activities must be documented and approved
- Regular reviews must be conducted to ensure compliance
- Exceptions require formal approval from management

### 3.2 Technical Controls
{''.join([f'- {tech}: Appropriate security configurations must be maintained\n' for tech in tech_stack])}

## 4.0 Roles and Responsibilities
- **System Owners**: Responsible for implementing controls
- **Security Team**: Responsible for monitoring compliance
- **Management**: Responsible for policy approval and exceptions

## 5.0 Review Cycle
This policy shall be reviewed annually or when significant changes occur.
"""
        
        return {
            'success': True,
            'content': policy_template.strip(),
            'type': 'policy'
        }
    
    @staticmethod
    def generate_procedure(data):
        control_area = data.get('control_area', 'General')
        
        procedure_template = f"""
# {control_area} Procedure

## 1.0 Overview
This procedure outlines the steps for implementing and maintaining {control_area.lower()} controls.

## 2.0 Procedure Steps

### 2.1 Initial Setup
1. Review the {control_area} Policy requirements
2. Identify systems and applications in scope
3. Document current state and gaps

### 2.2 Implementation
1. Configure technical controls as specified
2. Document configuration settings
3. Test controls to ensure proper functionality

### 2.3 Ongoing Maintenance
1. Conduct regular reviews (quarterly recommended)
2. Update documentation for any changes
3. Report any issues or exceptions

## 3.0 Evidence Requirements
- Configuration documentation
- Review meeting minutes
- Testing results
- Exception documentation

## 4.0 Related Documents
- {control_area} Policy
- Risk Assessment Framework
- Incident Response Plan
"""
        
        return {
            'success': True,
            'content': procedure_template.strip(),
            'type': 'procedure'
        }

print(f"Starting local compliance platform server at http://localhost:{PORT}")
print("Press Ctrl+C to stop the server")

with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
    httpd.serve_forever()




