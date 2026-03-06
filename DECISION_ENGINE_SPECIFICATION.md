# WBUK AI Triage Decision Engine
## Protected Disclosure Assessment Framework

Version: 1.0  
Legal Basis: Public Interest Disclosure Act 1998 (PIDA), Employment Rights Act 1996

---

## 1. DECISION ENGINE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROTECTED DISCLOSURE DECISION ENGINE                      │
└─────────────────────────────────────────────────────────────────────────────┘

                         USER INPUT (Triage Conversation)
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   STAGE 1: QUALIFYING DISCLOSURE    │
                    │   Does the information tend to      │
                    │   show a "relevant failure"?        │
                    │   (Section 43B ERA 1996)            │
                    └─────────────────────────────────────┘
                                      │
                         Score: 0-100 │ Threshold: 40
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   STAGE 2: PUBLIC INTEREST TEST     │
                    │   Is disclosure in the public       │
                    │   interest? (Not purely personal)   │
                    └─────────────────────────────────────┘
                                      │
                         Score: 0-100 │ Threshold: 30
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   STAGE 3: WORKER STATUS            │
                    │   Does the person qualify as a      │
                    │   "worker" under s.43K?             │
                    └─────────────────────────────────────┘
                                      │
                         Score: 0-100 │ Threshold: 50
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   STAGE 4: REASONABLE BELIEF        │
                    │   Does the worker reasonably        │
                    │   believe the information is true?  │
                    └─────────────────────────────────────┘
                                      │
                         Score: 0-100 │ Threshold: 40
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   STAGE 5: APPROPRIATE RECIPIENT    │
                    │   Is/was disclosure made to an      │
                    │   appropriate person? (s.43C-43H)   │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │   FINAL CLASSIFICATION              │
                    │   + Risk Assessment                 │
                    │   + Recommended Actions             │
                    └─────────────────────────────────────┘
```

---

## 2. STAGE 1: QUALIFYING DISCLOSURE SCORING

### 2.1 Relevant Failure Categories (Section 43B)

Each category receives a base score. Evidence strength multiplies the score.

| Failure Type | Code | Base Score | Description |
|-------------|------|------------|-------------|
| Criminal Offence | CF01 | 25 | A criminal offence has been/is being/is likely to be committed |
| Legal Obligation | CF02 | 20 | Failure to comply with any legal obligation |
| Miscarriage of Justice | CF03 | 25 | A miscarriage of justice has occurred/is occurring/is likely |
| Health & Safety | CF04 | 25 | Health or safety of any individual is endangered |
| Environmental Damage | CF05 | 20 | The environment is being damaged |
| Concealment | CF06 | 30 | Information showing any of the above is being deliberately concealed |

### 2.2 Evidence Strength Multiplier

| Evidence Level | Multiplier | Indicators |
|---------------|------------|------------|
| Strong | 1.5x | Documents, emails, financial records, multiple witnesses |
| Moderate | 1.2x | Some documentation, direct observation, single witness |
| Limited | 1.0x | Personal knowledge only, no corroboration |
| Weak | 0.7x | Hearsay, speculation, incomplete information |

### 2.3 Temporal Modifier

| Timing | Modifier | Description |
|--------|----------|-------------|
| Ongoing | +15 | The wrongdoing is currently happening |
| Recent | +10 | Within last 6 months |
| Historical | +0 | More than 6 months ago |
| Imminent | +20 | About to happen (preventable) |

### 2.4 Calculation Formula

```
Stage1_Score = (Base_Score × Evidence_Multiplier) + Temporal_Modifier

Example:
- Health & Safety violation (25)
- Strong evidence (×1.5)
- Ongoing (+15)
= (25 × 1.5) + 15 = 52.5 points

