import requests
import time
import sys

def test_endpoint(url, name, expected_status=200):
    try:
        print(f"Testing {name}...")
        response = requests.get(f"http://localhost:8000{url}", timeout=10)
        
        if response.status_code == expected_status:
            print(f"✅ {name} - PASS (Status: {response.status_code})")
            
            # Try to parse JSON for API endpoints
            if '/api/' in url:
                try:
                    data = response.json()
                    print(f"   📊 Response data: {list(data.keys()) if isinstance(data, dict) else f'list with {len(data)} items'}")
                except:
                    print(f"   📊 Response: {response.text[:100]}...")
                    
            return True
        else:
            print(f"❌ {name} - FAIL (Status: {response.status_code})")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ {name} - ERROR: {e}")
        return False

print("🚀 Testing Fixed Compliance Platform Endpoints...")
print("=" * 60)

tests = [
    ("/", "Main Platform"),
    ("/analytics", "Analytics Dashboard"),
    ("/api/analytics/compliance-score", "Compliance Score API"),
    ("/api/analytics/gap-analysis", "Gap Analysis API"),
    ("/api/analytics/trends", "Trends API"),
    ("/api/assessments", "Assessments API")
]

print("Waiting for server to be ready...")
time.sleep(2)

passed = 0
for url, name in tests:
    if test_endpoint(url, name):
        passed += 1
    print()  # Empty line between tests

print("=" * 60)
print(f"📊 Results: {passed}/{len(tests)} tests passed")

if passed == len(tests):
    print("🎉 ALL TESTS PASSED! 500 Errors are fixed!")
    print("🌐 Access Analytics: http://localhost:8000/analytics")
    print("📈 View Compliance Score: http://localhost:8000/api/analytics/compliance-score")
else:
    print("⚠️  Some tests failed. Check server logs for details.")
    sys.exit(1)
