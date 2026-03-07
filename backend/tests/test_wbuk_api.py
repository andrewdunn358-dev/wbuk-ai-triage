"""
WBUK AI Triage Platform - Backend API Tests
Tests: Session creation, Chat APIs, Admin auth, Admin dashboard endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "andyd358@hotmail.com"
ADMIN_PASSWORD = "WBUKAdmin2026!"


class TestHealthCheck:
    """Health check and basic connectivity tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got: {data}"
        print("✓ Health check passed")
    
    def test_root_endpoint(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "version" in data
        print("✓ Root endpoint passed")


class TestSessionEndpoints:
    """Anonymous session creation and verification tests"""
    
    def test_create_session(self):
        """Test /api/session/create creates anonymous session"""
        response = requests.post(
            f"{BASE_URL}/api/session/create",
            json={"user_agent_hash": "test-hash"},
            timeout=10
        )
        assert response.status_code == 200, f"Session create failed: {response.text}"
        
        data = response.json()
        assert "session_token" in data, "Missing session_token in response"
        assert "created_at" in data, "Missing created_at in response"
        assert "expires_at" in data, "Missing expires_at in response"
        assert data.get("status") == "active", f"Expected active status, got: {data.get('status')}"
        
        print(f"✓ Session created: {data['session_token'][:8]}...")
        return data["session_token"]
    
    def test_verify_valid_session(self):
        """Test session verification works"""
        # First create a session
        create_response = requests.post(
            f"{BASE_URL}/api/session/create",
            json={},
            timeout=10
        )
        session_token = create_response.json()["session_token"]
        
        # Then verify it
        verify_response = requests.get(
            f"{BASE_URL}/api/session/verify/{session_token}",
            timeout=10
        )
        assert verify_response.status_code == 200, f"Session verify failed: {verify_response.text}"
        data = verify_response.json()
        assert data.get("valid") == True, f"Session should be valid, got: {data}"
        print("✓ Session verification passed")
    
    def test_verify_invalid_session(self):
        """Test that invalid session returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/session/verify/invalid-token-12345",
            timeout=10
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid session returns 404")


class TestChatEndpoints:
    """Chat start and message endpoints tests"""
    
    @pytest.fixture
    def session_token(self):
        """Create a fresh session for chat tests"""
        response = requests.post(
            f"{BASE_URL}/api/session/create",
            json={},
            timeout=10
        )
        return response.json()["session_token"]
    
    def test_chat_start_returns_welcome_message(self, session_token):
        """Test /api/chat/start/{token} returns welcome message"""
        response = requests.post(
            f"{BASE_URL}/api/chat/start/{session_token}",
            timeout=15
        )
        assert response.status_code == 200, f"Chat start failed: {response.text}"
        
        data = response.json()
        # Either first call returns message, or already_started
        if "status" in data and data["status"] == "already_started":
            print("✓ Chat already started for this session")
        else:
            assert "content" in data, f"Missing content in response: {data}"
            assert "Welcome" in data["content"] or "WBUK" in data["content"], \
                f"Welcome message missing WBUK branding: {data['content'][:100]}..."
            assert data.get("role") == "assistant", f"Expected assistant role"
            print(f"✓ Chat start returned welcome message: {data['content'][:50]}...")
    
    def test_chat_message_ai_response(self, session_token):
        """Test /api/chat/message returns AI response"""
        # First start the chat
        requests.post(f"{BASE_URL}/api/chat/start/{session_token}", timeout=15)
        
        # Send a user message
        response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_token": session_token,
                "content": "I want to report a safety concern at my workplace"
            },
            timeout=60  # AI responses can take time
        )
        assert response.status_code == 200, f"Chat message failed: {response.text}"
        
        data = response.json()
        assert "content" in data, f"Missing content in AI response: {data}"
        assert "message_id" in data, "Missing message_id"
        assert data.get("role") == "assistant", f"Expected assistant role"
        
        # AI should respond conversationally
        content = data["content"]
        assert len(content) > 20, f"AI response too short: {content}"
        print(f"✓ AI responded: {content[:100]}...")
    
    def test_multi_turn_conversation(self, session_token):
        """Test multi-turn conversation maintains context"""
        # Start chat
        requests.post(f"{BASE_URL}/api/chat/start/{session_token}", timeout=15)
        
        # First message
        msg1_response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_token": session_token,
                "content": "I work at a care home in Manchester"
            },
            timeout=60
        )
        assert msg1_response.status_code == 200
        
        # Second message - should maintain context
        msg2_response = requests.post(
            f"{BASE_URL}/api/chat/message",
            json={
                "session_token": session_token,
                "content": "The manager has been reducing staff numbers"
            },
            timeout=60
        )
        assert msg2_response.status_code == 200
        
        # Get chat history to verify context
        history_response = requests.get(
            f"{BASE_URL}/api/chat/history/{session_token}",
            timeout=10
        )
        assert history_response.status_code == 200
        
        data = history_response.json()
        messages = data.get("messages", [])
        
        # Should have welcome + 2 user messages + 2 AI responses = at least 5 messages
        assert len(messages) >= 5, f"Expected at least 5 messages, got {len(messages)}"
        
        # Check user messages are preserved
        user_messages = [m for m in messages if m.get("role") == "user"]
        assert len(user_messages) >= 2, "User messages not preserved"
        print(f"✓ Multi-turn conversation working ({len(messages)} messages)")
    
    def test_chat_history_retrieval(self, session_token):
        """Test /api/chat/history/{token} returns messages"""
        # Start and send a message
        requests.post(f"{BASE_URL}/api/chat/start/{session_token}", timeout=15)
        requests.post(
            f"{BASE_URL}/api/chat/message",
            json={"session_token": session_token, "content": "Test message"},
            timeout=60
        )
        
        # Get history
        response = requests.get(
            f"{BASE_URL}/api/chat/history/{session_token}",
            timeout=10
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "messages" in data, "Missing messages in history"
        assert isinstance(data["messages"], list), "Messages should be a list"
        print(f"✓ Chat history retrieved: {len(data['messages'])} messages")


class TestAdminAuth:
    """Admin authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test /api/admin/auth/login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Missing token in login response"
        assert "email" in data, "Missing email in login response"
        assert "role" in data, "Missing role in login response"
        assert data.get("email") == ADMIN_EMAIL, f"Email mismatch"
        
        print(f"✓ Admin login successful, role: {data['role']}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials return 401")
    
    def test_admin_me_endpoint(self):
        """Test /api/admin/auth/me returns current admin info"""
        # First login
        login_response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        token = login_response.json()["token"]
        
        # Get current admin info
        response = requests.get(
            f"{BASE_URL}/api/admin/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        assert response.status_code == 200, f"Admin me failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Missing user_id"
        assert "role" in data, "Missing role"
        print(f"✓ Admin me endpoint working, user_id: {data['user_id'][:8]}...")


class TestAdminStats:
    """Admin dashboard stats endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        return response.json()["token"]
    
    def test_admin_stats_endpoint(self, admin_token):
        """Test /api/admin/stats returns dashboard statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        assert response.status_code == 200, f"Admin stats failed: {response.text}"
        
        data = response.json()
        assert "total_cases" in data, "Missing total_cases"
        assert "new_cases" in data, "Missing new_cases"
        assert "in_progress" in data, "Missing in_progress"
        assert "high_priority" in data, "Missing high_priority"
        
        print(f"✓ Admin stats: total={data['total_cases']}, new={data['new_cases']}")
    
    def test_admin_stats_requires_auth(self):
        """Test /api/admin/stats requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin stats requires authentication")


class TestAdminCaseList:
    """Admin case list endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10
        )
        return response.json()["token"]
    
    def test_admin_cases_list(self, admin_token):
        """Test /api/admin/cases returns case list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cases",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        assert response.status_code == 200, f"Admin cases failed: {response.text}"
        
        data = response.json()
        assert "cases" in data, "Missing cases in response"
        assert "total" in data, "Missing total count"
        assert "page" in data, "Missing page"
        assert "page_size" in data, "Missing page_size"
        
        print(f"✓ Admin cases: {data['total']} total cases")
    
    def test_admin_cases_pagination(self, admin_token):
        """Test case list pagination"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cases?page=1&page_size=10",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("page") == 1, f"Expected page 1, got {data.get('page')}"
        assert data.get("page_size") == 10, f"Expected page_size 10, got {data.get('page_size')}"
        print("✓ Pagination works correctly")
    
    def test_admin_cases_filter_by_status(self, admin_token):
        """Test case list filtering by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cases?status=New",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        assert response.status_code == 200
        
        data = response.json()
        # If there are cases, they should all be "New" status
        for case in data.get("cases", []):
            assert case.get("case_status") == "New", f"Case has wrong status: {case.get('case_status')}"
        print("✓ Status filter works")
    
    def test_admin_cases_requires_auth(self):
        """Test /api/admin/cases requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/cases",
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin cases requires authentication")


class TestEvidenceUpload:
    """Evidence upload endpoint tests (if applicable)"""
    
    @pytest.fixture
    def session_token(self):
        """Create a fresh session"""
        response = requests.post(
            f"{BASE_URL}/api/session/create",
            json={},
            timeout=10
        )
        return response.json()["session_token"]
    
    def test_evidence_list_for_session(self, session_token):
        """Test listing evidence for a session"""
        response = requests.get(
            f"{BASE_URL}/api/evidence/list/{session_token}",
            timeout=10
        )
        assert response.status_code == 200, f"Evidence list failed: {response.text}"
        
        data = response.json()
        assert "evidence" in data, "Missing evidence list"
        assert "count" in data, "Missing count"
        print(f"✓ Evidence list: {data['count']} files")


class TestTriageEndpoints:
    """Triage and case submission endpoint tests"""
    
    @pytest.fixture
    def session_with_chat(self):
        """Create session and have a brief conversation"""
        # Create session
        session_response = requests.post(
            f"{BASE_URL}/api/session/create",
            json={},
            timeout=10
        )
        session_token = session_response.json()["session_token"]
        
        # Start chat
        requests.post(f"{BASE_URL}/api/chat/start/{session_token}", timeout=15)
        
        # Send a few messages to build conversation
        messages = [
            "I work at a hospital in London",
            "I've seen patient records being accessed without authorization",
            "This has been happening for months",
            "Several staff members are involved"
        ]
        
        for msg in messages:
            requests.post(
                f"{BASE_URL}/api/chat/message",
                json={"session_token": session_token, "content": msg},
                timeout=60
            )
        
        return session_token
    
    def test_case_submission(self, session_with_chat):
        """Test submitting a case after triage conversation"""
        response = requests.post(
            f"{BASE_URL}/api/triage/submit",
            json={"session_token": session_with_chat},
            timeout=30
        )
        assert response.status_code == 200, f"Case submit failed: {response.text}"
        
        data = response.json()
        assert "case_reference" in data, "Missing case_reference"
        assert "status" in data, "Missing status"
        assert data["status"] in ["submitted", "already_submitted"]
        
        case_ref = data.get("case_reference")
        assert case_ref and case_ref.startswith("WBUK-"), f"Invalid case reference: {case_ref}"
        print(f"✓ Case submitted: {case_ref}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