Threshold: 40 points to proceed
```

---

## 3. STAGE 2: PUBLIC INTEREST TEST

### 3.1 Public Interest Indicators

Based on *Chesterton Global Ltd v Nurmohamed [2017] EWCA Civ 979*

| Factor | Score | Weight | Description |
|--------|-------|--------|-------------|
| Number Affected | 0-20 | High | How many people are affected? |
| Nature of Wrongdoing | 0-20 | High | Severity and type of wrongdoing |
| Identity of Wrongdoer | 0-15 | Medium | Public body vs private entity |
| Public Funds | 0-15 | Medium | Involves taxpayer money |
| Vulnerable Groups | 0-15 | Medium | Affects children, patients, elderly |
| Ongoing Risk | 0-15 | Medium | Continuing danger to public |

### 3.2 Number Affected Scoring

| Scope | Score |
|-------|-------|
| Individual only (personal grievance) | 0 |
| Small group (2-10 people) | 8 |
| Department/Team (11-50) | 12 |
| Organisation-wide (51-500) | 16 |
| Public/External impact (500+) | 20 |

### 3.3 Nature of Wrongdoing Scoring

| Severity | Score | Examples |
|----------|-------|----------|
| Minor procedural | 5 | Policy violations, minor breaches |
| Moderate | 10 | Regulatory non-compliance, discrimination |
| Serious | 15 | Fraud, significant safety risks |
| Grave | 20 | Deaths, large-scale fraud, serious crime |

### 3.4 Personal vs Public Interest Matrix

```
┌────────────────────────────────────────────────────────────────┐
│                    PUBLIC INTEREST MATRIX                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PURE PERSONAL GRIEVANCE          MIXED INTEREST                │
│  ────────────────────             ──────────────                │
│  • Pay dispute (self only)        • Pay discrimination          │
│  • Personal performance review      (affects class)             │
│  • Personality clash              • Unsafe working conditions   │
│  • Contract terms (individual)      (affects others)            │
│                                   • Policy affecting team       │
│  Score: 0-15                      Score: 30-60                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  PUBLIC INTEREST CLEAR            SIGNIFICANT PUBLIC INTEREST   │
│  ────────────────────             ──────────────────────────    │
│  • Patient safety concerns        • NHS care failures           │
│  • Financial irregularities       • Government fraud            │
│  • Environmental breaches         • Public safety emergency     │
│  • Regulatory violations          • Large-scale crime           │
│                                                                 │
│  Score: 60-80                     Score: 80-100                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 3.5 Calculation Formula

```
Stage2_Score = Number_Affected + Nature_Score + Identity_Score + 
               Public_Funds_Score + Vulnerable_Groups + Ongoing_Risk

Threshold: 30 points to proceed
Below 30: Likely personal grievance, not protected disclosure
```

---

## 4. STAGE 3: WORKER STATUS ASSESSMENT

### 4.1 Worker Categories (Section 43K ERA 1996)

| Category | Code | Status Score | Description |
|----------|------|--------------|-------------|
| Employee | WS01 | 100 | Contract of employment |
| Agency Worker | WS02 | 90 | Supplied by agency |
| Contractor | WS03 | 80 | Personal service contract |
| Trainee | WS04 | 85 | Work experience, apprentice |
| NHS Practitioner | WS05 | 90 | GP, dentist, pharmacist |
| Police Officer | WS06 | 95 | Treated as employee |
| Former Employee | WS07 | 70 | Was employed, disclosure relates to employment period |
| Job Applicant | WS08 | 40 | Pre-employment (limited protection) |
| Member of Public | WS09 | 20 | No employment relationship |
| Volunteer | WS10 | 30 | Generally not covered unless contract |

### 4.2 Employment Evidence Multiplier

| Evidence | Multiplier |
|----------|------------|
| Written contract | 1.0 |
| Verbal agreement confirmed | 0.9 |
| Payslips/Tax records | 1.0 |
| No documentation | 0.7 |

### 4.3 Calculation

```
Stage3_Score = Status_Base_Score × Evidence_Multiplier

Threshold: 50 points
Below 50: May not qualify as "worker" - limited protection
```

---

## 5. STAGE 4: REASONABLE BELIEF ASSESSMENT

### 5.1 Belief Indicators

| Factor | Score Range | Assessment Criteria |
|--------|-------------|---------------------|
| Information Basis | 0-30 | Source and quality of information |
| Verification Efforts | 0-20 | Did they try to verify? |
| Expertise Level | 0-20 | Professional knowledge in area |
| Consistency | 0-15 | Logical consistency of account |
| Proportionality | 0-15 | Response proportionate to concern |

### 5.2 Information Basis Scoring

| Source Quality | Score |
|----------------|-------|
| First-hand witness | 30 |
| Documentary evidence reviewed | 25 |
| Reliable second-hand | 15 |
| Rumour/Hearsay | 5 |
| Speculation only | 0 |

### 5.3 Reasonable Person Test

```
Question: Would a reasonable person in the worker's position,
with their knowledge and experience, believe this information
tends to show wrongdoing?

Scoring Guide:
90-100: Clearly reasonable - strong basis for belief
70-89:  Probably reasonable - good basis
50-69:  Possibly reasonable - some basis
30-49:  Questionable - weak basis
0-29:   Unreasonable - no basis

Threshold: 40 points
```

---

