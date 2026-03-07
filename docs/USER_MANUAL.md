# WBUK AI Triage Platform - User Manual

## Table of Contents

1. [For Whistleblowers](#for-whistleblowers)
2. [For WBUK Advisors](#for-wbuk-advisors)
3. [Admin Guide](#admin-guide)

---

# For Whistleblowers

## Getting Started

### Starting a Confidential Chat

1. Visit the platform homepage
2. Click **"Start Confidential Chat"**
3. A new anonymous session will be created automatically
4. No registration or personal details required

### The Triage Process

The AI assistant will guide you through a series of questions to understand your situation:

1. **What happened?** - Describe the wrongdoing you've witnessed
2. **Where did it occur?** - The sector/industry involved
3. **Your relationship** - How you came to know about this (worker, contractor, etc.)
4. **Evidence** - What documentation or proof you have
5. **Risk factors** - Any concerns about retaliation

### Understanding Your Assessment

After the conversation, you'll receive:

- **Legal Assessment**: Whether your disclosure likely qualifies for legal protection
- **Risk Assessment**: Analysis of potential risks you may face
- **Recommended Actions**: Next steps based on your situation
- **Prescribed Persons**: Relevant regulatory bodies for your sector

### Uploading Evidence

You can upload supporting documents:

- **Supported formats**: PDF, Word, Excel, images, emails
- **Maximum size**: 50MB per file
- **Security**: All metadata is automatically stripped from files

### Submitting Your Case

When ready:

1. Review your case summary
2. Click **"Submit to WBUK Advisors"**
3. Save your **Case Reference Number** - you'll need this for follow-up
4. A WBUK advisor will review your case

### Privacy & Anonymity

- No account or email required
- No IP addresses logged
- Session data encrypted
- You control what information you share

---

# For WBUK Advisors

## Accessing the Admin Dashboard

1. Navigate to `/admin`
2. Enter your email and password
3. Click **"Sign In"**

## Dashboard Overview

### Statistics Cards

- **Total Cases**: All submitted cases
- **New Cases**: Cases awaiting initial review
- **In Progress**: Cases currently being worked on
- **High Priority**: Cases flagged as urgent

### Case List

The main table shows all cases with:

- **Reference**: Unique case identifier
- **Summary**: Brief description
- **Status**: Current case status
- **Risk Level**: P1 (Critical), P2 (High), P3 (Normal)
- **Date**: Submission date

### Filtering & Search

- **Search**: Find cases by reference or keywords
- **Status Filter**: Filter by case status
- **Priority Filter**: Filter by risk level

## Case Detail View

Click any case to view full details:

### Executive Summary
AI-generated summary of the disclosure

### Classification
- Organisation sector
- Type of wrongdoing
- Whistleblower's role
- Available evidence

### Legal Assessment
- Protected disclosure likelihood
- Confidence level
- Relevant legislation
- Recommended prescribed persons

### Risk Assessment
- Overall risk level
- Employment risk
- Retaliation risk
- Identified risk factors

### Evidence
- List of uploaded files
- Click to download (secure, admin-only)

### Triage Conversation
Full chat history between whistleblower and AI

## Managing Cases

### Updating Status

1. Open case detail
2. Use the **Status** dropdown
3. Select new status:
   - **New** - Just submitted
   - **Under Review** - Being assessed
   - **In Progress** - Active investigation
   - **Escalated** - Referred to senior advisor
   - **Resolved** - Case concluded
   - **Closed** - No further action

### Adding Notes

Internal notes for advisor collaboration:

1. Type note in the text box
2. Click **"Add Note"**
3. Notes are visible to all advisors
4. Notes include timestamp and author

---

# Admin Guide

## User Management

*Super Admins only*

### Accessing User Management

1. Click **"Users"** button in header
2. View all advisor accounts

### Creating New Advisors

1. Click **"Add User"**
2. Enter:
   - Full name
   - Email address
   - Password (min 8 characters)
   - Role (Advisor or Super Admin)
3. Click **"Create User"**

### Editing Users

1. Click the edit icon on a user row
2. Update details as needed
3. Click **"Save Changes"**

### Disabling Accounts

1. Click edit on the user
2. Toggle **"Account Active"** off
3. Save changes

### Password Reset

1. Click the key icon on a user row
2. Enter new password
3. Click **"Reset Password"**

## Roles & Permissions

### Advisor
- View all cases
- Update case status
- Add case notes
- Download evidence

### Super Admin
- All Advisor permissions
- Create new users
- Edit users
- Disable accounts
- Reset passwords

## Security Best Practices

1. **Change default password** immediately after first login
2. **Use strong passwords** - minimum 12 characters recommended
3. **Don't share credentials** - each advisor should have their own account
4. **Log out** when finished, especially on shared computers
5. **Report suspicious activity** to your system administrator

---

## Frequently Asked Questions

### For Whistleblowers

**Q: Is my identity protected?**
A: Yes. No personal information is required. Sessions are anonymous and encrypted.

**Q: Can I save my progress and return later?**
A: Yes. Keep your session URL or case reference to return to your conversation.

**Q: What happens after I submit?**
A: A WBUK advisor will review your case and may contact you through the platform if you've provided contact details.

**Q: Can I delete my submission?**
A: Contact WBUK directly if you wish to withdraw your case.

### For Advisors

**Q: How do I contact a whistleblower?**
A: Currently through the platform messaging (if implemented) or through contact details they've voluntarily provided.

**Q: Can I export case data?**
A: Case summaries can be viewed and copied. Full export functionality may be added in future updates.

**Q: What if I forget my password?**
A: Contact your Super Admin to reset your password.

---

## Support

For technical issues:
- Contact your system administrator
- Check the [GitHub repository](https://github.com/andrewdunn358-dev/wbuk-ai-triage) for updates

For whistleblowing guidance:
- Visit [WBUK.org](https://wbuk.org)
- Call the WBUK helpline
