import os
import requests
import json
from typing import Dict, Any

class AIService:
    def __init__(self):
        self.openai_key = os.getenv('OPENAI_API_KEY')
        self.gemini_key = os.getenv('GEMINI_API_KEY')
    
    def generate_with_openai(self, prompt: str, max_tokens: int = 1500) -> str:
        \"\"\"Generate content using OpenAI API\"\"\"
        if not self.openai_key:
            return \"OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.\"
        
        headers = {
            \"Authorization\": f\"Bearer {self.openai_key}\",
            \"Content-Type\": \"application/json\"
        }
        
        data = {
            \"model\": \"gpt-3.5-turbo\",
            \"messages\": [{\"role\": \"user\", \"content\": prompt}],
            \"max_tokens\": max_tokens,
            \"temperature\": 0.7
        }
        
        try:
            response = requests.post(
                \"https://api.openai.com/v1/chat/completions\",
                headers=headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            return response.json()[\"choices\"][0][\"message\"][\"content\"]
        except Exception as e:
            return f\"AI generation failed: {str(e)}\"
    
    def generate_with_gemini(self, prompt: str) -> str:
        \"\"\"Generate content using Google Gemini API\"\"\"
        if not self.gemini_key:
            return \"Gemini API key not configured. Please set GEMINI_API_KEY environment variable.\"
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_key)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            return response.text
        except ImportError:
            return \"Google Generative AI package not installed. Run: pip install google-generativeai\"
        except Exception as e:
            return f\"Gemini generation failed: {str(e)}\"
    
    def generate_audit_plan(self, framework: str, scope: str) -> str:
        \"\"\"Generate audit plan using AI\"\"\"
        prompt = f\"\"\"
        As a compliance expert, create a detailed {framework} audit plan for: {scope}
        
        Include:
        1. Key control objectives
        2. Testing procedures
        3. Evidence requirements
        4. Risk assessment
        5. Timeline recommendations
        
        Format the response in clear sections with actionable items.
        \"\"\"
        
        return self.generate_with_openai(prompt)
    
    def generate_policy(self, policy_type: str, framework: str) -> str:
        \"\"\"Generate policy using AI\"\"\"
        prompt = f\"\"\"
        Create a comprehensive {policy_type} policy compliant with {framework} requirements.
        
        Include:
        1. Policy statement and purpose
        2. Scope and applicability
        3. Roles and responsibilities
        4. Policy details and procedures
        5. Compliance and enforcement
        6. Review and revision schedule
        
        Make it professional and actionable for implementation.
        \"\"\"
        
        return self.generate_with_openai(prompt)