## 6. STAGE 5: APPROPRIATE RECIPIENT

### 6.1 Disclosure Routes (Sections 43C-43H)

| Route | Code | Protection Level | Requirements |
|-------|------|------------------|--------------|
| Employer (s.43C) | DR01 | Full | Good faith (for compensation only) |
| Legal Adviser (s.43D) | DR02 | Full | In course of obtaining advice |
| Minister (s.43E) | DR03 | Full | Crown employee to Minister |
| Prescribed Person (s.43F) | DR04 | Full | Reasonable belief in truth + falls within remit |
| Wider Disclosure (s.43G) | DR05 | Conditional | Additional tests required |
| Exceptionally Serious (s.43H) | DR06 | Conditional | Exceptionally serious failure |

### 6.2 Section 43G Additional Requirements

For wider disclosures to be protected:

| Requirement | Weight | Assessment |
|-------------|--------|------------|
| Not for personal gain | Essential | Must be true |
| Reasonable belief in truth | Essential | From Stage 4 |
| Previously disclosed to employer/prescribed person OR reasonable belief evidence destroyed/victimisation likely | Essential | One must apply |
| Reasonable in all circumstances | Essential | Weighted assessment |

### 6.3 Circumstances Reasonableness Factors (s.43G(3))

| Factor | Score | Description |
|--------|-------|-------------|
| Identity of recipient | 0-20 | Appropriate person to receive? |
| Seriousness of failure | 0-20 | More serious = wider disclosure justified |
| Continuing/likely to recur | 0-15 | Ongoing issue? |
| Breach of confidentiality | 0-15 | Level of confidentiality owed to employer |
| Previous disclosure response | 0-15 | Did employer/regulator act? |
| Internal procedure followed | 0-15 | Were internal routes used first? |

---

## 7. RISK ASSESSMENT MODULE

### 7.1 Risk Categories

| Risk Type | Code | Weight |
|-----------|------|--------|
| Employment Risk | R01 | 30% |
| Retaliation Risk | R02 | 25% |
| Legal Exposure | R03 | 20% |
| Financial Risk | R04 | 15% |
| Personal Safety | R05 | 10% |

### 7.2 Employment Risk Indicators

| Indicator | Score | Description |
|-----------|-------|-------------|
| No current concerns | 0-20 | Stable employment |
| Performance issues raised | 30-50 | Recent criticism |
| Disciplinary action initiated | 50-70 | Process started |
| Dismissal threatened | 70-90 | Explicit threats |
| Already dismissed | 90-100 | Job already lost |

### 7.3 Retaliation Risk Indicators

| Indicator | Score |
|-----------|-------|
| Organisation has whistleblowing policy | -10 |
| Previous whistleblowers treated well | -15 |
| Previous whistleblowers mistreated | +30 |
| Culture of speaking up | -15 |
| Culture of silence/fear | +25 |
| Senior management involved in wrongdoing | +20 |
| HR involvement in wrongdoing | +15 |

### 7.4 Overall Risk Calculation

```
Risk_Score = (R01 × 0.30) + (R02 × 0.25) + (R03 × 0.20) + 
             (R04 × 0.15) + (R05 × 0.10)

Classification:
0-25:   LOW
26-50:  MEDIUM
51-75:  HIGH
76-100: CRITICAL
```

---

## 8. FINAL CLASSIFICATION MATRIX

### 8.1 Combined Score Calculation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINAL SCORE CALCULATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Stage 1 (Qualifying Disclosure)     × 0.25  =  ____                        │
│  Stage 2 (Public Interest)           × 0.25  =  ____                        │
│  Stage 3 (Worker Status)             × 0.15  =  ____                        │
│  Stage 4 (Reasonable Belief)         × 0.20  =  ____                        │
│  Stage 5 (Appropriate Recipient)     × 0.15  =  ____                        │
│                                              ─────────                       │
│  TOTAL PROTECTION LIKELIHOOD SCORE           =  ____  /100                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Classification Outputs

| Score Range | Classification | Confidence | Recommendation |
|-------------|----------------|------------|----------------|
| 80-100 | LIKELY PROTECTED | High | Strong case for protection |
| 65-79 | PROBABLY PROTECTED | Medium-High | Good prospects, some considerations |
| 50-64 | POSSIBLY PROTECTED | Medium | Merits further review |
| 35-49 | UNCERTAIN | Low-Medium | Significant questions remain |
| 20-34 | UNLIKELY PROTECTED | Low | May not meet criteria |
| 0-19 | NOT PROTECTED | High | Does not appear to qualify |

