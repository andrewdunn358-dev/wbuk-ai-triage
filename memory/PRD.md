# WBUK AI Triage Platform - PRD

## Original Problem Statement
Build a secure AI-powered whistleblower triage platform for Whistleblower UK (WBUK.org). The system allows individuals to anonymously report concerns, determine whether their issue qualifies as a protected disclosure under UK law, and guide them safely through next steps.

## User Personas
1. **Whistleblower** - Individuals seeking confidential support to report concerns
2. **WBUK Advisor** - Staff reviewing cases and providing guidance
3. **Super Admin** - System administrators managing advisor accounts

## Core Requirements
- Anonymous chat interface
- AI-powered triage with UK legal knowledge (PIDA 1998)
- Case summary generation
- Evidence upload capability
- Admin dashboard for case management
- Secure, encrypted communications
- Professional WBUK-branded UI (red accents, white background, Montserrat font)

## Architecture
- **Frontend**: React with Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Multi-provider support (Emergent/GPT-5.2, OpenAI, Anthropic, Google, Ollama)
- **File Storage**: Local (production: MinIO/S3)
- **Deployment**: Docker Compose with MongoDB, MinIO

## What's Been Implemented

### March 2026 (Latest Session)
- [x] **Multi-AI Provider Backend Refactoring COMPLETE**
  - Created `ai_provider.py` adapter supporting:
    - Emergent Universal Key (GPT-5.2)
    - OpenAI direct (GPT-4 Turbo)
    - Anthropic Claude
    - Google Gemini
    - Local Ollama (Llama 3.1)
  - Runtime configuration via environment variables (AI_PROVIDER, AI_API_KEY)
  - Updated `docker-compose.yml` for multi-provider support
- [x] **Interactive Installation Wizard (`install-wizard.sh`)**
  - Prompts for domain, SSL setup, admin credentials
  - AI provider selection with API key input
  - Site access password configuration
  - Auto-generates secure MongoDB, MinIO, JWT secrets
  - Creates admin user automatically
  - Saves all credentials to CREDENTIALS.txt
- [x] Updated `.env.template` with all configuration options
- [x] Password gate protecting site (PasswordGate.jsx)
- [x] AI prompt refinements for conversational tone
- [x] Safeguarding protocols for vulnerable users

### December 2025
- [x] UI Redesign to match WBUK branding (red accents #C41E3A)
- [x] All pages updated: Landing, Chat, Summary, Admin Login, Dashboard, Case Detail, User Management
- [x] Docker deployment files created:
  - `deploy/docker-compose.yml`
  - `deploy/docker/backend.Dockerfile`
  - `deploy/docker/frontend.Dockerfile`
  - `deploy/docker/nginx.conf`
  - `deploy/install.sh` (one-liner Ubuntu 24.04 install)
  - `deploy/DEPLOYMENT.md`

### Previous Sessions (March 2026)
- [x] Landing page with WBUK branding
- [x] Anonymous session creation
- [x] AI chat interface with GPT-5.2
- [x] UK whistleblowing law context (PIDA 1998, ERA 1996)
- [x] Case summary generation
- [x] Case submission to advisors
- [x] Admin login with JWT authentication
- [x] Admin dashboard with stats and case list
- [x] Case detail view with conversation history
- [x] Internal notes system
- [x] Status management
- [x] Evidence upload with metadata stripping (PDF, images)
- [x] Admin user management (CRUD for advisor accounts)
- [x] **Decision Engine with 5-Stage Scoring System**
  - Stage 1: Qualifying Disclosure Assessment
  - Stage 2: Public Interest Test
  - Stage 3: Worker Status Verification
  - Stage 4: Reasonable Belief Assessment
  - Stage 5: Appropriate Recipient Evaluation
- [x] **Risk Assessment Module** (Employment, Retaliation, Legal, Financial, Personal Safety)
- [x] **Prescribed Persons Routing** (sector-based regulator recommendations)

## API Endpoints
- POST /api/session - Create anonymous session
- POST /api/chat - Chat with AI
- GET /api/chat/history/{token} - Get chat history
- POST /api/summary/{token} - Generate case summary
- POST /api/submit/{token} - Submit case
- POST /api/admin/login - Admin login
- GET /api/admin/me - Get current admin
- GET /api/admin/cases - List cases (paginated, filterable)
- GET /api/admin/cases/{ref} - Case detail
- PATCH /api/admin/cases/{ref}/status - Update status
- POST /api/admin/cases/{ref}/notes - Add note
- CRUD /api/admin/users - User management
- POST /api/evidence/upload/{token} - Upload evidence
- GET /api/admin/evidence/{id}/download - Download evidence

## Test Credentials
- Admin: andyd358@hotmail.com / WBUKAdmin2026!

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core chat flow
- [x] Admin dashboard
- [x] WBUK UI branding

### P1 (High)
- [x] Evidence upload with metadata stripping
- [x] Docker deployment setup
- [x] Multi-AI provider support (Emergent, OpenAI, Anthropic, Google, Ollama)
- [x] Interactive installation wizard
- [ ] Migrate file storage to MinIO (S3-compatible) - NEXT PRIORITY
- [ ] MFA for admin users
- [ ] Email notifications for new cases

### P2 (Medium)
- [ ] Enhanced case search (by keywords, date range)
- [ ] Case export to PDF
- [ ] Secure messaging between whistleblower and advisor

### P3 (Low)
- [ ] Case timeline builder
- [ ] Anonymous follow-up messaging
- [ ] Analytics dashboard

## Deployment

### Docker Compose (Production)
```bash
# On Ubuntu 24.04
curl -sSL https://raw.githubusercontent.com/<YOUR_REPO>/main/deploy/install.sh | sudo bash
```

Services:
- MongoDB 7 (database)
- MinIO (S3-compatible storage)
- Backend (FastAPI)
- Frontend (React + Nginx)

### Environment Variables
```
PUBLIC_URL=http://your-domain.com
MONGO_USER=wbukadmin
MONGO_PASSWORD=<generated>
MINIO_USER=minioadmin
MINIO_PASSWORD=<generated>
JWT_SECRET=<generated>
AI_PROVIDER=emergent|openai|anthropic|google|ollama
AI_API_KEY=<your-api-key>
EMERGENT_LLM_KEY=<your-emergent-key>
SITE_PASSWORD=WBUK2026
```

## Next Tasks
1. Integrate MinIO for evidence storage (replace local uploads) - **PRIORITY**
2. Test Docker deployment on fresh Ubuntu 24.04 VM
3. Implement email notifications (SendGrid/Resend)
4. Add MFA for admin users

## Testing Status (March 2026)
- ✅ Backend: 20/20 tests passing
- ✅ Frontend: All UI flows working
- ✅ AI Integration: GPT-5.2 via Emergent working
- ✅ Admin Dashboard: Fully functional
- ✅ Password Gate: Working

## Active Test Cases
- WBUK-2026-4F84DFF0 (Healthcare - patient records)
- WBUK-2026-36A2A534 (Government - procurement fraud)
