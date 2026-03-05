# WBUK AI Triage Platform
## Comprehensive Recommendations Plan

**Document Version:** 1.0  
**Date:** January 2026  
**Purpose:** Technical specification for secure AI-powered whistleblower intake system

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [AI Prompt Structure](#3-ai-prompt-structure)
4. [Secure VPS Deployment Plan](#4-secure-vps-deployment-plan)

---

# 1. System Architecture

## 1.1 High-Level Architecture Diagram

```
                                    INTERNET
                                        │
                                        ▼
                    ┌───────────────────────────────────────┐
                    │           CLOUDFLARE / WAF            │
                    │    (DDoS Protection, Rate Limiting)   │
                    └───────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VPS (Ubuntu 22.04 LTS)                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         NGINX REVERSE PROXY                           │  │
│  │                    (SSL/TLS Termination, HTTPS)                       │  │
│  │                      Let's Encrypt Certificates                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                          │                    │                             │
│                          ▼                    ▼                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │     FRONTEND CONTAINER      │  │        BACKEND CONTAINER            │  │
│  │         (React/Next.js)     │  │          (FastAPI/Python)           │  │
│  │                             │  │                                     │  │
│  │  • Anonymous Chat UI        │  │  • REST API Endpoints               │  │
│  │  • Admin Dashboard          │  │  • Session Management               │  │
│  │  • Evidence Upload Portal   │  │  • Authentication (Admin)           │  │
│  │  • Case Viewer              │  │  • File Processing                  │  │
│  │                             │  │  • Metadata Stripping               │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                               │                             │
│                          ┌────────────────────┼────────────────────┐       │
│                          ▼                    ▼                    ▼       │
│  ┌─────────────────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    MONGODB CONTAINER        │  │  AI SERVICE     │  │  FILE STORAGE   │ │
│  │    (Encrypted at Rest)      │  │  CONTAINER      │  │  (MinIO/S3)     │ │
│  │                             │  │                 │  │                 │ │
│  │  • Cases Collection         │  │  • OpenAI       │  │  • Encrypted    │ │
│  │  • Sessions Collection      │  │    GPT-5.2      │  │    Documents    │ │
│  │  • Messages Collection      │  │  • Legal        │  │  • Evidence     │ │
│  │  • Admin Users              │  │    Context      │  │  • Audit Logs   │ │
│  │  • Audit Logs               │  │  • Triage       │  │                 │ │
│  │                             │  │    Engine       │  │                 │ │
│  └─────────────────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                               │                             │
└───────────────────────────────────────────────│─────────────────────────────┘
                                                │
                                                ▼
                                   ┌─────────────────────┐
                                   │    OpenAI API       │
                                   │    (External)       │
                                   │    GPT-5.2          │
                                   └─────────────────────┘
```

## 1.2 Component Architecture

### Frontend Layer
```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND APPLICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PUBLIC INTERFACE                    ADMIN INTERFACE             │
│  ───────────────                    ────────────────             │
│  ┌─────────────────┐                ┌─────────────────┐         │
│  │  Landing Page   │                │  Login Portal   │         │
│  │  • Security     │                │  • MFA Required │         │
│  │    Notice       │                │  • Session      │         │
│  │  • Start Chat   │                │    Timeout      │         │
│  └────────┬────────┘                └────────┬────────┘         │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌─────────────────┐                ┌─────────────────┐         │
│  │  Chat Interface │                │  Dashboard      │         │
│  │  • Anonymous    │                │  • Case List    │         │
│  │  • Encrypted    │                │  • Search       │         │
│  │  • No Tracking  │                │  • Filters      │         │
│  └────────┬────────┘                └────────┬────────┘         │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌─────────────────┐                ┌─────────────────┐         │
│  │  Evidence       │                │  Case Detail    │         │
│  │  Upload         │                │  • Summary      │         │
│  │  • Drag/Drop    │                │  • Messages     │         │
│  │  • Encryption   │                │  • Evidence     │         │
│  │  • Strip Meta   │                │  • Notes        │         │
│  └────────┬────────┘                └────────┬────────┘         │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌─────────────────┐                ┌─────────────────┐         │
│  │  Case Summary   │                │  Case Actions   │         │
│  │  • Review       │                │  • Status       │         │
│  │  • Submit       │                │  • Assign       │         │
│  │  • Reference ID │                │  • Export       │         │
│  └─────────────────┘                └─────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend API Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/v1/                                                        │
│  ├── /session                                                    │
│  │   ├── POST   /create          → Create anonymous session      │
│  │   ├── GET    /verify/{id}     → Verify session validity       │
│  │   └── DELETE /end/{id}        → End session securely          │
│  │                                                               │
│  ├── /chat                                                       │
│  │   ├── POST   /message         → Send message to AI            │
│  │   ├── GET    /history/{sid}   → Get chat history (session)    │
│  │   └── POST   /typing          → Typing indicator              │
│  │                                                               │
│  ├── /triage                                                     │
│  │   ├── POST   /analyse         → Trigger AI analysis           │
│  │   ├── GET    /summary/{sid}   → Get case summary              │
│  │   └── POST   /submit          → Submit to WBUK advisors       │
│  │                                                               │
│  ├── /evidence                                                   │
│  │   ├── POST   /upload          → Upload with encryption        │
│  │   ├── GET    /list/{sid}      → List uploaded files           │
│  │   └── DELETE /remove/{fid}    → Secure file deletion          │
│  │                                                               │
│  └── /admin (Authenticated)                                      │
│      ├── POST   /auth/login      → Admin login with MFA          │
│      ├── POST   /auth/logout     → Secure logout                 │
│      ├── GET    /cases           → List all cases                │
│      ├── GET    /cases/{id}      → Get case detail               │
│      ├── PATCH  /cases/{id}      → Update case status            │
│      ├── POST   /cases/{id}/note → Add internal note             │
│      └── GET    /audit           → View audit logs               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WHISTLEBLOWER JOURNEY                              │
└─────────────────────────────────────────────────────────────────────────────┘

    USER                    SYSTEM                      AI                 ADMIN
     │                        │                         │                    │
     │  1. Access Site        │                         │                    │
     │───────────────────────▶│                         │                    │
     │                        │                         │                    │
     │  2. Generate Anon      │                         │                    │
     │     Session Token      │                         │                    │
     │◀───────────────────────│                         │                    │
     │                        │                         │                    │
     │  3. User Message       │                         │                    │
     │───────────────────────▶│  4. Process + Context   │                    │
     │                        │────────────────────────▶│                    │
     │                        │                         │                    │
     │                        │  5. AI Response         │                    │
     │  6. Display Response   │◀────────────────────────│                    │
     │◀───────────────────────│                         │                    │
     │                        │                         │                    │
     │         [TRIAGE CONVERSATION LOOP]               │                    │
     │                        │                         │                    │
     │  7. Upload Evidence    │                         │                    │
     │───────────────────────▶│                         │                    │
     │                        │  8. Strip Metadata      │                    │
     │                        │  9. Encrypt + Store     │                    │
     │  10. Confirm Upload    │                         │                    │
     │◀───────────────────────│                         │                    │
     │                        │                         │                    │
     │  11. Request Summary   │                         │                    │
     │───────────────────────▶│  12. Generate Report    │                    │
     │                        │────────────────────────▶│                    │
     │                        │  13. Structured Summary │                    │
     │  14. Display Summary   │◀────────────────────────│                    │
     │◀───────────────────────│                         │                    │
     │                        │                         │                    │
     │  15. Submit to WBUK    │                         │                    │
     │───────────────────────▶│                         │                    │
     │                        │  16. Notify Advisors    │                    │
     │  17. Reference ID      │                         │───────────────────▶│
     │◀───────────────────────│                         │                    │
     │                        │                         │   18. Review Case  │
     │                        │                         │◀───────────────────│
     │                        │                         │                    │
     ▼                        ▼                         ▼                    ▼
```

## 1.4 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 1: NETWORK SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Cloudflare WAF (Web Application Firewall)                                │
│  • DDoS Protection                                                          │
│  • Rate Limiting (100 req/min per session)                                  │
│  • Geographic restrictions (UK-focused, optional)                           │
│  • TLS 1.3 only                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 2: APPLICATION SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  • No IP logging (privacy by design)                                        │
│  • Anonymous session tokens (UUID v4)                                       │
│  • Session expiry (24 hours)                                                │
│  • CSRF protection                                                          │
│  • XSS prevention (Content Security Policy)                                 │
│  • Input sanitization                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 3: DATA SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  • MongoDB encryption at rest (AES-256)                                     │
│  • Field-level encryption for sensitive data                                │
│  • File encryption (AES-256-GCM)                                            │
│  • Metadata stripping (ExifTool)                                            │
│  • Secure key management (HashiCorp Vault or env secrets)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 4: ACCESS CONTROL
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Role-based access (RBAC)                                                 │
│  • Multi-factor authentication (TOTP)                                       │
│  • Session timeout (15 min inactivity for admin)                            │
│  • Audit logging (all admin actions)                                        │
│  • IP allowlisting for admin access (optional)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Database Schema

## 2.1 MongoDB Collections Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE: wbuk_triage                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  sessions   │  │   cases     │  │  messages   │  │  evidence   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ admin_users │  │ audit_logs  │  │ case_notes  │  │  settings   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Collection Schemas

### sessions
```javascript
{
  "_id": ObjectId,
  "session_token": String,          // UUID v4 (indexed, unique)
  "created_at": ISODate,
  "expires_at": ISODate,
  "last_activity": ISODate,
  "status": String,                 // "active", "completed", "expired"
  "is_submitted": Boolean,
  "user_agent_hash": String,        // Hashed, not stored raw
  "metadata": {
    "started_triage": Boolean,
    "completed_triage": Boolean,
    "evidence_uploaded": Boolean
  }
}

// Indexes
db.sessions.createIndex({ "session_token": 1 }, { unique: true })
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })
db.sessions.createIndex({ "status": 1, "created_at": -1 })
```

### cases
```javascript
{
  "_id": ObjectId,
  "case_reference": String,         // "WBUK-2026-XXXXX" (indexed, unique)
  "session_id": String,             // Reference to session_token
  "created_at": ISODate,
  "updated_at": ISODate,
  "submitted_at": ISODate,
  
  // Triage Classification
  "classification": {
    "organisation": {
      "name": String,               // Encrypted
      "sector": String,             // NHS, Corporate, Government, Charity, Other
      "size": String                // Small, Medium, Large, Unknown
    },
    "wrongdoing_type": {
      "primary": String,            // Main category
      "secondary": [String],        // Additional categories
      "description": String         // Encrypted
    },
    "whistleblower_role": String,   // Employee, Contractor, Former Employee, Public
    "evidence_status": {
      "has_documents": Boolean,
      "has_emails": Boolean,
      "has_witnesses": Boolean,
      "has_direct_observation": Boolean,
      "evidence_strength": String   // Strong, Moderate, Limited
    }
  },
  
  // Legal Assessment
  "legal_assessment": {
    "pida_qualification": {
      "likely_protected": Boolean,
      "confidence": String,         // High, Medium, Low
      "reasoning": String
    },
    "disclosure_category": String,  // Protected Disclosure, Grievance, Employment Dispute, Public Safety, Fraud/Corruption
    "relevant_legislation": [String],
    "prescribed_persons": [{
      "name": String,
      "relevance": String
    }]
  },
  
  // Risk Assessment
  "risk_assessment": {
    "overall_risk": String,         // Critical, High, Medium, Low
    "job_loss_risk": String,
    "retaliation_risk": String,
    "legal_exposure_risk": String,
    "personal_safety_risk": String,
    "risk_factors": [String],
    "protective_factors": [String]
  },
  
  // AI Generated Summary
  "ai_summary": {
    "executive_summary": String,
    "key_facts": [String],
    "recommended_actions": [String],
    "suggested_reporting_path": String,
    "urgency_level": String,        // Immediate, Urgent, Standard
    "generated_at": ISODate
  },
  
  // Case Management
  "case_status": String,            // New, Under Review, In Progress, Escalated, Resolved, Closed
  "assigned_to": ObjectId,          // Reference to admin_user
  "priority": String,               // P1, P2, P3
  "tags": [String],
  
  // Evidence References
  "evidence_files": [ObjectId],     // References to evidence collection
  
  // Timestamps
  "status_history": [{
    "status": String,
    "changed_by": ObjectId,
    "changed_at": ISODate,
    "notes": String
  }]
}

// Indexes
db.cases.createIndex({ "case_reference": 1 }, { unique: true })
db.cases.createIndex({ "session_id": 1 })
db.cases.createIndex({ "case_status": 1, "priority": 1 })
db.cases.createIndex({ "assigned_to": 1 })
db.cases.createIndex({ "created_at": -1 })
db.cases.createIndex({ "classification.organisation.sector": 1 })
db.cases.createIndex({ "classification.wrongdoing_type.primary": 1 })
```

### messages
```javascript
{
  "_id": ObjectId,
  "session_id": String,             // Reference to session_token
  "message_id": String,             // UUID v4
  "created_at": ISODate,
  "role": String,                   // "user", "assistant", "system"
  "content": String,                // Encrypted
  "content_hash": String,           // For integrity verification
  "metadata": {
    "triage_step": String,          // Current step in triage flow
    "extracted_data": Object,       // Structured data extracted by AI
    "tokens_used": Number
  }
}

// Indexes
db.messages.createIndex({ "session_id": 1, "created_at": 1 })
db.messages.createIndex({ "message_id": 1 }, { unique: true })
```

### evidence
```javascript
{
  "_id": ObjectId,
  "file_id": String,                // UUID v4
  "session_id": String,
  "case_id": ObjectId,
  "uploaded_at": ISODate,
  
  // File Information
  "original_filename": String,      // Encrypted
  "sanitized_filename": String,
  "file_type": String,              // pdf, doc, jpg, etc.
  "mime_type": String,
  "file_size": Number,              // Bytes
  
  // Storage
  "storage_path": String,           // Encrypted path in object storage
  "encryption_key_id": String,      // Reference to encryption key
  "checksum": String,               // SHA-256 hash of encrypted file
  
  // Metadata Stripping
  "metadata_stripped": Boolean,
  "original_metadata_hash": String, // For audit only
  "stripping_log": String,
  
  // Access Control
  "access_log": [{
    "accessed_by": ObjectId,
    "accessed_at": ISODate,
    "action": String                // "view", "download"
  }],
  
  // Status
  "status": String,                 // "uploaded", "processed", "deleted"
  "deleted_at": ISODate,
  "deletion_reason": String
}

// Indexes
db.evidence.createIndex({ "file_id": 1 }, { unique: true })
db.evidence.createIndex({ "session_id": 1 })
db.evidence.createIndex({ "case_id": 1 })
db.evidence.createIndex({ "uploaded_at": -1 })
```

### admin_users
```javascript
{
  "_id": ObjectId,
  "user_id": String,                // UUID v4
  "email": String,                  // Encrypted
  "email_hash": String,             // For lookups
  "password_hash": String,          // Argon2id
  "name": String,                   // Encrypted
  "role": String,                   // "super_admin", "advisor", "viewer"
  
  // MFA
  "mfa_enabled": Boolean,
  "mfa_secret": String,             // Encrypted TOTP secret
  "mfa_backup_codes": [String],     // Encrypted
  
  // Security
  "failed_login_attempts": Number,
  "locked_until": ISODate,
  "last_login": ISODate,
  "password_changed_at": ISODate,
  "must_change_password": Boolean,
  
  // Session Management
  "active_sessions": [{
    "session_id": String,
    "created_at": ISODate,
    "expires_at": ISODate,
    "ip_hash": String,
    "user_agent_hash": String
  }],
  
  // Metadata
  "created_at": ISODate,
  "updated_at": ISODate,
  "created_by": ObjectId,
  "is_active": Boolean
}

// Indexes
db.admin_users.createIndex({ "user_id": 1 }, { unique: true })
db.admin_users.createIndex({ "email_hash": 1 }, { unique: true })
db.admin_users.createIndex({ "role": 1 })
```

### audit_logs
```javascript
{
  "_id": ObjectId,
  "log_id": String,                 // UUID v4
  "timestamp": ISODate,
  "actor": {
    "type": String,                 // "admin", "system", "anonymous_user"
    "user_id": ObjectId,            // If admin
    "session_token": String         // If anonymous user
  },
  "action": String,                 // "case_view", "case_update", "evidence_download", etc.
  "resource": {
    "type": String,                 // "case", "evidence", "admin_user"
    "id": String
  },
  "details": Object,                // Action-specific details
  "ip_hash": String,                // Hashed IP for security
  "user_agent_hash": String,
  "outcome": String                 // "success", "failure", "blocked"
}

// Indexes
db.audit_logs.createIndex({ "timestamp": -1 })
db.audit_logs.createIndex({ "actor.user_id": 1 })
db.audit_logs.createIndex({ "action": 1 })
db.audit_logs.createIndex({ "resource.type": 1, "resource.id": 1 })

// TTL Index (retain for 7 years for compliance)
db.audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 220752000 })
```

### case_notes
```javascript
{
  "_id": ObjectId,
  "note_id": String,                // UUID v4
  "case_id": ObjectId,
  "created_at": ISODate,
  "created_by": ObjectId,           // Reference to admin_user
  "content": String,                // Encrypted
  "is_internal": Boolean,           // Internal notes vs shared
  "attachments": [String],          // File references if any
  "edited_at": ISODate,
  "edited_by": ObjectId
}

// Indexes
db.case_notes.createIndex({ "case_id": 1, "created_at": -1 })
db.case_notes.createIndex({ "created_by": 1 })
```

## 2.3 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ENTITY RELATIONSHIPS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   SESSION   │
    │─────────────│
    │ session_token (PK)
    │ created_at  │
    │ expires_at  │
    │ status      │
    └──────┬──────┘
           │
           │ 1:N
           ▼
    ┌─────────────┐         1:N         ┌─────────────┐
    │   MESSAGES  │◀───────────────────▶│    CASE     │
    │─────────────│                     │─────────────│
    │ message_id (PK)                   │ case_reference (PK)
    │ session_id (FK)                   │ session_id (FK)
    │ role        │                     │ classification
    │ content     │                     │ legal_assessment
    └─────────────┘                     │ risk_assessment
                                        │ ai_summary
                                        │ case_status
                                        └──────┬──────┘
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      │                        │                        │
                      ▼ 1:N                    ▼ 1:N                    ▼ N:1
               ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
               │  EVIDENCE   │          │ CASE_NOTES  │          │ ADMIN_USER  │
               │─────────────│          │─────────────│          │─────────────│
               │ file_id (PK)│          │ note_id (PK)│          │ user_id (PK)│
               │ case_id (FK)│          │ case_id (FK)│          │ email_hash  │
               │ storage_path│          │ created_by  │          │ role        │
               │ encryption  │          │ content     │          │ mfa_enabled │
               └─────────────┘          └─────────────┘          └──────┬──────┘
                                                                        │
                                                                        │ 1:N
                                                                        ▼
                                                                 ┌─────────────┐
                                                                 │ AUDIT_LOGS  │
                                                                 │─────────────│
                                                                 │ log_id (PK) │
                                                                 │ actor       │
                                                                 │ action      │
                                                                 │ timestamp   │
                                                                 └─────────────┘
```

---

# 3. AI Prompt Structure

## 3.1 System Architecture for AI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI PROMPT ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │       SYSTEM PROMPT             │
                    │   (Legal Context + Persona)     │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
        │  LEGAL CONTEXT  │ │ TRIAGE RULES    │ │ SAFETY LAYER    │
        │  LAYER          │ │ LAYER           │ │                 │
        │                 │ │                 │ │                 │
        │ • PIDA 1998     │ │ • Question Flow │ │ • Risk Triggers │
        │ • ERA 1996      │ │ • Classification│ │ • Escalation    │
        │ • Prescribed    │ │ • Assessment    │ │ • Boundaries    │
        │   Persons       │ │   Criteria      │ │                 │
        │ • Sector Regs   │ │                 │ │                 │
        └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │     CONVERSATION MANAGER        │
                    │   (State + Context Tracking)    │
                    └─────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │      RESPONSE GENERATOR         │
                    │   (Structured Output)           │
                    └─────────────────────────────────┘
```

## 3.2 Master System Prompt

```
SYSTEM PROMPT FOR WBUK AI TRIAGE ASSISTANT
==========================================

# IDENTITY AND PURPOSE

You are the WBUK Independent Disclosure Intake Officer, an AI assistant for Whistleblower UK (WBUK.org). Your purpose is to help individuals determine whether their concern may qualify as a protected disclosure under UK law and guide them safely through next steps.

## CRITICAL DISCLAIMERS (MUST INCLUDE IN FIRST MESSAGE)

1. You are NOT providing legal advice
2. You are an intake and triage system, not a legal decision-maker
3. All information shared is confidential and handled according to WBUK's privacy policy
4. This session is anonymous - no IP addresses or identifying information are logged
5. The final determination of whether a disclosure qualifies for protection is a legal matter

## PERSONA CHARACTERISTICS

- Tone: Calm, neutral, supportive, professional
- Language: Clear, accessible, avoiding unnecessary legal jargon
- Approach: Non-judgmental, patient, thorough
- Boundaries: Clear about limitations, never gives definitive legal opinions

## OPENING MESSAGE

"Welcome to WBUK's confidential disclosure intake service.

You can speak freely here. This conversation is anonymous and encrypted. I will help you:
- Understand whether your concern may qualify as a protected disclosure
- Assess any risks you might face
- Guide you toward appropriate next steps

**Important:** I am an AI assistant providing guidance, not legal advice. Any assessment I provide is preliminary and subject to review by WBUK's qualified advisors.

Before we begin, please confirm you understand this is a confidential service and you wish to proceed."

---

# UK WHISTLEBLOWING LEGAL FRAMEWORK

## PUBLIC INTEREST DISCLOSURE ACT 1998 (PIDA)

PIDA amended the Employment Rights Act 1996 to protect workers who disclose information about wrongdoing. A disclosure may qualify for protection if it meets specific criteria.

### Qualifying Disclosures (Section 43B ERA 1996)

A qualifying disclosure is one that, in the reasonable belief of the worker:
1. Tends to show one or more of the following ("relevant failures"):
   - A criminal offence has been, is being, or is likely to be committed
   - A person has failed, is failing, or is likely to fail to comply with a legal obligation
   - A miscarriage of justice has occurred, is occurring, or is likely to occur
   - The health or safety of any individual has been, is being, or is likely to be endangered
   - The environment has been, is being, or is likely to be damaged
   - Information tending to show any of the above has been, is being, or is likely to be deliberately concealed

2. Is made in the public interest (not solely a personal grievance)

### Protected Disclosures

A qualifying disclosure becomes protected when made to an appropriate recipient:

1. **To Employer (Section 43C)** - Internal disclosure to employer or responsible person
2. **To Legal Adviser (Section 43D)** - In course of obtaining legal advice
3. **To Minister of the Crown (Section 43E)** - For government-appointed workers
4. **To Prescribed Person (Section 43F)** - To a regulator listed in the Prescribed Persons Order
5. **Wider Disclosure (Section 43G)** - To others, if additional conditions are met
6. **Exceptionally Serious Failures (Section 43H)** - For matters of exceptional gravity

### Key Tests

1. **Reasonable Belief Test**: The worker must reasonably believe the information disclosed tends to show wrongdoing
2. **Public Interest Test**: The disclosure must be made in the public interest (Chesterton Global Ltd v Nurmohamed [2017])
3. **Good Faith**: While no longer required for protection, bad faith can reduce compensation

## EMPLOYMENT RIGHTS ACT 1996 - Relevant Sections

- **Section 47B**: Protection from detriment for making protected disclosures
- **Section 103A**: Automatic unfair dismissal if the reason is making a protected disclosure
- **Section 43J**: Prohibition on gagging clauses that prevent protected disclosures
- **Section 43K**: Extended definition of "worker" for whistleblowing purposes

## PRESCRIBED PERSONS LIST (Key Regulators)

The worker must reasonably believe the matter falls within the prescribed person's remit:

### Financial Services
- Financial Conduct Authority (FCA)
- Prudential Regulation Authority (PRA)
- Serious Fraud Office (SFO)

### Health and Safety
- Health and Safety Executive (HSE)
- Care Quality Commission (CQC)
- General Medical Council (GMC)
- Nursing and Midwifery Council (NMC)

### Environment
- Environment Agency
- Natural England
- Scottish Environment Protection Agency (SEPA)

### Public Sector
- National Audit Office (NAO)
- Parliamentary and Health Service Ombudsman
- Local Government and Social Care Ombudsman
- Information Commissioner's Office (ICO)

### Other Key Regulators
- Charity Commission
- Ofsted
- Ofcom
- Competition and Markets Authority (CMA)
- HM Revenue and Customs (HMRC)

## SECTOR-SPECIFIC REGULATIONS

### NHS and Healthcare
- NHS Constitution duties
- Care Quality Commission regulations
- Professional body requirements (GMC, NMC)
- Freedom to Speak Up Guardian scheme
- NHS Improvement oversight

### Financial Services
- FCA Handbook (SYSC 18)
- Senior Managers and Certification Regime (SMCR)
- Whistleblowing rules for firms

### Public Sector
- Civil Service Code
- Nolan Principles
- Public Interest Disclosure (Prescribed Persons) Order 2014
- Local Government Act 1972

---

# TRIAGE QUESTION FLOW

## PHASE 1: INITIAL ASSESSMENT

### Question 1.1 - Nature of Concern
"Can you briefly describe the type of concern you wish to report? You don't need to provide specific details yet."

Categories to identify:
- [ ] Suspected fraud or financial misconduct
- [ ] Health and safety risks
- [ ] Environmental damage or risks
- [ ] Legal or regulatory breaches
- [ ] Data protection or privacy concerns
- [ ] Corruption or bribery
- [ ] Harassment, bullying, or misconduct
- [ ] Cover-up of any of the above
- [ ] Other wrongdoing

### Question 1.2 - Organisation Sector
"What sector does the organisation operate in?"

Options:
- NHS / Healthcare
- Central Government
- Local Government
- Police / Emergency Services
- Education
- Financial Services
- Charity / Third Sector
- Private Company (Small: <50 employees)
- Private Company (Medium: 50-250 employees)
- Private Company (Large: >250 employees)
- Other (specify)

### Question 1.3 - Your Relationship
"What is your relationship to the organisation?"

Options:
- Current employee
- Former employee
- Agency worker
- Contractor
- Trainee / Apprentice
- NHS practitioner
- Member of the public
- Other (specify)

## PHASE 2: DETAILED INFORMATION

### Question 2.1 - Specific Wrongdoing
"Based on what you've described, I'd like to understand more. Can you tell me:
- What specifically concerns you?
- When did you first become aware of this?
- Is this ongoing or has it stopped?"

### Question 2.2 - Public Interest Element
"This is important for determining if your disclosure may be protected. Consider:
- Does this affect just you personally, or could it affect others?
- Is there a wider public interest in this being addressed?
- Could the public, patients, customers, or taxpayers be affected?"

### Question 2.3 - Evidence
"What evidence or information do you have about this concern?"

Types to identify:
- [ ] Documents (contracts, reports, policies)
- [ ] Emails or written communications
- [ ] Financial records
- [ ] Witness statements or testimony
- [ ] Personal observation
- [ ] Audio or video recordings
- [ ] Other physical evidence
- [ ] No documentary evidence, but direct knowledge

## PHASE 3: RISK ASSESSMENT

### Question 3.1 - Prior Reporting
"Have you already raised this concern with anyone?"

Options:
- Not yet reported to anyone
- Reported internally (line manager)
- Reported internally (HR/compliance)
- Reported internally (board/senior management)
- Reported to external regulator
- Reported to police
- Sought legal advice
- Other

### Question 3.2 - Response Received
"If you have reported this, what response did you receive?"

### Question 3.3 - Current Risk Assessment
"I need to understand any risks you might be facing. Please indicate if any of the following apply:

**Employment risks:**
- Fear of dismissal
- Already received warnings or disciplinary action
- Performance management initiated
- Role changes or marginalisation
- Contract not renewed

**Personal risks:**
- Threats or intimidation
- Harassment or bullying
- Damage to reputation
- Financial pressure
- Legal threats

**Safety concerns:**
- Concerns for physical safety
- Concerns for family safety"

## PHASE 4: LEGAL CLASSIFICATION

Based on the information gathered, assess:

### Classification Matrix

| Scenario | Likely Classification | Key Indicators |
|----------|----------------------|----------------|
| Wrongdoing affecting public + evidence + worker status | Protected Disclosure (likely) | Clear public interest, qualifying failure, appropriate recipient |
| Personal grievance only | Employment Dispute | Affects only the individual, no wider public interest |
| Workplace conflict | Grievance | Interpersonal issues, management decisions |
| Serious safety/environmental/fraud | Urgent Protected Disclosure | Immediate risk, may require urgent action |
| Legal breach by organisation | Qualifying Disclosure | Regulatory non-compliance |
| Cover-up of wrongdoing | Protected Disclosure | Deliberate concealment adds protection |

---

# STRUCTURED OUTPUT TEMPLATES

## Case Summary Template

```json
{
  "case_summary": {
    "reference": "WBUK-YYYY-XXXXX",
    "submission_date": "ISO-8601",
    "triage_completed": true
  },
  
  "classification": {
    "organisation": {
      "sector": "string",
      "size": "string",
      "name_provided": boolean
    },
    "wrongdoing_type": {
      "primary_category": "string",
      "secondary_categories": ["array"],
      "description_summary": "string"
    },
    "whistleblower_role": "string"
  },
  
  "evidence_assessment": {
    "types_available": ["array"],
    "evidence_strength": "Strong|Moderate|Limited",
    "key_evidence": "string"
  },
  
  "legal_assessment": {
    "preliminary_classification": "Protected Disclosure|Qualifying Disclosure|Employment Grievance|Public Interest Matter|Other",
    "confidence_level": "High|Medium|Low",
    "relevant_legislation": ["array"],
    "relevant_prescribed_persons": ["array"],
    "public_interest_assessment": "string",
    "key_legal_considerations": ["array"]
  },
  
  "risk_assessment": {
    "overall_risk_level": "Critical|High|Medium|Low",
    "employment_risk": "High|Medium|Low",
    "retaliation_risk": "High|Medium|Low",
    "legal_exposure": "High|Medium|Low|None",
    "personal_safety": "Concern|No Concern",
    "risk_factors": ["array"],
    "protective_factors": ["array"]
  },
  
  "recommended_actions": {
    "suggested_reporting_path": "string",
    "prescribed_persons_options": ["array"],
    "urgency": "Immediate|Urgent|Standard",
    "specific_recommendations": ["array"],
    "cautions": ["array"]
  },
  
  "advisor_notes": {
    "key_issues": ["array"],
    "areas_requiring_clarification": ["array"],
    "priority_level": "P1|P2|P3"
  }
}
```

## Risk Trigger Responses

### IMMEDIATE ESCALATION TRIGGERS

If the user indicates any of the following, provide immediate safety guidance:

1. **Physical Safety Threat**
   Response: "Your safety is the priority. If you are in immediate danger, please contact emergency services (999). WBUK can provide guidance on personal safety measures, but cannot provide physical protection."

2. **Imminent Serious Harm**
   Response: "What you've described suggests there may be an imminent risk of serious harm to others. In such cases, you may need to consider immediate disclosure to appropriate authorities. Would you like guidance on emergency reporting routes?"

3. **Suicidal Ideation / Severe Distress**
   Response: "I'm concerned about what you've shared. While I'm here to help with your disclosure, if you're experiencing distress, please reach out to:
   - Samaritans: 116 123 (24/7)
   - NHS 111 for mental health support
   Would you like to continue with the disclosure process, or would you prefer to take a break?"

---

# RESPONSE BOUNDARIES

## MUST DO
- Always acknowledge the courage required to report concerns
- Provide accurate information about UK whistleblowing law
- Give clear, structured assessments based on information provided
- Explain limitations and recommend professional legal advice for complex cases
- Maintain confidentiality and anonymity throughout
- Document all information systematically

## MUST NOT
- Provide definitive legal opinions
- Guarantee outcomes or protection
- Advise specific actions without caveats
- Store or request unnecessary personal information
- Discourage legitimate disclosures
- Minimise genuine concerns or risks
- Make promises on behalf of WBUK

## UNCERTAINTY HANDLING

When uncertain about classification:
"Based on the information you've provided, this situation has elements that could fall into different categories. A WBUK advisor will be able to provide more specific guidance after reviewing your case. My preliminary assessment is..."

---

# CLOSING MESSAGES

## Standard Close
"Thank you for sharing this information. I've prepared a structured summary of your disclosure for WBUK's advisors.

**Your case reference is: WBUK-YYYY-XXXXX**

Please save this reference number - you can use it if you need to follow up.

**What happens next:**
1. A WBUK advisor will review your submission
2. They may reach out if they need clarification (you'll remain anonymous unless you choose otherwise)
3. You will receive guidance on recommended next steps

**Remember:**
- Keep copies of any evidence safely
- Note any relevant dates or witnesses
- Consider seeking independent legal advice if your situation involves significant risk

Is there anything else you'd like to add before submitting?"

## Urgent Case Close
"Based on what you've described, I've flagged this as requiring urgent attention.

**Your case reference is: WBUK-YYYY-XXXXX**

A WBUK advisor will prioritise your case for review. If you believe there is immediate risk of harm, please also consider:
- Contacting the relevant prescribed person directly
- Seeking emergency legal advice
- If lives are at risk, contacting emergency services"
```

## 3.3 Conversation State Management

```javascript
// Triage State Machine

const TRIAGE_STATES = {
  INITIAL: 'initial',
  WELCOME_CONFIRMED: 'welcome_confirmed',
  NATURE_IDENTIFIED: 'nature_identified',
  SECTOR_IDENTIFIED: 'sector_identified',
  RELATIONSHIP_IDENTIFIED: 'relationship_identified',
  DETAILS_GATHERED: 'details_gathered',
  PUBLIC_INTEREST_ASSESSED: 'public_interest_assessed',
  EVIDENCE_ASSESSED: 'evidence_assessed',
  PRIOR_REPORTING_ASSESSED: 'prior_reporting_assessed',
  RISK_ASSESSED: 'risk_assessed',
  SUMMARY_GENERATED: 'summary_generated',
  SUBMITTED: 'submitted'
};

const STATE_TRANSITIONS = {
  [TRIAGE_STATES.INITIAL]: {
    next: TRIAGE_STATES.WELCOME_CONFIRMED,
    required_data: ['user_consent'],
    prompt_key: 'welcome'
  },
  [TRIAGE_STATES.WELCOME_CONFIRMED]: {
    next: TRIAGE_STATES.NATURE_IDENTIFIED,
    required_data: ['concern_type'],
    prompt_key: 'question_1_1'
  },
  // ... continue for all states
};

// Context Window Management
const MAX_CONTEXT_MESSAGES = 20;
const SUMMARY_THRESHOLD = 15;

function manageContext(messages) {
  if (messages.length > SUMMARY_THRESHOLD) {
    // Generate summary of earlier messages
    // Keep last 10 messages in full
    // Include summary as system context
  }
  return optimizedMessages;
}
```

## 3.4 AI Function Definitions (for GPT-5.2)

```json
{
  "functions": [
    {
      "name": "classify_disclosure",
      "description": "Classify the user's disclosure based on UK whistleblowing law",
      "parameters": {
        "type": "object",
        "properties": {
          "wrongdoing_category": {
            "type": "string",
            "enum": ["fraud", "corruption", "health_safety", "environmental", "legal_breach", "data_protection", "misconduct", "cover_up", "other"]
          },
          "public_interest_score": {
            "type": "number",
            "minimum": 1,
            "maximum": 10,
            "description": "Assessment of public interest element (1=purely personal, 10=major public interest)"
          },
          "qualifying_failure_type": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["criminal_offence", "legal_obligation_failure", "miscarriage_of_justice", "health_safety_danger", "environmental_damage", "concealment"]
            }
          },
          "preliminary_classification": {
            "type": "string",
            "enum": ["likely_protected_disclosure", "possible_protected_disclosure", "employment_grievance", "public_interest_matter", "needs_further_assessment"]
          },
          "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "reasoning": {
            "type": "string"
          }
        },
        "required": ["wrongdoing_category", "public_interest_score", "preliminary_classification", "confidence", "reasoning"]
      }
    },
    {
      "name": "assess_risk",
      "description": "Assess the risk level for the whistleblower",
      "parameters": {
        "type": "object",
        "properties": {
          "overall_risk": {
            "type": "string",
            "enum": ["critical", "high", "medium", "low"]
          },
          "employment_risk": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "retaliation_risk": {
            "type": "string",
            "enum": ["high", "medium", "low"]
          },
          "legal_exposure": {
            "type": "string",
            "enum": ["high", "medium", "low", "none"]
          },
          "personal_safety_concern": {
            "type": "boolean"
          },
          "risk_factors": {
            "type": "array",
            "items": {"type": "string"}
          },
          "protective_factors": {
            "type": "array",
            "items": {"type": "string"}
          },
          "immediate_action_required": {
            "type": "boolean"
          }
        },
        "required": ["overall_risk", "employment_risk", "retaliation_risk", "risk_factors"]
      }
    },
    {
      "name": "recommend_reporting_path",
      "description": "Recommend appropriate reporting routes based on the disclosure",
      "parameters": {
        "type": "object",
        "properties": {
          "primary_recommendation": {
            "type": "string",
            "enum": ["internal_first", "prescribed_person", "legal_advice", "urgent_external", "wbuk_support"]
          },
          "prescribed_persons": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {"type": "string"},
                "relevance": {"type": "string"},
                "contact_info": {"type": "string"}
              }
            }
          },
          "urgency": {
            "type": "string",
            "enum": ["immediate", "urgent", "standard"]
          },
          "specific_steps": {
            "type": "array",
            "items": {"type": "string"}
          },
          "cautions": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["primary_recommendation", "urgency", "specific_steps"]
      }
    },
    {
      "name": "generate_case_summary",
      "description": "Generate structured case summary for WBUK advisors",
      "parameters": {
        "type": "object",
        "properties": {
          "executive_summary": {"type": "string"},
          "key_facts": {
            "type": "array",
            "items": {"type": "string"}
          },
          "legal_assessment": {"type": "object"},
          "risk_assessment": {"type": "object"},
          "recommended_actions": {
            "type": "array",
            "items": {"type": "string"}
          },
          "priority_level": {
            "type": "string",
            "enum": ["P1", "P2", "P3"]
          },
          "areas_needing_clarification": {
            "type": "array",
            "items": {"type": "string"}
          }
        },
        "required": ["executive_summary", "key_facts", "legal_assessment", "risk_assessment", "recommended_actions", "priority_level"]
      }
    },
    {
      "name": "flag_safety_concern",
      "description": "Flag immediate safety or wellbeing concerns",
      "parameters": {
        "type": "object",
        "properties": {
          "concern_type": {
            "type": "string",
            "enum": ["physical_safety", "mental_health", "imminent_harm_to_others", "legal_emergency"]
          },
          "severity": {
            "type": "string",
            "enum": ["critical", "high", "moderate"]
          },
          "recommended_resources": {
            "type": "array",
            "items": {"type": "string"}
          },
          "immediate_action": {"type": "string"}
        },
        "required": ["concern_type", "severity", "recommended_resources"]
      }
    }
  ]
}
```

---

# 4. Secure VPS Deployment Plan

## 4.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VPS DEPLOYMENT ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

RECOMMENDED SPECIFICATIONS
──────────────────────────
• VPS Provider: Hetzner / OVH / DigitalOcean (UK/EU region)
• OS: Ubuntu 22.04 LTS
• CPU: 4 vCPUs minimum
• RAM: 8GB minimum (16GB recommended)
• Storage: 100GB NVMe SSD (encrypted)
• Network: 1Gbps, dedicated IPv4

DOMAIN STRUCTURE
────────────────
• Main: triage.wbuk.org
• API: api.triage.wbuk.org (or triage.wbuk.org/api)
• Admin: admin.triage.wbuk.org (separate subdomain recommended)
```

## 4.2 Docker Compose Architecture

```yaml
# docker-compose.yml

version: '3.8'

services:
  # ─────────────────────────────────────────────────────────────
  # NGINX REVERSE PROXY
  # ─────────────────────────────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: wbuk-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - wbuk-network

  # ─────────────────────────────────────────────────────────────
  # CERTBOT (SSL CERTIFICATES)
  # ─────────────────────────────────────────────────────────────
  certbot:
    image: certbot/certbot
    container_name: wbuk-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - wbuk-network

  # ─────────────────────────────────────────────────────────────
  # FRONTEND (REACT)
  # ─────────────────────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wbuk-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=https://triage.wbuk.org/api
    expose:
      - "3000"
    networks:
      - wbuk-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # BACKEND (FASTAPI)
  # ─────────────────────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: wbuk-backend
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
      - MONGO_URL=mongodb://mongodb:27017/wbuk_triage
      - ENCRYPTION_KEY_FILE=/run/secrets/encryption_key
      - OPENAI_API_KEY_FILE=/run/secrets/openai_key
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
    secrets:
      - encryption_key
      - openai_key
      - jwt_secret
    expose:
      - "8001"
    depends_on:
      - mongodb
    networks:
      - wbuk-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # MONGODB (ENCRYPTED)
  # ─────────────────────────────────────────────────────────────
  mongodb:
    image: mongo:7.0
    container_name: wbuk-mongodb
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME_FILE=/run/secrets/mongo_root_user
      - MONGO_INITDB_ROOT_PASSWORD_FILE=/run/secrets/mongo_root_pass
    secrets:
      - mongo_root_user
      - mongo_root_pass
    volumes:
      - mongodb_data:/data/db
      - ./mongodb/mongod.conf:/etc/mongod.conf:ro
    command: ["--config", "/etc/mongod.conf", "--auth"]
    networks:
      - wbuk-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # MINIO (ENCRYPTED FILE STORAGE)
  # ─────────────────────────────────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: wbuk-minio
    restart: unless-stopped
    environment:
      - MINIO_ROOT_USER_FILE=/run/secrets/minio_root_user
      - MINIO_ROOT_PASSWORD_FILE=/run/secrets/minio_root_pass
    secrets:
      - minio_root_user
      - minio_root_pass
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    expose:
      - "9000"
      - "9001"
    networks:
      - wbuk-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ─────────────────────────────────────────────────────────────
  # REDIS (SESSION CACHE)
  # ─────────────────────────────────────────────────────────────
  redis:
    image: redis:alpine
    container_name: wbuk-redis
    restart: unless-stopped
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    expose:
      - "6379"
    networks:
      - wbuk-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

# ─────────────────────────────────────────────────────────────
# DOCKER SECRETS
# ─────────────────────────────────────────────────────────────
secrets:
  encryption_key:
    file: ./secrets/encryption_key.txt
  openai_key:
    file: ./secrets/openai_key.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  mongo_root_user:
    file: ./secrets/mongo_root_user.txt
  mongo_root_pass:
    file: ./secrets/mongo_root_pass.txt
  minio_root_user:
    file: ./secrets/minio_root_user.txt
  minio_root_pass:
    file: ./secrets/minio_root_pass.txt

# ─────────────────────────────────────────────────────────────
# VOLUMES (ENCRYPTED AT HOST LEVEL)
# ─────────────────────────────────────────────────────────────
volumes:
  mongodb_data:
    driver: local
  minio_data:
    driver: local
  redis_data:
    driver: local

# ─────────────────────────────────────────────────────────────
# NETWORKS
# ─────────────────────────────────────────────────────────────
networks:
  wbuk-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 4.3 NGINX Configuration

```nginx
# nginx/conf.d/wbuk.conf

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
limit_conn_zone $binary_remote_addr zone=conn:10m;

# Upstream definitions
upstream frontend {
    server frontend:3000;
    keepalive 32;
}

upstream backend {
    server backend:8001;
    keepalive 32;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name triage.wbuk.org;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name triage.wbuk.org;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/triage.wbuk.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/triage.wbuk.org/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com; frame-ancestors 'none';" always;

    # Privacy: Disable logging of IP addresses
    # Use anonymized logging or disable access logs entirely for privacy
    access_log off;
    # OR use anonymized logging:
    # access_log /var/log/nginx/access.log anonymized;

    # Connection limits
    limit_conn conn 20;

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for AI responses
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;

        # Buffer settings
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Frontend routes
    location / {
        limit_req zone=general burst=50 nodelay;
        
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Block common attack patterns
    location ~* (\.php|\.asp|\.aspx|\.jsp|\.cgi)$ {
        deny all;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

## 4.4 Server Hardening Script

```bash
#!/bin/bash
# server-hardening.sh
# Run as root on fresh Ubuntu 22.04 VPS

set -e

echo "=========================================="
echo "WBUK Triage Server Hardening Script"
echo "=========================================="

# ─────────────────────────────────────────────
# 1. SYSTEM UPDATES
# ─────────────────────────────────────────────
echo "[1/10] Updating system packages..."
apt update && apt upgrade -y
apt install -y \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-listchanges \
    curl \
    wget \
    git \
    htop \
    nano \
    cryptsetup \
    auditd \
    audispd-plugins \
    rkhunter \
    lynis

# ─────────────────────────────────────────────
# 2. CREATE NON-ROOT USER
# ─────────────────────────────────────────────
echo "[2/10] Creating deployment user..."
useradd -m -s /bin/bash wbuk-deploy
usermod -aG sudo wbuk-deploy
echo "wbuk-deploy ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose" >> /etc/sudoers

# ─────────────────────────────────────────────
# 3. SSH HARDENING
# ─────────────────────────────────────────────
echo "[3/10] Hardening SSH..."
cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
# SSH Hardening for WBUK
Port 22
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
AllowUsers wbuk-deploy
EOF

systemctl restart sshd

# ─────────────────────────────────────────────
# 4. FIREWALL CONFIGURATION
# ─────────────────────────────────────────────
echo "[4/10] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# ─────────────────────────────────────────────
# 5. FAIL2BAN CONFIGURATION
# ─────────────────────────────────────────────
echo "[5/10] Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 60
bantime = 7200
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# ─────────────────────────────────────────────
# 6. AUTOMATIC SECURITY UPDATES
# ─────────────────────────────────────────────
echo "[6/10] Enabling automatic security updates..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

systemctl enable unattended-upgrades

# ─────────────────────────────────────────────
# 7. KERNEL HARDENING
# ─────────────────────────────────────────────
echo "[7/10] Applying kernel hardening..."
cat > /etc/sysctl.d/99-security.conf << 'EOF'
# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Block SYN attacks
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Log Martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Disable IPv6 if not needed
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
EOF

sysctl -p /etc/sysctl.d/99-security.conf

# ─────────────────────────────────────────────
# 8. DOCKER INSTALLATION
# ─────────────────────────────────────────────
echo "[8/10] Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker wbuk-deploy

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ─────────────────────────────────────────────
# 9. AUDIT LOGGING
# ─────────────────────────────────────────────
echo "[9/10] Configuring audit logging..."
cat > /etc/audit/rules.d/wbuk.rules << 'EOF'
# Delete all existing rules
-D

# Buffer size
-b 8192

# Failure mode
-f 1

# Monitor for changes to system files
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k identity

# Monitor Docker
-w /usr/bin/docker -p x -k docker
-w /var/lib/docker -p wa -k docker

# Monitor SSH
-w /etc/ssh/sshd_config -p wa -k sshd

# Monitor system calls for privilege escalation
-a always,exit -F arch=b64 -S execve -k exec
EOF

systemctl enable auditd
systemctl restart auditd

# ─────────────────────────────────────────────
# 10. CREATE APPLICATION DIRECTORIES
# ─────────────────────────────────────────────
echo "[10/10] Creating application directories..."
mkdir -p /opt/wbuk-triage/{frontend,backend,nginx,mongodb,certbot,secrets,backups}
chown -R wbuk-deploy:wbuk-deploy /opt/wbuk-triage
chmod 700 /opt/wbuk-triage/secrets

echo "=========================================="
echo "Server hardening complete!"
echo ""
echo "Next steps:"
echo "1. Add your SSH public key to /home/wbuk-deploy/.ssh/authorized_keys"
echo "2. Test SSH access with new user before disabling root"
echo "3. Deploy application to /opt/wbuk-triage"
echo "4. Run: lynis audit system (for security scan)"
echo "=========================================="
```

## 4.5 Deployment Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT CHECKLIST                                  │
└─────────────────────────────────────────────────────────────────────────────┘

PRE-DEPLOYMENT
──────────────
[ ] VPS provisioned with Ubuntu 22.04 LTS
[ ] Domain DNS configured (triage.wbuk.org -> VPS IP)
[ ] SSH key pair generated for deployment
[ ] OpenAI API key obtained
[ ] Server hardening script executed

SECRETS GENERATION
──────────────────
[ ] Generate encryption key: openssl rand -hex 32 > secrets/encryption_key.txt
[ ] Generate JWT secret: openssl rand -hex 64 > secrets/jwt_secret.txt
[ ] Generate MongoDB credentials
[ ] Generate MinIO credentials
[ ] Generate Redis password
[ ] Store OpenAI API key: echo "sk-xxx" > secrets/openai_key.txt
[ ] Set permissions: chmod 600 secrets/*.txt

SSL CERTIFICATES
────────────────
[ ] Run initial certbot: docker-compose run --rm certbot certonly --webroot ...
[ ] Verify certificates in ./certbot/conf/live/
[ ] Configure auto-renewal in crontab

DEPLOYMENT
──────────
[ ] Clone repository to /opt/wbuk-triage
[ ] Copy secrets to ./secrets/
[ ] Build containers: docker-compose build
[ ] Start services: docker-compose up -d
[ ] Verify all containers healthy: docker-compose ps
[ ] Check logs: docker-compose logs -f

POST-DEPLOYMENT VERIFICATION
────────────────────────────
[ ] HTTPS working (https://triage.wbuk.org)
[ ] API responding (https://triage.wbuk.org/api/health)
[ ] MongoDB connected
[ ] MinIO accessible
[ ] Chat interface functional
[ ] AI responses working
[ ] Admin login functional
[ ] File upload working
[ ] SSL Labs test (https://www.ssllabs.com/ssltest/)

SECURITY VERIFICATION
─────────────────────
[ ] Run Lynis audit: lynis audit system
[ ] Check Fail2Ban status: fail2ban-client status
[ ] Verify firewall: ufw status verbose
[ ] Test rate limiting
[ ] Verify no IP logging in nginx
[ ] Confirm encryption at rest for MongoDB

MONITORING SETUP
────────────────
[ ] Configure log rotation
[ ] Set up health check alerts
[ ] Configure backup schedule
[ ] Test backup restoration
[ ] Document recovery procedures
```

## 4.6 Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily backup script

BACKUP_DIR="/opt/wbuk-triage/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# MongoDB backup
docker exec wbuk-mongodb mongodump \
    --out /data/backup_${DATE} \
    --gzip

# Copy to host
docker cp wbuk-mongodb:/data/backup_${DATE} ${BACKUP_DIR}/mongodb_${DATE}

# MinIO backup (files)
docker run --rm \
    -v minio_data:/data \
    -v ${BACKUP_DIR}:/backup \
    alpine tar czf /backup/minio_${DATE}.tar.gz /data

# Encrypt backups
gpg --symmetric --cipher-algo AES256 \
    --output ${BACKUP_DIR}/mongodb_${DATE}.gpg \
    ${BACKUP_DIR}/mongodb_${DATE}

gpg --symmetric --cipher-algo AES256 \
    --output ${BACKUP_DIR}/minio_${DATE}.tar.gz.gpg \
    ${BACKUP_DIR}/minio_${DATE}.tar.gz

# Remove unencrypted backups
rm -rf ${BACKUP_DIR}/mongodb_${DATE}
rm ${BACKUP_DIR}/minio_${DATE}.tar.gz

# Clean old backups
find ${BACKUP_DIR} -type f -mtime +${RETENTION_DAYS} -delete

# Sync to off-site storage (optional)
# rclone sync ${BACKUP_DIR} remote:wbuk-backups
```

---

# Appendix A: Security Considerations

## A.1 Data Protection Compliance

```
GDPR / UK GDPR CONSIDERATIONS
─────────────────────────────

1. LAWFUL BASIS
   • Legitimate interests (supporting whistleblowers)
   • Explicit consent where needed
   • Legal obligation (regulatory compliance)

2. DATA MINIMISATION
   • Only collect information necessary for triage
   • Anonymous sessions by default
   • No unnecessary personal identifiers

3. PURPOSE LIMITATION
   • Data used only for whistleblower support
   • No secondary processing without consent

4. STORAGE LIMITATION
   • Define retention periods
   • Automatic purging of expired sessions
   • Secure deletion procedures

5. DATA SUBJECT RIGHTS
   • Right to erasure (where applicable)
   • Access requests handled through anonymous reference

6. INTERNATIONAL TRANSFERS
   • Keep data within UK/EEA
   • VPS in UK or EU region
```

## A.2 Metadata Stripping Process

```python
# Example metadata stripping for uploaded files

from PIL import Image
from PyPDF2 import PdfReader, PdfWriter
import subprocess
import os

def strip_image_metadata(input_path, output_path):
    """Remove EXIF and other metadata from images."""
    # Use exiftool for comprehensive stripping
    subprocess.run([
        'exiftool',
        '-all=',           # Remove all metadata
        '-overwrite_original',
        input_path
    ])
    
    # Verify with PIL
    img = Image.open(input_path)
    data = list(img.getdata())
    img_clean = Image.new(img.mode, img.size)
    img_clean.putdata(data)
    img_clean.save(output_path)

def strip_pdf_metadata(input_path, output_path):
    """Remove metadata from PDF files."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    for page in reader.pages:
        writer.add_page(page)
    
    # Remove metadata
    writer.add_metadata({})
    
    with open(output_path, 'wb') as f:
        writer.write(f)

def strip_office_metadata(input_path, output_path):
    """Remove metadata from Office documents."""
    # Use LibreOffice headless for conversion
    subprocess.run([
        'libreoffice',
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', os.path.dirname(output_path),
        input_path
    ])
```

---

# Appendix B: Prescribed Persons Reference

## B.1 Key Prescribed Persons by Sector

| Sector | Prescribed Person | Matters |
|--------|-------------------|---------|
| **Financial** | FCA | Financial services misconduct |
| | PRA | Prudential regulation matters |
| | SFO | Serious/complex fraud, bribery, corruption |
| **Healthcare** | CQC | Health and social care quality |
| | GMC | Medical practitioners |
| | NMC | Nurses and midwives |
| | NHS England | NHS commissioning |
| **Environment** | Environment Agency | Environmental protection |
| | HSE | Health and safety at work |
| **Public Sector** | NAO | Public spending |
| | PHSO | NHS/government maladministration |
| | ICO | Data protection, freedom of information |
| **Other** | Charity Commission | Charities |
| | Ofsted | Education and children's services |
| | HMRC | Tax matters |

---

# Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | WBUK Technical Team | Initial document |

---

**END OF DOCUMENT**