### 8.3 Alternative Classifications

If not a Protected Disclosure, classify as:

| Classification | Criteria | Guidance |
|----------------|----------|----------|
| EMPLOYMENT GRIEVANCE | Personal matter, no public interest | Internal HR process |
| EMPLOYMENT DISPUTE | Contract/terms issue | Employment tribunal route |
| PERSONAL COMPLAINT | Individual treatment only | Consider other remedies |
| SAFETY CONCERN | H&S but limited scope | Health & Safety Executive |
| REGULATORY MATTER | Compliance issue | Direct to regulator |

---

## 9. PRESCRIBED PERSONS ROUTING

### 9.1 Sector-Regulator Mapping

| Sector | Primary Regulator | Secondary |
|--------|-------------------|-----------|
| NHS/Healthcare | CQC | GMC, NMC, NHS England |
| Financial Services | FCA | PRA, SFO |
| Government/Public | NAO | PHSO, ICO |
| Environment | Environment Agency | Natural England |
| Workplace Safety | HSE | Local Authority |
| Charities | Charity Commission | — |
| Education | Ofsted | DfE |
| Data Protection | ICO | — |
| Tax/Revenue | HMRC | — |
| Police | IOPC | HMICFRS |
| Local Government | LGO | Monitoring Officer |

### 9.2 Wrongdoing-Regulator Mapping

| Wrongdoing Type | Primary Prescribed Person |
|-----------------|--------------------------|
| Fraud (public sector) | NAO, SFO |
| Fraud (financial services) | FCA, SFO |
| Fraud (general) | Police, SFO |
| Patient safety | CQC, GMC |
| Care quality | CQC |
| Child protection | Ofsted, Local Authority |
| Environmental damage | Environment Agency |
| Health & Safety | HSE |
| Data breach | ICO |
| Money laundering | FCA, NCA |
| Tax evasion | HMRC |
| Bribery/Corruption | SFO, Police |

---

## 10. OUTPUT TEMPLATES

### 10.1 Assessment Summary JSON Structure

```json
{
  "assessment_id": "UUID",
  "timestamp": "ISO-8601",
  "version": "1.0",
  
  "scores": {
    "stage1_qualifying_disclosure": {
      "score": 0-100,
      "threshold_met": true/false,
      "failure_types_identified": ["CF01", "CF04"],
      "evidence_strength": "Strong/Moderate/Limited/Weak",
      "temporal_status": "Ongoing/Recent/Historical/Imminent"
    },
    "stage2_public_interest": {
      "score": 0-100,
      "threshold_met": true/false,
      "scope": "Individual/Small Group/Organisation/Public",
      "severity": "Minor/Moderate/Serious/Grave"
    },
    "stage3_worker_status": {
      "score": 0-100,
      "threshold_met": true/false,
      "category": "WS01-WS10",
      "employment_verified": true/false
    },
    "stage4_reasonable_belief": {
      "score": 0-100,
      "threshold_met": true/false,
      "information_source": "First-hand/Documentary/Second-hand/Hearsay"
    },
    "stage5_recipient": {
      "score": 0-100,
      "current_route": "DR01-DR06",
      "recommended_route": "DR01-DR06"
    }
  },
  
  "final_assessment": {
    "total_score": 0-100,
    "classification": "LIKELY_PROTECTED/PROBABLY_PROTECTED/POSSIBLY_PROTECTED/UNCERTAIN/UNLIKELY_PROTECTED/NOT_PROTECTED",
    "confidence": "High/Medium/Low",
    "alternative_classification": null/"EMPLOYMENT_GRIEVANCE/etc"
  },
  
  "risk_assessment": {
    "overall_risk": "LOW/MEDIUM/HIGH/CRITICAL",
    "employment_risk": 0-100,
    "retaliation_risk": 0-100,
    "legal_exposure": 0-100,
    "financial_risk": 0-100,
    "personal_safety": 0-100,
    "risk_factors": ["string"],
    "protective_factors": ["string"]
  },
  
  "recommendations": {
    "primary_action": "string",
    "prescribed_persons": [{
      "name": "string",
      "relevance": "Primary/Secondary",
      "contact": "string"
    }],
    "urgency": "IMMEDIATE/URGENT/STANDARD",
    "cautions": ["string"],
    "next_steps": ["string"]
  },
  
  "legal_references": {
    "primary_legislation": ["PIDA 1998", "ERA 1996"],
    "relevant_sections": ["s.43B", "s.43C"],
    "case_law": ["Chesterton v Nurmohamed [2017]"]
  }
}
```

