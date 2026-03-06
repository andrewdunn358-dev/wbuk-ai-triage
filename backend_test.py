#!/usr/bin/env python3
"""
WBUK AI Triage Platform - Backend API Testing
Tests all backend endpoints for the whistleblower triage system
"""

import requests
import sys
import json
import time
from datetime import datetime

class WBUKAPITester:
    def __init__(self, base_url="https://report-safely.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.admin_token and not headers:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {"status": "success"}
            else:
                self.failed_tests.append({
                    "name": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200] if response.text else "No response"
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "name": name,
                "expected": expected_status,
                "actual": "ERROR",
                "response": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, _ = self.run_test("Root Endpoint", "GET", "", 200)
        return success

    def test_create_session(self):
        """Test creating anonymous session"""
        success, response = self.run_test(
            "Create Anonymous Session",
            "POST",
            "session/create",
            200,
            data={"user_agent_hash": "test-hash"}
        )
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            print(f"   Session Token: {self.session_token}")
            return True
        return False

    def test_verify_session(self):
        """Test session verification"""
        if not self.session_token:
            print("❌ No session token available for verification")
            return False
        
        success, _ = self.run_test(
            "Verify Session",
            "GET",
            f"session/verify/{self.session_token}",
            200
        )
        return success

    def test_start_chat(self):
        """Test starting chat with welcome message"""
        if not self.session_token:
            print("❌ No session token available for chat")
            return False
        
        success, response = self.run_test(
            "Start Chat",
            "POST",
            f"chat/start/{self.session_token}",
            200
        )
        
        if success and 'content' in response:
            print(f"   Welcome message: {response['content'][:100]}...")
        return success

    def test_send_message(self):
        """Test sending message and receiving AI response"""
        if not self.session_token:
            print("❌ No session token available for messaging")
            return False
        
        test_message = "I work for a government department and I've discovered potential fraud in procurement contracts. What should I do?"
        
        success, response = self.run_test(
            "Send Message to AI",
            "POST",
            "chat/message",
            200,
            data={
                "session_token": self.session_token,
                "content": test_message
            }
        )
        
        if success and 'content' in response:
            print(f"   AI Response: {response['content'][:150]}...")
            # Wait a bit for AI processing
            time.sleep(2)
        return success

    def test_get_chat_history(self):
        """Test retrieving chat history"""
        if not self.session_token:
            print("❌ No session token available for chat history")
            return False
        
        success, response = self.run_test(
            "Get Chat History",
            "GET",
            f"chat/history/{self.session_token}",
            200
        )
        
        if success and 'messages' in response:
            print(f"   Messages in history: {len(response['messages'])}")
        return success

    def test_generate_summary(self):
        """Test generating case summary"""
        if not self.session_token:
            print("❌ No session token available for summary generation")
            return False
        
        # Send more messages to have enough content for summary
        print("   Sending additional messages for summary...")
        self.run_test(
            "Additional Message 1",
            "POST",
            "chat/message",
            200,
            data={
                "session_token": self.session_token,
                "content": "The fraud involves inflated contracts worth over £500,000. I have documentary evidence."
            }
        )
        time.sleep(2)
        
        self.run_test(
            "Additional Message 2",
            "POST",
            "chat/message",
            200,
            data={
                "session_token": self.session_token,
                "content": "I'm concerned about retaliation as I'm the only person who has access to these records."
            }
        )
        time.sleep(2)
        
        success, response = self.run_test(
            "Generate Case Summary",
            "POST",
            f"triage/generate-summary/{self.session_token}",
            200
        )
        
        if success and 'classification' in response:
            print(f"   Classification: {response.get('classification', {})}")
            print(f"   Risk Assessment: {response.get('risk_assessment', {})}")
        return success

    def test_submit_case(self):
        """Test submitting case to advisors"""
        if not self.session_token:
            print("❌ No session token available for case submission")
            return False
        
        success, response = self.run_test(
            "Submit Case",
            "POST",
            "triage/submit",
            200,
            data={"session_token": self.session_token}
        )
        
        if success and 'case_reference' in response:
            print(f"   Case Reference: {response['case_reference']}")
        return success

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/auth/login",
            200,
            data={
                "email": "andyd358@hotmail.com",
                "password": "WBUKAdmin2026!"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin logged in as: {response.get('name', 'Admin')}")
            return True
        return False

    def test_get_admin_info(self):
        """Test getting current admin info"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        success, response = self.run_test(
            "Get Admin Info",
            "GET",
            "admin/auth/me",
            200
        )
        
        if success:
            print(f"   Admin Info: {response}")
        return success

    def test_get_admin_stats(self):
        """Test getting admin dashboard statistics"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        success, response = self.run_test(
            "Get Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success:
            print(f"   Total Cases: {response.get('total_cases', 0)}")
            print(f"   New Cases: {response.get('new_cases', 0)}")
        return success

    def test_list_cases(self):
        """Test listing cases in admin dashboard"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        success, response = self.run_test(
            "List Admin Cases",
            "GET",
            "admin/cases",
            200
        )
        
        if success and 'cases' in response:
            print(f"   Cases found: {len(response['cases'])}")
            print(f"   Total cases: {response.get('total', 0)}")
        return success

    def test_admin_logout(self):
        """Test admin logout"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        success, _ = self.run_test(
            "Admin Logout",
            "POST",
            "admin/auth/logout",
            200
        )
        
        if success:
            self.admin_token = None
            print("   Admin logged out successfully")
        return success

def main():
    print("🚀 Starting WBUK AI Triage Platform API Tests")
    print("=" * 60)
    
    tester = WBUKAPITester()
    
    # Test sequence - order matters for dependencies
    test_results = {}
    
    # Basic connectivity tests
    test_results['health_check'] = tester.test_health_check()
    test_results['root_endpoint'] = tester.test_root_endpoint()
    
    # Session and chat flow tests
    test_results['create_session'] = tester.test_create_session()
    test_results['verify_session'] = tester.test_verify_session()
    test_results['start_chat'] = tester.test_start_chat()
    test_results['send_message'] = tester.test_send_message()
    test_results['chat_history'] = tester.test_get_chat_history()
    test_results['generate_summary'] = tester.test_generate_summary()
    test_results['submit_case'] = tester.test_submit_case()
    
    # Admin functionality tests
    test_results['admin_login'] = tester.test_admin_login()
    test_results['admin_info'] = tester.test_get_admin_info()
    test_results['admin_stats'] = tester.test_get_admin_stats()
    test_results['list_cases'] = tester.test_list_cases()
    test_results['admin_logout'] = tester.test_admin_logout()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    print("=" * 60)
    
    # Print failed tests if any
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for fail in tester.failed_tests:
            print(f"   - {fail['name']}: Expected {fail['expected']}, got {fail['actual']}")
            if fail['response']:
                print(f"     Response: {fail['response']}")
    
    # Summary by category
    session_tests = ['create_session', 'verify_session']
    chat_tests = ['start_chat', 'send_message', 'chat_history']
    triage_tests = ['generate_summary', 'submit_case']
    admin_tests = ['admin_login', 'admin_info', 'admin_stats', 'list_cases', 'admin_logout']
    
    print(f"\n📈 Results by Category:")
    print(f"   Session Management: {sum(test_results.get(t, False) for t in session_tests)}/{len(session_tests)}")
    print(f"   Chat System: {sum(test_results.get(t, False) for t in chat_tests)}/{len(chat_tests)}")
    print(f"   Triage System: {sum(test_results.get(t, False) for t in triage_tests)}/{len(triage_tests)}")
    print(f"   Admin System: {sum(test_results.get(t, False) for t in admin_tests)}/{len(admin_tests)}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Overall Success Rate: {success_rate:.1f}%")
    
    # Exit code based on success rate
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())