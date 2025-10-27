import requests
import time
import sys

def test_endpoint(url, name):
    try:
        response = requests.get(f"http://localhost:8000{url}", timeout=5)
        if response.status_code == 200:
            print(f"✅ {name} - PASS")
            return True
        else:
            print(f"❌ {name} - FAIL (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ {name} - FAIL: {e}")
        return False

print("🚀 Testing Enhanced Compliance Platform...")
print("=" * 50)

tests = [
    ("/", "Main Platform"),
    ("/analytics", "Analytics Dashboard"),
    ("/api/analytics/compliance-score", "Compliance Score API"),
    ("/api/analytics/gap-analysis", "Gap Analysis API"),
    ("/api/analytics/trends", "Trends API"),
    ("/api/assessments", "Assessments API")
]

passed = 0
for url, name in tests:
    if test_endpoint(url, name):
        passed += 1

print("=" * 50)
print(f"📊 Results: {passed}/{len(tests)} tests passed")

if passed == len(tests):
    print("🎉 ALL TESTS PASSED! Platform is fully operational.")
    print("🌐 Access Analytics: http://localhost:8000/analytics")
else:
    print("⚠️  Some tests failed. Check server implementation.")
    sys.exit(1)
