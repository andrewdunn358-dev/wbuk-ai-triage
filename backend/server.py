from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import hashlib
from emergentintegrations.llm.chat import LlmChat, UserMessage
from decision_engine import (
    ENHANCED_SYSTEM_PROMPT,
    calculate_protection_score,
    calculate_risk_score,
    score_qualifying_disclosure,
    score_public_interest,
    score_worker_status,
    score_reasonable_belief,
    get_prescribed_persons,
    PRESCRIBED_PERSONS
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'wbuk-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="WBUK AI Triage API")

# Create routers
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class SessionCreate(BaseModel):
    user_agent_hash: Optional[str] = None

class SessionResponse(BaseModel):
    session_token: str
    created_at: str
    expires_at: str
    status: str

class MessageCreate(BaseModel):
    session_token: str
    content: str

class MessageResponse(BaseModel):
    message_id: str
    role: str
    content: str
    created_at: str
    triage_step: Optional[str] = None

class ChatHistoryResponse(BaseModel):
    messages: List[MessageResponse]
    triage_state: Optional[Dict[str, Any]] = None

class CaseSummaryResponse(BaseModel):
    case_reference: str
    classification: Dict[str, Any]
    legal_assessment: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommended_actions: List[str]
    ai_summary: str

class CaseSubmitRequest(BaseModel):
    session_token: str

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginResponse(BaseModel):
    token: str
    email: str
    name: str
    role: str

class AdminCaseListResponse(BaseModel):
    cases: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int

class AdminCaseDetailResponse(BaseModel):
    case: Dict[str, Any]
    messages: List[Dict[str, Any]]

class CaseStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class CaseNoteCreate(BaseModel):
    content: str
    is_internal: bool = True

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_case_reference():
    year = datetime.now(timezone.utc).year
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"WBUK-{year}-{unique_id}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_jwt_token(credentials.credentials)
    admin = await db.admin_users.find_one({"user_id": payload.get("user_id")}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

async def log_audit(actor_type: str, action: str, resource_type: str, resource_id: str, details: dict = None, user_id: str = None):
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": {"type": actor_type, "user_id": user_id},
        "action": action,
        "resource": {"type": resource_type, "id": resource_id},
        "details": details or {},
        "outcome": "success"
    })

# =============================================================================
# AI TRIAGE SYSTEM PROMPT (Using Enhanced Version from decision_engine.py)
# =============================================================================

SYSTEM_PROMPT = ENHANCED_SYSTEM_PROMPT

# =============================================================================
# SESSION ENDPOINTS
# =============================================================================

@api_router.post("/session/create", response_model=SessionResponse)
async def create_session(data: SessionCreate):
    """Create an anonymous session for triage"""
    session_token = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=24)
    
    session_doc = {
        "session_token": session_token,
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "last_activity": now.isoformat(),
        "status": "active",
        "is_submitted": False,
        "user_agent_hash": data.user_agent_hash,
        "triage_state": {
            "current_step": "welcome",
            "data_collected": {}
        }
    }
    
    await db.sessions.insert_one(session_doc)
    await log_audit("anonymous_user", "session_created", "session", session_token)
    
    return SessionResponse(
        session_token=session_token,
        created_at=session_doc["created_at"],
        expires_at=session_doc["expires_at"],
        status="active"
    )

@api_router.get("/session/verify/{session_token}")
async def verify_session(session_token: str):
    """Verify if a session is still valid"""
    session = await db.sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        await db.sessions.update_one(
            {"session_token": session_token},
            {"$set": {"status": "expired"}}
        )
        raise HTTPException(status_code=401, detail="Session expired")
    
    return {"valid": True, "status": session["status"]}

# =============================================================================
# CHAT ENDPOINTS
# =============================================================================

