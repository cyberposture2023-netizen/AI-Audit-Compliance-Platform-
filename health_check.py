import requests

def check_server_health():
    try:
        # Test basic connectivity
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and responding")
        else:
            print(f"❌ Server responded with status: {response.status_code}")
            return False
        
        # Test analytics endpoints
        endpoints = [
            "/api/analytics/compliance-score",
            "/api/analytics/gap-analysis",
            "/api/analytics/trends"
        ]
        
        all_healthy = True
        for endpoint in endpoints:
            try:
                response = requests.get(f"http://localhost:8000{endpoint}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {endpoint} - Healthy")
                else:
                    print(f"❌ {endpoint} - Unhealthy (Status: {response.status_code})")
                    all_healthy = False
            except Exception as e:
                print(f"❌ {endpoint} - Error: {e}")
                all_healthy = False
        
        return all_healthy
        
    except Exception as e:
        print(f"❌ Server health check failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Running Server Health Check...")
    print("=" * 50)
    
    if check_server_health():
        print("=" * 50)
        print("🎉 SERVER HEALTH: EXCELLENT")
        print("All analytics endpoints are working correctly!")
    else:
        print("=" * 50)
        print("⚠️  SERVER HEALTH: NEEDS ATTENTION")
        print("Some endpoints may not be functioning properly.")
