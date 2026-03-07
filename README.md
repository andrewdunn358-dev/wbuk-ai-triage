# WBUK AI Triage Platform

A secure, AI-powered whistleblower triage platform built for Whistleblower UK (WBUK). This platform enables individuals to anonymously report concerns, receive AI-guided assessment of whether their disclosure qualifies for legal protection under UK law, and connect with WBUK advisors for support.

## Overview

The WBUK AI Triage Platform provides a confidential, anonymous way for whistleblowers to:
- Report concerns without revealing their identity
- Understand if their disclosure qualifies as a "protected disclosure" under the Public Interest Disclosure Act 1998 (PIDA)
- Receive risk assessment and guidance
- Submit cases for review by qualified WBUK advisors
- Upload supporting evidence securely

## Key Features

### For Whistleblowers

- **Anonymous Reporting**: No account required. Session-based system with no IP logging
- **AI-Guided Triage**: Conversational AI that asks relevant questions to understand your situation
- **Legal Assessment**: Automatic evaluation against UK whistleblowing law criteria
- **Risk Assessment**: Analysis of potential risks including employment, retaliation, and personal safety
- **Evidence Upload**: Secure file upload with automatic metadata stripping for PDFs and images
- **Case Summary**: Clear summary of your disclosure with recommended next steps
- **Prescribed Persons Guidance**: Recommendations for appropriate regulatory bodies based on your sector

### For WBUK Advisors

- **Secure Admin Dashboard**: Password-protected access for authorized advisors
- **Case Management**: View, filter, and search submitted cases
- **AI Scoring Breakdown**: Detailed 5-stage legal assessment scores
- **Risk Indicators**: Visual risk level indicators for prioritization
- **Case Notes**: Internal notes system for advisor collaboration
- **Status Tracking**: Track cases through New → Under Review → In Progress → Resolved
- **Evidence Management**: Secure download of uploaded evidence files
- **User Management**: Super admins can create and manage advisor accounts

### AI Triage Engine

The platform uses a sophisticated 5-stage AI scoring system:

1. **Qualifying Disclosure Assessment** - Does the concern fall within PIDA categories?
2. **Public Interest Test** - Is there genuine public interest?
3. **Worker Status Verification** - Does the person qualify as a "worker"?
4. **Reasonable Belief Assessment** - Is there reasonable belief wrongdoing occurred?
5. **Appropriate Recipient Evaluation** - Is WBUK an appropriate disclosure route?

### Security Features

- **Anonymous Sessions**: UUID-based sessions with no personal data required
- **Encrypted Storage**: All data encrypted at rest
- **Metadata Stripping**: Automatic removal of metadata from uploaded files
- **JWT Authentication**: Secure token-based admin authentication
- **Password Hashing**: BCrypt password hashing for admin accounts
- **Audit Logging**: All admin actions logged for accountability

## Technology Stack

- **Frontend**: React, Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM
- **File Storage**: MinIO (S3-compatible)
- **Deployment**: Docker Compose

## Legal Framework

The platform is designed around UK whistleblowing legislation:

- **Public Interest Disclosure Act 1998 (PIDA)**
- **Employment Rights Act 1996 (ERA)**
- **Prescribed Persons Order**

### Qualifying Disclosures

The AI assesses whether disclosures relate to:
- Criminal offences
- Failure to comply with legal obligations
- Miscarriages of justice
- Health and safety dangers
- Environmental damage
- Deliberate concealment of any of the above

## Deployment

### Quick Install (Ubuntu 24.04)

```bash
curl -sSL https://raw.githubusercontent.com/andrewdunn358-dev/wbuk-ai-triage/main/deploy/install.sh | sudo bash
```

### Manual Installation

See [DEPLOYMENT.md](deploy/DEPLOYMENT.md) for detailed instructions.

## Default Admin Access

After installation, login at `/admin` with:
- Email: `andyd358@hotmail.com`
- Password: `WBUKAdmin2026!`

**Important**: Change the default password after first login.

## Configuration

Environment variables (in `.env`):

| Variable | Description |
|----------|-------------|
| `PUBLIC_URL` | Your domain (e.g., https://radiocheck.org.uk) |
| `MONGO_USER` | MongoDB username |
| `MONGO_PASSWORD` | MongoDB password |
| `JWT_SECRET` | Secret key for JWT tokens |
| `EMERGENT_LLM_KEY` | API key for AI features |

## API Documentation

Once running, API docs available at:
- Swagger UI: `http://your-domain/docs`
- ReDoc: `http://your-domain/redoc`

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/andrewdunn358-dev/wbuk-ai-triage/issues)
- WBUK Website: [wbuk.org](https://wbuk.org)

## License

Proprietary - Whistleblower UK

## Acknowledgments

Built with support from Emergent.sh
