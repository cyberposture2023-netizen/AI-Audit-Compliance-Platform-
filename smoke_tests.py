import requests
import json
import sys
import time

def run_smoke_tests():
    base_url = "http://localhost:8000"
    tests_passed = 0
    tests_failed = 0
    
    print("🚀 Running Enhanced Compliance Platform Smoke Tests...")
    print("=" * 50)
    
    # Give server time to start
    time.sleep(2)
    
    # Test 1: Main page load
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("✅ Main page - PASS")
            tests_passed += 1
        else:
            print(f"❌ Main page - FAIL (Status: {response.status_code})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ Main page - FAIL: {e}")
        tests_failed += 1
    
    # Test 2: Analytics page
    try:
        response = requests.get(f"{base_url}/analytics", timeout=10)
        if response.status_code == 200:
            print("✅ Analytics page - PASS")
            tests_passed += 1
        else:
            print(f"❌ Analytics page - FAIL (Status: {response.status_code})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ Analytics page - FAIL: {e}")
        tests_failed += 1
    
    # Test 3: Compliance score API
    try:
        response = requests.get(f"{base_url}/api/analytics/compliance-score", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'overall_score' in data:
                print("✅ Compliance score API - PASS")
                print(f"   📊 Overall Score: {data.get('overall_score', 0)}%")
                tests_passed += 1
            else:
                print("❌ Compliance score API - FAIL (Missing data)")
                tests_failed += 1
        else:
            print(f"❌ Compliance score API - FAIL (Status: {response.status_code})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ Compliance score API - FAIL: {e}")
        tests_failed += 1
    
    # Test 4: Gap analysis API
    try:
        response = requests.get(f"{base_url}/api/analytics/gap-analysis", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Gap analysis API - PASS")
            print(f"   📋 Found {len(data)} gaps")
            tests_passed += 1
        else:
            print(f"❌ Gap analysis API - FAIL (Status: {response.status_code})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ Gap analysis API - FAIL: {e}")
        tests_failed += 1
    
    # Test 5: Trends API
    try:
        response = requests.get(f"{base_url}/api/analytics/trends", timeout=10)
        if response.status_code == 200:
            print("✅ Trends API - PASS")
            tests_passed += 1
        else:
            print(f"❌ Trends API - FAIL (Status: {response.status_code})")
            tests_failed += 1
    except Exception as e:
        print(f"❌ Trends API - FAIL: {e}")
        tests_failed += 1
    
    print("=" * 50)
    print(f"📊 Results: {tests_passed} passed, {tests_failed} failed")
    
    if tests_failed == 0:
        print("🎉 All smoke tests passed! Platform is ready.")
        return True
    else:
        print("⚠️  Some tests failed. Check the server implementation.")
        return False

if __name__ == "__main__":
    success = run_smoke_tests()
    sys.exit(0 if success else 1)
