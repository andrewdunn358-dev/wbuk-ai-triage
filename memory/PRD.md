# WBUK AI Triage Platform - PRD

## Original Problem Statement
Build a secure AI-powered whistleblower triage platform for Whistleblower UK (WBUK.org). The system allows individuals to anonymously report concerns, determine whether their issue qualifies as a protected disclosure under UK law, and guide them safely through next steps.

## User Personas
1. **Whistleblower** - Individuals seeking confidential support to report concerns
2. **WBUK Advisor** - Staff reviewing cases and providing guidance

## Core Requirements
- Anonymous chat interface
- AI-powered triage with UK legal knowledge (PIDA 1998)
- Case summary generation
- Evidence upload capability
- Admin dashboard for case management
- Secure, encrypted communications

## Architecture
- **Frontend**: React with Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key

## What's Been Implemented (March 2026)
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

## API Endpoints
- POST /api/session/create - Create anonymous session
- POST /api/chat/start/{token} - Start chat
- POST /api/chat/message - Send/receive messages
- POST /api/triage/generate-summary - Generate case summary
- POST /api/triage/submit - Submit case
- POST /api/admin/auth/login - Admin login
- GET /api/admin/cases - List cases
- GET /api/admin/cases/{ref} - Case detail
- PATCH /api/admin/cases/{ref}/status - Update status

## Prioritized Backlog
### P0 (Critical)
- [x] Core chat flow
- [x] Admin dashboard

### P1 (High)
- [ ] Evidence upload with metadata stripping
- [ ] MFA for admin users
- [ ] Email notifications for new cases

### P2 (Medium)
- [ ] Case export to PDF
- [ ] Secure messaging between whistleblower and advisor
- [ ] Regulator routing suggestions

### P3 (Low)
- [ ] Case timeline builder
- [ ] Anonymous follow-up messaging
- [ ] Analytics dashboard

## Next Tasks
1. Implement evidence upload portal
2. Add MFA for admin authentication
3. Set up email notifications
4. VPS deployment
