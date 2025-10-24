import json
import hashlib
import secrets
import os
from typing import Dict, Optional

class UserManager:
    def __init__(self, data_dir=\"data\"):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, \"users.json\")
        self._ensure_data_dir()
        self.load_users()
    
    def _ensure_data_dir(self):
        os.makedirs(self.data_dir, exist_ok=True)
    
    def load_users(self):
        if os.path.exists(self.users_file):
            with open(self.users_file, 'r') as f:
                self.users = json.load(f)
        else:
            self.users = {}
            # Create default admin user
            self.create_user(\"admin\", \"admin123\", \"administrator\")
    
    def save_users(self):
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=2)
    
    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username: str, password: str, role: str = \"user\") -> bool:
        if username in self.users:
            return False
        
        self.users[username] = {
            \"password_hash\": self.hash_password(password),
            \"role\": role,
            \"created_at\": datetime.now().isoformat()
        }
        self.save_users()
        return True
    
    def authenticate(self, username: str, password: str) -> bool:
        user = self.users.get(username)
        if not user:
            return False
        
        return user[\"password_hash\"] == self.hash_password(password)
    
    def get_user_role(self, username: str) -> Optional[str]:
        user = self.users.get(username)
        return user.get(\"role\") if user else None
    
    def get_all_users(self) -> Dict:
        return self.users