### 10.2 Human-Readable Summary Template

```
═══════════════════════════════════════════════════════════════════════════════
                    PROTECTED DISCLOSURE ASSESSMENT
                         Reference: WBUK-XXXX-XXXXX
═══════════════════════════════════════════════════════════════════════════════

OVERALL ASSESSMENT: [LIKELY PROTECTED / PROBABLY PROTECTED / etc.]
CONFIDENCE LEVEL: [High / Medium / Low]
PROTECTION SCORE: [XX]/100

───────────────────────────────────────────────────────────────────────────────
STAGE BREAKDOWN
───────────────────────────────────────────────────────────────────────────────

1. QUALIFYING DISCLOSURE                           [XX/100] ✓/✗
   Failure Type: [Description]
   Evidence: [Strong/Moderate/Limited]
   Status: [Ongoing/Recent/Historical]

2. PUBLIC INTEREST                                 [XX/100] ✓/✗
   Scope: [Number affected]
   Severity: [Level]
   Assessment: [Summary]

3. WORKER STATUS                                   [XX/100] ✓/✗
   Category: [Employee/Contractor/etc.]
   Verified: [Yes/No]

4. REASONABLE BELIEF                               [XX/100] ✓/✗
   Information Basis: [First-hand/Documentary/etc.]
   Assessment: [Summary]

5. DISCLOSURE ROUTE                                [XX/100] ✓/✗
   Current/Planned: [Internal/Prescribed Person/etc.]
   Recommended: [Route with reasons]

───────────────────────────────────────────────────────────────────────────────
RISK ASSESSMENT
───────────────────────────────────────────────────────────────────────────────

OVERALL RISK: [CRITICAL / HIGH / MEDIUM / LOW]

• Employment Risk:    [████████░░] XX%
• Retaliation Risk:   [██████░░░░] XX%
• Legal Exposure:     [████░░░░░░] XX%
• Financial Risk:     [██░░░░░░░░] XX%
• Personal Safety:    [░░░░░░░░░░] XX%

Risk Factors:
• [Factor 1]
• [Factor 2]

Protective Factors:
• [Factor 1]
• [Factor 2]

───────────────────────────────────────────────────────────────────────────────
RECOMMENDED ACTIONS
───────────────────────────────────────────────────────────────────────────────

PRIMARY RECOMMENDATION: [Action]
URGENCY: [IMMEDIATE / URGENT / STANDARD]

Prescribed Persons (Regulators):
1. [Name] - [Relevance]
2. [Name] - [Relevance]

Next Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Cautions:
⚠ [Caution 1]
⚠ [Caution 2]

───────────────────────────────────────────────────────────────────────────────
LEGAL NOTICE
───────────────────────────────────────────────────────────────────────────────

This assessment is provided for guidance only and does not constitute legal
advice. The final determination of whether a disclosure qualifies for
protection is a legal matter that may ultimately be decided by an Employment
Tribunal. We recommend seeking independent legal advice for complex cases.

Relevant Legislation:
• Public Interest Disclosure Act 1998 (PIDA)
• Employment Rights Act 1996 (ss. 43A-43L, 47B, 103A)

═══════════════════════════════════════════════════════════════════════════════
                    Generated by WBUK AI Triage System
                         Assessment Date: [DATE]
═══════════════════════════════════════════════════════════════════════════════
```

---

## 11. IMPLEMENTATION NOTES

### 11.1 AI Prompt Integration

The scoring logic should be embedded in the AI system prompt with instructions to:

1. **Extract information** from conversation into structured data points
2. **Apply scoring rules** to each data point
3. **Calculate weighted scores** for each stage
4. **Generate classification** based on thresholds
5. **Produce recommendations** based on classification and risk

### 11.2 Confidence Calibration

| Confidence Level | Data Completeness | Clarity |
|------------------|-------------------|---------|
| High | All stages assessed, clear answers | Unambiguous information |
| Medium | Most stages assessed, some gaps | Some ambiguity |
| Low | Significant gaps, unclear answers | Considerable uncertainty |

### 11.3 Edge Cases

1. **Partial information**: Score only assessed stages, flag gaps
2. **Contradictory information**: Flag for human review
3. **Mixed grievance/public interest**: Calculate both scores, present both
4. **Multiple wrongdoing types**: Score highest, list all
5. **Historical disclosures**: Still assess, note time limitations

---

## 12. VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial decision engine specification |

---

**Document Classification**: Internal - WBUK Technical Documentation
**Review Schedule**: Quarterly or upon legislative changes
