#!/usr/bin/env python3
"""
TrustBites Dashboard API Test Suite
Tests all dashboard endpoints with real data
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:3000"

def test_api_endpoint(endpoint, description, params=None):
    """Test a single API endpoint"""
    print(f"\n📡 Testing {description}...")
    
    try:
        start_time = time.time()
        url = f"{BASE_URL}{endpoint}"
        
        if params:
            url += "?" + "&".join([f"{k}={v}" for k, v in params.items()])
        
        response = requests.get(url, timeout=10)
        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print(f"✅ {description} - SUCCESS")
                print(f"   Response Time: {response_time:.0f}ms")
                return True, data.get('data'), response_time
            else:
                print(f"❌ {description} - API Error: {data.get('error', 'Unknown error')}")
                return False, None, response_time
        else:
            print(f"❌ {description} - HTTP {response.status_code}: {response.text}")
            return False, None, response_time
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {description} - Connection Error: Make sure Next.js server is running on port 3000")
        return False, None, 0
    except Exception as e:
        print(f"❌ {description} - Error: {str(e)}")
        return False, None, 0

def main():
    """Run all dashboard API tests"""
    print("🚀 TrustBites Dashboard API Test Suite")
    print("=" * 50)
    
    results = []
    
    # Test 1: Dashboard Summary
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/summary", 
        "Dashboard Summary API"
    )
    results.append(("Dashboard Summary", success, response_time))
    
    if success and data:
        print(f"   📊 Total Reviews: {data.get('totalReviews', 0)}")
        print(f"   🚨 Fake Reviews: {data.get('totalFakeReviews', 0)} ({data.get('fakeReviewPercentage', 0)}%)")
        print(f"   ⭐ Average Rating: {data.get('averageRating', 0)}")
        print(f"   🏪 Total Restaurants: {data.get('totalRestaurants', 0)}")
    
    # Test 2: Recent Reviews (All)
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/recent-reviews", 
        "Recent Reviews API (All)",
        {"limit": "10", "filter": "all"}
    )
    results.append(("Recent Reviews (All)", success, response_time))
    
    if success and data:
        print(f"   📝 Reviews Returned: {len(data.get('reviews', []))}")
        print(f"   📈 Total Available: {data.get('total', 0)}")
        print(f"   🔍 Filter Applied: {data.get('filter', 'none')}")
    
    # Test 3: Recent Reviews (Fake Only)
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/recent-reviews", 
        "Recent Reviews API (Fake Only)",
        {"limit": "5", "filter": "fake"}
    )
    results.append(("Recent Reviews (Fake)", success, response_time))
    
    if success and data:
        print(f"   🚨 Fake Reviews Found: {len(data.get('reviews', []))}")
    
    # Test 4: Recent Reviews (Genuine Only)
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/recent-reviews", 
        "Recent Reviews API (Genuine Only)",
        {"limit": "5", "filter": "genuine"}
    )
    results.append(("Recent Reviews (Genuine)", success, response_time))
    
    if success and data:
        print(f"   ✅ Genuine Reviews Found: {len(data.get('reviews', []))}")
    
    # Test 5: Fake Review Insights
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/insights", 
        "Fake Review Insights API"
    )
    results.append(("Fake Review Insights", success, response_time))
    
    if success and data:
        print(f"   🔍 Total Fake Reviews Analyzed: {data.get('totalFakeReviews', 0)}")
        print(f"   📋 Common Reasons Found: {len(data.get('commonReasons', []))}")
        print(f"   🌐 Languages Detected: {len(data.get('languageBreakdown', []))}")
        
        # Show top reasons if available
        if data.get('commonReasons'):
            print("   🏆 Top Fake Review Reasons:")
            for reason in data['commonReasons'][:3]:
                print(f"      • {reason.get('reason', 'Unknown')}: {reason.get('count', 0)} times ({reason.get('percentage', 0)}%)")
    
    # Test 6: Trends Analytics (30 days)
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/trends", 
        "Trends Analytics API (30 days)",
        {"period": "30"}
    )
    results.append(("Trends Analytics (30d)", success, response_time))
    
    if success and data:
        print(f"   📅 Period Analyzed: {data.get('period', 0)} days")
        print(f"   📊 Reviews in Period: {data.get('totalReviews', 0)}")
        avg_rating_trend = data.get('averageRatingTrend', {})
        print(f"   ⭐ Rating Trend: {avg_rating_trend.get('trend', 'unknown')} (Current: {avg_rating_trend.get('current', 0)})")
    
    # Test 7: Trends Analytics (7 days)
    success, data, response_time = test_api_endpoint(
        "/api/dashboard/trends", 
        "Trends Analytics API (7 days)",
        {"period": "7"}
    )
    results.append(("Trends Analytics (7d)", success, response_time))
    
    # Summary Report
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY REPORT")
    print("=" * 50)
    
    successful_tests = [r for r in results if r[1]]
    failed_tests = [r for r in results if not r[1]]
    
    print(f"✅ Successful Tests: {len(successful_tests)}")
    print(f"❌ Failed Tests: {len(failed_tests)}")
    print(f"📊 Success Rate: {(len(successful_tests) / len(results) * 100):.1f}%")
    
    if successful_tests:
        avg_response_time = sum([r[2] for r in successful_tests if r[2] > 0]) / len([r for r in successful_tests if r[2] > 0])
        print(f"⚡ Average Response Time: {avg_response_time:.0f}ms")
    
    if failed_tests:
        print("\n❌ FAILED TESTS:")
        for test_name, _, _ in failed_tests:
            print(f"   • {test_name}")
    
    print(f"\n🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🎉 Dashboard API Testing Complete!")
    
    if len(successful_tests) == len(results):
        print("🏆 ALL TESTS PASSED! Your dashboard APIs are ready for production!")
    elif len(successful_tests) > 0:
        print("⚠️ Some tests passed. Check failed tests and ensure Next.js server is running.")
    else:
        print("🚨 All tests failed. Make sure your Next.js server is running on port 3000.")

if __name__ == "__main__":
    main()