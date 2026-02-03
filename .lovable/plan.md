
# Company Onboarding Questionnaire PDF

## Overview
Create a printable PDF document that collects all information needed to onboard companies to the Aura Intercept platform. This document will serve as a discovery questionnaire that can be emailed, printed, or completed during sales calls.

---

## PDF Structure

### Cover Page
- Aura Intercept branding with logo placeholder
- Title: "Company Onboarding Questionnaire"
- Subtitle: "Complete this form to help us configure your AI platform"
- Date field and version number (2026)

### Section 1: Company Profile (2 pages)
Fillable fields for core company information:

| Field | Purpose |
|-------|---------|
| Company Name | Dashboard display |
| Primary Contact Name | Admin account |
| Primary Contact Email | Login credentials |
| Primary Contact Phone | SMS notifications |
| Business Address | Service area setup |
| Website URL | Widget integration |
| Industry/Business Type | Tier recommendation |
| Years in Business | Context for setup |
| Logo (attach separately) | Branding |
| Brand Colors (Primary/Secondary) | Theme customization |

### Section 2: Business Operations Info (1 page)
| Field | Purpose |
|-------|---------|
| Total Employee Count | Tier limits |
| Number of Technicians/Field Staff | Field ops setup |
| Number of Locations | Multi-location config |
| Approximate Annual Revenue | Tier recommendation |
| Business Hours (per day) | Availability config |
| Emergency/After-Hours Contact | Emergency routing |
| Service Categories (list) | Knowledge base |
| Service Area (cities/zip codes) | Dispatch zones |

### Section 3: AI Opportunity Audit Questions (6-8 pages)
All 30 questions from the online audit, organized by section with checkbox options:

**Section A: Business Basics (4 questions)**
1. Employee count
2. Multi-location status
3. Annual revenue
4. Industry type

**Section B: Industry & Services (2 questions)**
5. Appointment model
6. Service location

**Section C: Lead Intake & Response (3 questions)**
7. Lead response time
8. After-hours call handling
9. Weekly lead volume

**Section D: Communication Preferences (4 questions)**
10. AI interaction mode (text vs voice)
11. Preferred communication channels
12. Weekly missed calls
13. Reservation/booking call needs

**Section E: Scheduling & Operations (5 questions)**
14. Current booking process
15. Calendar sync vs portal preference
16. Daily appointment volume
17. Dispatch/routing method
18. Customer ETA communication

**Section F: Customer Retention & Reviews (3 questions)**
19. Review collection process
20. Customer reactivation strategy
21. Appointment reminder method

**Section G: Social Media & Web Presence (3 questions)**
22. Social media activity level
23. Content creation method
24. Website status

**Section H: Business Operations (3 questions)**
25. Quoting process
26. Inventory tracking
27. Walk-in vs appointment model

**Section I: Analytics & Growth (2 questions)**
28. Performance tracking method
29. Marketing automation status

### Section 4: Integration Requirements Checklist (1 page)
Pre-onboarding checklist for 3rd party accounts:

| Integration | Required For | Account Ready? |
|-------------|--------------|----------------|
| Twilio | Voice & SMS | [ ] Yes [ ] No [ ] Need Help |
| ElevenLabs | AI Voice | [ ] Yes [ ] No [ ] Need Help |
| Resend | Email Delivery | [ ] Yes [ ] No [ ] Need Help |
| Stripe | Payments | [ ] Yes [ ] No [ ] Need Help |
| Google Calendar | Scheduling | [ ] Yes [ ] No [ ] Need Help |
| Social Media Accounts | Social Tools | [ ] Yes [ ] No [ ] Need Help |

### Section 5: Knowledge Base Setup (2 pages)
Forms to collect:
- **Services List**: Name, description, duration, price (table with 10 rows)
- **FAQs**: Question/Answer pairs (10 rows)
- **Common Customer Questions**: Free-form list
- **Competitor Differentiators**: What makes you unique

### Section 6: Employee Information (1 page)
Table for initial employee accounts:
| Name | Email | Phone | Role | Job Type |
|------|-------|-------|------|----------|
| (5-10 blank rows) |

### Section 7: Additional Notes & Goals (1 page)
- "What are your top 3 pain points?"
- "What would success look like in 90 days?"
- "Any specific features you're most excited about?"
- Signature and date line

---

## Technical Implementation

### New File
`src/components/documentation/CompanyOnboardingPDF.tsx`

### Key Features
- Uses @react-pdf/renderer (existing dependency)
- Applies sanitizePdfText() for all text content
- Professional styling matching existing PDFs
- Checkbox-style options for audit questions
- Fillable line spaces for form fields
- Page numbers and headers

### Export Integration
Add to existing PDF export dialog (likely in Export Documentation section)

### Data Sources
- Import `QUESTIONS`, `SECTION_ORDER` from `src/components/audit/types.ts`
- Import `INTEGRATION_REQUIREMENTS` from `src/lib/documentationConfig.ts`
- Import `SUBSCRIPTION_TIERS` for tier reference

---

## Page Count Estimate
- Cover: 1 page
- Company Profile: 2 pages
- Business Operations: 1 page
- Audit Questions: 7 pages (4-5 questions per page)
- Integration Checklist: 1 page
- Knowledge Base: 2 pages
- Employee Info: 1 page
- Notes & Goals: 1 page

**Total: ~16 pages**

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/documentation/CompanyOnboardingPDF.tsx` | CREATE - Main PDF component |
| `src/pages/Dashboard.tsx` or Export page | MODIFY - Add export button |