@api_router.post("/chat/message", response_model=MessageResponse)
async def send_message(data: MessageCreate):
    """Send a message and get AI response"""
    # Verify session
    session = await db.sessions.find_one(
        {"session_token": data.session_token, "status": "active"},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired session")
    
    # Save user message
    user_message_id = str(uuid.uuid4())
    user_message_doc = {
        "message_id": user_message_id,
        "session_id": data.session_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": "user",
        "content": data.content,
        "triage_step": session.get("triage_state", {}).get("current_step", "conversation")
    }
    await db.messages.insert_one(user_message_doc)
    
    # Get conversation history
    history = await db.messages.find(
        {"session_id": data.session_token},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # Build messages for AI
    messages_for_ai = []
    for msg in history:
        messages_for_ai.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Get AI response
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=data.session_token,
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        # Build context from history
        context = "\n".join([f"{m['role']}: {m['content']}" for m in messages_for_ai[:-1]]) if len(messages_for_ai) > 1 else ""
        full_message = f"Previous conversation:\n{context}\n\nUser's latest message: {data.content}" if context else data.content
        
        user_msg = UserMessage(text=full_message)
        ai_response = await chat.send_message(user_msg)
        
    except Exception as e:
        logger.error(f"AI Error: {str(e)}")
        ai_response = "I apologize, but I'm experiencing technical difficulties. Please try again in a moment. If you're in immediate distress, please contact Samaritans at 116 123."
    
    # Save AI response
    ai_message_id = str(uuid.uuid4())
    ai_message_doc = {
        "message_id": ai_message_id,
        "session_id": data.session_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": "assistant",
        "content": ai_response,
        "triage_step": session.get("triage_state", {}).get("current_step", "conversation")
    }
    await db.messages.insert_one(ai_message_doc)
    
    # Update session last activity
    await db.sessions.update_one(
        {"session_token": data.session_token},
        {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
    )
    
    return MessageResponse(
        message_id=ai_message_id,
        role="assistant",
        content=ai_response,
        created_at=ai_message_doc["created_at"],
        triage_step=ai_message_doc["triage_step"]
    )

@api_router.get("/chat/history/{session_token}", response_model=ChatHistoryResponse)
async def get_chat_history(session_token: str):
    """Get chat history for a session"""
    session = await db.sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = await db.messages.find(
        {"session_id": session_token},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return ChatHistoryResponse(
        messages=[MessageResponse(
            message_id=m["message_id"],
            role=m["role"],
            content=m["content"],
            created_at=m["created_at"],
            triage_step=m.get("triage_step")
        ) for m in messages],
        triage_state=session.get("triage_state")
    )

@api_router.post("/chat/start/{session_token}")
async def start_chat(session_token: str):
    """Get the initial AI welcome message"""
    session = await db.sessions.find_one(
        {"session_token": session_token, "status": "active"},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired session")
    
    # Check if already has messages
    existing = await db.messages.find_one({"session_id": session_token})
    if existing:
        return {"status": "already_started"}
    
    welcome_message = """Welcome to WBUK's confidential disclosure intake service.

You can speak freely here. This conversation is anonymous and encrypted. I will help you:

- Understand whether your concern may qualify as a protected disclosure
- Assess any risks you might face  
- Guide you toward appropriate next steps

**Important:** I am an AI assistant providing guidance, not legal advice. Any assessment I provide is preliminary and subject to review by WBUK's qualified advisors.

To begin, could you briefly describe the nature of your concern? You don't need to provide specific details yet - just a general sense of what type of issue you wish to report."""
    
    # Save welcome message
    ai_message_doc = {
        "message_id": str(uuid.uuid4()),
        "session_id": session_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": "assistant",
        "content": welcome_message,
        "triage_step": "welcome"
    }
    await db.messages.insert_one(ai_message_doc)
    
    return MessageResponse(
        message_id=ai_message_doc["message_id"],
        role="assistant",
        content=welcome_message,
        created_at=ai_message_doc["created_at"],
        triage_step="welcome"
    )

# =============================================================================
# TRIAGE/CASE ENDPOINTS
# =============================================================================

@api_router.post("/triage/generate-summary/{session_token}")
async def generate_case_summary(session_token: str):
    """Generate a structured case summary from the conversation"""
    session = await db.sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all messages
    messages = await db.messages.find(
        {"session_id": session_token},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    if len(messages) < 4:
        raise HTTPException(status_code=400, detail="Not enough conversation to generate summary. Please continue the triage conversation.")
    
    # Build conversation text
    conversation = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
    
    # Generate structured summary using AI
    summary_prompt = f"""Based on the following triage conversation, generate a structured case summary in JSON format.

CONVERSATION:
{conversation}

Generate a JSON response with this exact structure:
{{
    "classification": {{
        "organisation_sector": "string",
        "wrongdoing_type": "string",
        "whistleblower_role": "string",
        "evidence_available": ["list of evidence types"]
    }},
    "legal_assessment": {{
        "likely_protected_disclosure": true/false,
        "confidence": "High/Medium/Low",
        "relevant_legislation": ["list"],
        "prescribed_persons": ["relevant regulators if any"]
    }},
    "risk_assessment": {{
        "overall_risk": "Critical/High/Medium/Low",
        "employment_risk": "High/Medium/Low",
        "retaliation_risk": "High/Medium/Low",
        "risk_factors": ["list"]
    }},
    "recommended_actions": ["list of next steps"],
    "executive_summary": "Brief summary of the case",
    "urgency": "Immediate/Urgent/Standard"
}}

Respond ONLY with valid JSON, no other text."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"{session_token}-summary",
            system_message="You are a legal analysis assistant. Respond only with valid JSON."
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=summary_prompt)
        ai_response = await chat.send_message(user_msg)
        
        # Parse JSON response
        import json
        # Clean response - remove markdown code blocks if present
        clean_response = ai_response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        summary_data = json.loads(clean_response)
        
    except Exception as e:
        logger.error(f"Summary generation error: {str(e)}")
        # Provide default structure
        summary_data = {
            "classification": {
                "organisation_sector": "To be determined",
                "wrongdoing_type": "To be determined",
                "whistleblower_role": "To be determined",
                "evidence_available": []
            },
            "legal_assessment": {
                "likely_protected_disclosure": None,
                "confidence": "Low",
                "relevant_legislation": ["Public Interest Disclosure Act 1998"],
                "prescribed_persons": []
            },
            "risk_assessment": {
                "overall_risk": "To be assessed",
                "employment_risk": "To be assessed",
                "retaliation_risk": "To be assessed",
                "risk_factors": []
            },
            "recommended_actions": ["Continue triage conversation", "Consult WBUK advisor"],
            "executive_summary": "Insufficient information for full assessment. Please continue the conversation.",
            "urgency": "Standard"
        }
    
    # Store summary in session
    await db.sessions.update_one(
        {"session_token": session_token},
        {"$set": {"case_summary": summary_data, "summary_generated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return summary_data

@api_router.post("/triage/submit", response_model=Dict[str, Any])
async def submit_case(data: CaseSubmitRequest):
    """Submit the case to WBUK advisors"""
    session = await db.sessions.find_one(
        {"session_token": data.session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.get("is_submitted"):
        existing_case = await db.cases.find_one(
            {"session_id": data.session_token},
            {"_id": 0, "case_reference": 1}
        )
        return {"status": "already_submitted", "case_reference": existing_case.get("case_reference") if existing_case else None}
    
    # Generate case reference
    case_reference = generate_case_reference()
    
    # Get summary or generate one
    summary_data = session.get("case_summary")
    if not summary_data:
        # Generate summary first
        await generate_case_summary(data.session_token)
        session = await db.sessions.find_one({"session_token": data.session_token}, {"_id": 0})
        summary_data = session.get("case_summary", {})
    
    # Create case document
    now = datetime.now(timezone.utc).isoformat()
    case_doc = {
        "case_reference": case_reference,
        "session_id": data.session_token,
        "created_at": now,
        "updated_at": now,
        "submitted_at": now,
        "classification": summary_data.get("classification", {}),
        "legal_assessment": summary_data.get("legal_assessment", {}),
        "risk_assessment": summary_data.get("risk_assessment", {}),
        "ai_summary": {
            "executive_summary": summary_data.get("executive_summary", ""),
            "recommended_actions": summary_data.get("recommended_actions", []),
            "urgency_level": summary_data.get("urgency", "Standard"),
            "generated_at": now
        },
        "case_status": "New",
        "priority": "P2" if summary_data.get("risk_assessment", {}).get("overall_risk") in ["Critical", "High"] else "P3",
        "assigned_to": None,
        "tags": [],
        "evidence_files": [],
        "status_history": [{
            "status": "New",
            "changed_at": now,
            "notes": "Case submitted via AI triage"
        }]
    }
    
    await db.cases.insert_one(case_doc)
    
    # Update session
    await db.sessions.update_one(
        {"session_token": data.session_token},
        {"$set": {"is_submitted": True, "status": "completed", "case_reference": case_reference}}
    )
    
    await log_audit("anonymous_user", "case_submitted", "case", case_reference, {"session_id": data.session_token})
    
    return {
        "status": "submitted",
        "case_reference": case_reference,
        "message": "Your case has been submitted to WBUK advisors. Please save your reference number for follow-up."
    }

@api_router.post("/triage/calculate-scores/{session_token}")
async def calculate_assessment_scores(session_token: str):
    """Calculate detailed protection and risk scores using the decision engine"""
    session = await db.sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all messages
    messages = await db.messages.find(
        {"session_id": session_token},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    if len(messages) < 4:
        raise HTTPException(status_code=400, detail="Not enough conversation data")
    
    # Build conversation for AI analysis
    conversation = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in messages])
    
    # Use AI to extract structured data for scoring
    extraction_prompt = f"""Analyze this whistleblower triage conversation and extract the following information in JSON format:

CONVERSATION:
{conversation}

Extract and return ONLY this JSON structure (use null for unknown values):
{{
    "failure_types": ["list from: criminal_offence, legal_obligation, miscarriage_justice, health_safety, environmental, concealment"],
    "evidence_strength": "strong/moderate/limited/weak",
    "temporal_status": "imminent/ongoing/recent/historical",
    "number_affected": "individual/small_group/department/organisation/public",
    "severity": "minor/moderate/serious/grave",
    "is_public_body": true/false,
    "involves_public_funds": true/false,
    "affects_vulnerable_groups": true/false,
    "has_ongoing_risk": true/false,
    "worker_status": "employee/agency_worker/contractor/nhs_practitioner/former_employee/trainee/volunteer/member_of_public",
    "has_employment_documentation": true/false,
    "information_source": "first_hand/documentary/reliable_second_hand/hearsay/speculation",
    "verification_made": true/false,
    "has_professional_expertise": true/false,
    "account_is_consistent": true/false,
    "sector": "healthcare/financial_services/government/local_government/education/charity/environment/police/other",
    "wrongdoing_type_primary": "string description",
    "employment_risk_score": 0-100,
    "retaliation_risk_score": 0-100,
    "legal_exposure_score": 0-100,
    "financial_risk_score": 0-100,
    "personal_safety_score": 0-100,
    "risk_factors": ["list"],
    "protective_factors": ["list"]
}}

Return ONLY valid JSON."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"{session_token}-scoring",
            system_message="Extract data from conversations. Return only valid JSON."
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=extraction_prompt)
        ai_response = await chat.send_message(user_msg)
        
        # Parse JSON
        import json
        clean_response = ai_response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        extracted_data = json.loads(clean_response)
        
    except Exception as e:
        logger.error(f"Scoring extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze conversation")
    
    # Calculate Stage 1: Qualifying Disclosure
    stage1 = score_qualifying_disclosure(
        failure_types=extracted_data.get("failure_types", []),
        evidence_strength=extracted_data.get("evidence_strength", "limited"),
        temporal_status=extracted_data.get("temporal_status", "historical")
    )
    
    # Calculate Stage 2: Public Interest
    stage2 = score_public_interest(
        number_affected=extracted_data.get("number_affected", "individual"),
        severity=extracted_data.get("severity", "minor"),
        public_body=extracted_data.get("is_public_body", False),
        public_funds=extracted_data.get("involves_public_funds", False),
        vulnerable_groups=extracted_data.get("affects_vulnerable_groups", False),
        ongoing_risk=extracted_data.get("has_ongoing_risk", False)
    )
    
    # Calculate Stage 3: Worker Status
    stage3 = score_worker_status(
        status_category=extracted_data.get("worker_status", "member_of_public"),
        has_documentation=extracted_data.get("has_employment_documentation", False)
    )
    
    # Calculate Stage 4: Reasonable Belief
    stage4 = score_reasonable_belief(
        information_source=extracted_data.get("information_source", "hearsay"),
        verification_made=extracted_data.get("verification_made", False),
        professional_expertise=extracted_data.get("has_professional_expertise", False),
        consistent_account=extracted_data.get("account_is_consistent", True)
    )
    
    # Calculate final protection score
    protection_scores = {
        'stage1_qualifying': stage1['score'],
        'stage2_public_interest': stage2['score'],
        'stage3_worker_status': stage3['score'],
        'stage4_reasonable_belief': stage4['score'],
        'stage5_recipient': 70  # Default - assuming they're reporting appropriately
    }
    
    final_protection = calculate_protection_score(protection_scores)
    
    # Calculate risk scores
    risk_data = {
        'employment_risk': extracted_data.get("employment_risk_score", 50),
        'retaliation_risk': extracted_data.get("retaliation_risk_score", 50),
        'legal_exposure': extracted_data.get("legal_exposure_score", 30),
        'financial_risk': extracted_data.get("financial_risk_score", 40),
        'personal_safety': extracted_data.get("personal_safety_score", 20)
    }
    
    final_risk = calculate_risk_score(risk_data)
    
    # Get prescribed persons
    prescribed = get_prescribed_persons(
        sector=extracted_data.get("sector", "other"),
        wrongdoing_type=extracted_data.get("wrongdoing_type_primary", "")
    )
    
    # Build comprehensive response
    result = {
        "scores": {
            "stage1_qualifying_disclosure": stage1,
            "stage2_public_interest": stage2,
            "stage3_worker_status": stage3,
            "stage4_reasonable_belief": stage4,
            "stage5_recipient": {"score": 70, "threshold_met": True}
        },
        "final_assessment": final_protection,
        "risk_assessment": {
            **final_risk,
            "risk_factors": extracted_data.get("risk_factors", []),
            "protective_factors": extracted_data.get("protective_factors", [])
        },
        "prescribed_persons": prescribed,
        "extracted_data": extracted_data
    }
    
    # Store in session
    await db.sessions.update_one(
        {"session_token": session_token},
        {"$set": {"detailed_scores": result}}
    )
    
    return result

# =============================================================================
# ADMIN AUTH ENDPOINTS
# =============================================================================

@api_router.post("/admin/auth/login", response_model=AdminLoginResponse)
async def admin_login(data: AdminLoginRequest):
    """Admin login"""
    email_hash = hashlib.sha256(data.email.lower().encode()).hexdigest()
    
    admin = await db.admin_users.find_one(
        {"email_hash": email_hash},
        {"_id": 0}
    )
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.get("is_active", False):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    if not verify_password(data.password, admin["password_hash"]):
        # Increment failed attempts
        await db.admin_users.update_one(
            {"email_hash": email_hash},
            {"$inc": {"failed_login_attempts": 1}}
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Reset failed attempts and update last login
    await db.admin_users.update_one(
        {"email_hash": email_hash},
        {
            "$set": {
                "failed_login_attempts": 0,
                "last_login": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    token = create_jwt_token({
        "user_id": admin["user_id"],
        "email_hash": email_hash,
        "role": admin["role"]
    })
    
    await log_audit("admin", "login", "admin_user", admin["user_id"], user_id=admin["user_id"])
    
    return AdminLoginResponse(
        token=token,
        email=data.email,
        name=admin.get("name", "Admin"),
        role=admin["role"]
    )

@api_router.post("/admin/auth/logout")
async def admin_logout(admin: dict = Depends(get_current_admin)):
    """Admin logout"""
    await log_audit("admin", "logout", "admin_user", admin["user_id"], user_id=admin["user_id"])
    return {"status": "logged_out"}

@api_router.get("/admin/auth/me")
async def get_current_admin_info(admin: dict = Depends(get_current_admin)):
    """Get current admin info"""
    return {
        "user_id": admin["user_id"],
        "name": admin.get("name"),
        "role": admin["role"]
    }

# =============================================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# =============================================================================

class AdminUserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "advisor"  # advisor, super_admin, viewer

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class AdminPasswordChange(BaseModel):
    current_password: Optional[str] = None  # Required for self-change
    new_password: str

@api_router.post("/admin/users")
async def create_admin_user(data: AdminUserCreate, admin: dict = Depends(get_current_admin)):
    """Create a new admin/advisor user (super_admin only)"""
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can create users")
    
    # Check if email already exists
    email_hash = hashlib.sha256(data.email.lower().encode()).hexdigest()
    existing = await db.admin_users.find_one({"email_hash": email_hash})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if data.role not in ["super_admin", "advisor", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be: super_admin, advisor, or viewer")
    
    # Validate password strength
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    new_user = {
        "user_id": str(uuid.uuid4()),
        "email_hash": email_hash,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "is_active": True,
        "mfa_enabled": False,
        "failed_login_attempts": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["user_id"],
        "must_change_password": True
    }
    
    await db.admin_users.insert_one(new_user)
    await log_audit("admin", "user_created", "admin_user", new_user["user_id"], 
                   {"email_hash": email_hash, "role": data.role}, user_id=admin["user_id"])
    
    return {
        "status": "created",
        "user_id": new_user["user_id"],
        "email": data.email,
        "name": data.name,
        "role": data.role
    }

@api_router.get("/admin/users")
async def list_admin_users(admin: dict = Depends(get_current_admin)):
    """List all admin users (super_admin only)"""
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can view users")
    
    users = await db.admin_users.find(
        {},
        {"_id": 0, "password_hash": 0, "mfa_secret": 0, "mfa_backup_codes": 0}
    ).to_list(100)
    
    return {"users": users}

@api_router.get("/admin/users/{user_id}")
async def get_admin_user(user_id: str, admin: dict = Depends(get_current_admin)):
    """Get a specific admin user"""
    # Users can view themselves, super_admin can view anyone
    if admin["role"] != "super_admin" and admin["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.admin_users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0, "mfa_secret": 0, "mfa_backup_codes": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@api_router.patch("/admin/users/{user_id}")
async def update_admin_user(user_id: str, data: AdminUserUpdate, admin: dict = Depends(get_current_admin)):
    """Update an admin user (super_admin only, or self for name)"""
    is_self = admin["user_id"] == user_id
    is_super = admin["role"] == "super_admin"
    
    if not is_self and not is_super:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Non-super admins can only update their own name
    if not is_super and (data.role is not None or data.is_active is not None):
        raise HTTPException(status_code=403, detail="Only super admins can change role or status")
    
    user = await db.admin_users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name
    if data.role is not None and is_super:
        if data.role not in ["super_admin", "advisor", "viewer"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        update_fields["role"] = data.role
    if data.is_active is not None and is_super:
        update_fields["is_active"] = data.is_active
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.admin_users.update_one({"user_id": user_id}, {"$set": update_fields})
        await log_audit("admin", "user_updated", "admin_user", user_id, update_fields, user_id=admin["user_id"])
    
    return {"status": "updated", "user_id": user_id}

@api_router.post("/admin/users/{user_id}/password")
async def change_user_password(user_id: str, data: AdminPasswordChange, admin: dict = Depends(get_current_admin)):
    """Change user password (self or super_admin)"""
    is_self = admin["user_id"] == user_id
    is_super = admin["role"] == "super_admin"
    
    if not is_self and not is_super:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.admin_users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If changing own password, verify current password
    if is_self and not is_super:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        if not verify_password(data.current_password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Current password incorrect")
    
    # Validate new password
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    await db.admin_users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "password_hash": hash_password(data.new_password),
                "password_changed_at": datetime.now(timezone.utc).isoformat(),
                "must_change_password": False
            }
        }
    )
    
    await log_audit("admin", "password_changed", "admin_user", user_id, user_id=admin["user_id"])
    
    return {"status": "password_changed"}

@api_router.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: str, admin: dict = Depends(get_current_admin)):
    """Delete an admin user (super_admin only, cannot delete self)"""
    if admin["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can delete users")
    
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = await db.admin_users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.admin_users.delete_one({"user_id": user_id})
    await log_audit("admin", "user_deleted", "admin_user", user_id, user_id=admin["user_id"])
    
    return {"status": "deleted", "user_id": user_id}

# =============================================================================
# ADMIN CASE MANAGEMENT ENDPOINTS
# =============================================================================

@api_router.get("/admin/cases", response_model=AdminCaseListResponse)
async def list_cases(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """List all cases with filtering"""
    query = {}
    
    if status:
        query["case_status"] = status
    if priority:
        query["priority"] = priority
    if search:
        query["$or"] = [
            {"case_reference": {"$regex": search, "$options": "i"}},
            {"ai_summary.executive_summary": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * page_size
    
    cases = await db.cases.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    total = await db.cases.count_documents(query)
    
    await log_audit("admin", "case_list_view", "cases", "all", {"query": query}, user_id=admin["user_id"])
    
    return AdminCaseListResponse(
        cases=cases,
        total=total,
        page=page,
        page_size=page_size
    )

@api_router.get("/admin/cases/{case_reference}", response_model=AdminCaseDetailResponse)
async def get_case_detail(case_reference: str, admin: dict = Depends(get_current_admin)):
    """Get detailed case information"""
    case = await db.cases.find_one(
        {"case_reference": case_reference},
        {"_id": 0}
    )
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get messages
    messages = await db.messages.find(
        {"session_id": case["session_id"]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Get notes
    notes = await db.case_notes.find(
        {"case_reference": case_reference},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    case["notes"] = notes
    
    await log_audit("admin", "case_view", "case", case_reference, user_id=admin["user_id"])
    
    return AdminCaseDetailResponse(case=case, messages=messages)

@api_router.patch("/admin/cases/{case_reference}/status")
async def update_case_status(case_reference: str, data: CaseStatusUpdate, admin: dict = Depends(get_current_admin)):
    """Update case status"""
    case = await db.cases.find_one({"case_reference": case_reference})
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update = {
        "$set": {
            "case_status": data.status,
            "updated_at": now
        },
        "$push": {
            "status_history": {
                "status": data.status,
                "changed_by": admin["user_id"],
                "changed_at": now,
                "notes": data.notes
            }
        }
    }
    
    await db.cases.update_one({"case_reference": case_reference}, update)
    await log_audit("admin", "case_status_update", "case", case_reference, {"new_status": data.status}, user_id=admin["user_id"])
    
    return {"status": "updated", "new_status": data.status}

@api_router.post("/admin/cases/{case_reference}/notes")
async def add_case_note(case_reference: str, data: CaseNoteCreate, admin: dict = Depends(get_current_admin)):
    """Add a note to a case"""
    case = await db.cases.find_one({"case_reference": case_reference})
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    note_doc = {
        "note_id": str(uuid.uuid4()),
        "case_reference": case_reference,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["user_id"],
        "created_by_name": admin.get("name", "Admin"),
        "content": data.content,
        "is_internal": data.is_internal
    }
    
    await db.case_notes.insert_one(note_doc)
    await log_audit("admin", "case_note_added", "case", case_reference, user_id=admin["user_id"])
    
    return {"status": "note_added", "note_id": note_doc["note_id"]}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    """Get dashboard statistics"""
    total_cases = await db.cases.count_documents({})
    new_cases = await db.cases.count_documents({"case_status": "New"})
    in_progress = await db.cases.count_documents({"case_status": "In Progress"})
    high_priority = await db.cases.count_documents({"priority": {"$in": ["P1", "P2"]}})
    
    # Cases by status
    status_pipeline = [
        {"$group": {"_id": "$case_status", "count": {"$sum": 1}}}
    ]
    status_breakdown = await db.cases.aggregate(status_pipeline).to_list(10)
    
    return {
        "total_cases": total_cases,
        "new_cases": new_cases,
        "in_progress": in_progress,
        "high_priority": high_priority,
        "status_breakdown": {s["_id"]: s["count"] for s in status_breakdown}
    }

# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "WBUK AI Triage API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# =============================================================================
# SETUP INITIAL ADMIN
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Create initial admin user if none exists"""
    admin_count = await db.admin_users.count_documents({})
    if admin_count == 0:
        initial_admin = {
            "user_id": str(uuid.uuid4()),
            "email_hash": hashlib.sha256("andyd358@hotmail.com".lower().encode()).hexdigest(),
            "password_hash": hash_password("WBUKAdmin2026!"),
            "name": "Admin",
            "role": "super_admin",
            "is_active": True,
            "mfa_enabled": False,
            "failed_login_attempts": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_users.insert_one(initial_admin)
        logger.info("Initial admin user created")
    
    # Create indexes
    await db.sessions.create_index("session_token", unique=True)
    await db.messages.create_index([("session_id", 1), ("created_at", 1)])
    await db.cases.create_index("case_reference", unique=True)
    await db.cases.create_index("session_id")
    await db.admin_users.create_index("email_hash", unique=True)
    await db.audit_logs.create_index("timestamp")

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
