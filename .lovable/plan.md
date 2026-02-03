
# Outreach & Sales Toolkit Update Plan

## Overview
Update all 6 marketing PDF documents under Export Docs to reflect the current Aura Intercept platform state, including the full 24 AI Operatives, 7 subscription tiers, expanded industry verticals, and current branding.

---

## Current State Issues Identified

| Document | Current State | Issues |
|----------|---------------|--------|
| SocialMediaContentPackPDF | 60+ templates, © 2025 | Outdated year, missing new industry verticals |
| VideoScriptsPDF | 25+ scripts, © 2025 | Outdated year, needs Halo/Express/Flow tier content |
| SalesPitchDataPDF | ROI calculators, © 2025 | Outdated pricing ($3,997), missing all 7 tiers |
| BrandAssetGuidePDF | 19 agent icons, © 2025 | Says 19 agents, needs 24 agent icons |
| WebsiteCopyPDF | 19 agent descriptions, © 2025 | Outdated agent count, pricing info |
| IndustryMarketingKitPDF | 4 industries only | Missing Beauty/Wellness (Halo), Food Service (Express), Personal Services (Flow) |

---

## Updates Required

### 1. SocialMediaContentPackPDF.tsx (~906 lines)
**Changes:**
- Update copyright to © 2026
- Add new industry vertical templates:
  - **Beauty/Wellness** (Halo tier): Salon appointment hooks, spa day posts
  - **Food Service** (Express tier): Menu highlights, daily specials
  - **Personal Services** (Flow tier): Scheduling assistant posts
- Update cover badge to "80+ Templates Included"
- Add 7-tier subscription awareness in prompts

### 2. VideoScriptsPDF.tsx (~718 lines)
**Changes:**
- Update copyright to © 2026
- Add new industry-specific scripts:
  - 15s hook: "Salon Emergency Booking"
  - 30s explainer: "Restaurant Order Management"
  - 60s demo: "Personal Assistant Calendar Sync"
- Update cover badge to "35+ Scripts Included"
- Add scripts highlighting each tier's value proposition

### 3. SalesPitchDataPDF.tsx (~810 lines)
**Changes:**
- Update copyright to © 2026
- Update ROI Calculator to reflect all 7 tiers:
  - Express: $197/mo - Restaurant ROI
  - Aura Flow: $297/mo - Scheduling ROI
  - Halo: $397/mo - Salon ROI
  - Core: $500/mo - Digital Foundation ROI
  - Single-Point: $1,500/mo - Lead Capture ROI
  - Multi-Track: $3,997/mo - Field Ops ROI
  - Pro Command: $5,997/mo - Enterprise ROI
- Add objection handling for each industry vertical
- Update competitor comparison data

### 4. BrandAssetGuidePDF.tsx (~975 lines)
**Changes:**
- Update copyright to © 2026
- Update agent icon count from 19 to 24:
  - Add icons for: Admin Agent, Forecast Agent, Creative Agent, Web Presence Agent, Marketing Agent
- Update tier colors section:
  - Add Express color (Amber/Orange)
  - Add Flow color (Green)
- Update statistics to "24 AI Operatives, 7 Consoles"

### 5. WebsiteCopyPDF.tsx (~666 lines)
**Changes:**
- Update copyright to © 2026
- Expand "19 AI Agent Copy Blocks" to "24 AI Agent Copy Blocks"
- Add descriptions for all 24 agents:
  - Add: Admin Agent, Forecast Agent, Creative Agent, Web Presence Agent, Marketing Agent
- Update pricing page copy for all 7 tiers
- Add industry-specific landing page copy variations

### 6. IndustryMarketingKitPDF.tsx (~763 lines)
**Changes:**
- Update copyright to © 2026
- Expand from 4 to 7 industry kits:
  - **Existing**: HVAC, Plumbing, Electrical, General Contracting
  - **New**: Beauty & Wellness (Halo), Food Service (Express), Personal Services (Flow)
- Update cover badge from "4 Complete Kits" to "7 Complete Kits"
- Add industry-specific pain points, solutions, and marketing templates for each new vertical

---

## Detailed Content Additions

### New Industry Kit: Beauty & Wellness (Halo)
```text
Pain Points:
- No-shows and late cancellations
- Double-bookings during peak hours
- After-hours appointment requests
- Building a loyal clientele

Solutions:
- AI Receptionist for 24/7 booking
- Automated reminders reduce no-shows by 40%
- Follow-up Agent for rebooking campaigns
- Review Agent for 5-star reputation building

Social Templates:
- "Your next glam appointment is one text away. [sparkle emoji]"
- "We answer at 11 PM because self-care doesn't wait."
```

### New Industry Kit: Food Service (Express)
```text
Pain Points:
- Missed reservation calls during rush
- Menu questions clogging phone lines
- Ordering links getting lost
- No time for social media

Solutions:
- Smart Link sharing for menus and ordering
- AI Voice handles peak call volume
- Knowledge Base for instant menu FAQs
- Designed specifically for restaurants

Social Templates:
- "Ask us anything—our AI knows the menu better than the chef. [wink emoji]"
- "Table for 4 at 7? Already booked. Thanks, Aura."
```

### New Industry Kit: Personal Services (Flow)
```text
Pain Points:
- Calendar chaos across multiple clients
- Missed appointment requests
- No automated reminders
- Manual follow-up burnout

Solutions:
- Direct calendar sync
- 24/7 scheduling via voice and chat
- Automated SMS/Email follow-ups
- Intelligent rebooking suggestions

Social Templates:
- "Your time is precious. Aura manages the calendar so you don't have to."
- "24/7 booking. Zero missed appointments. Pure flow."
```

---

## Updated Statistics Throughout All PDFs

| Metric | Old Value | New Value |
|--------|-----------|-----------|
| AI Operatives | 19 | 24 |
| Consoles | - | 7 |
| Industry Kits | 4 | 7 |
| Subscription Tiers | 3-4 | 7 |
| Templates | 60+ | 80+ |
| Video Scripts | 25+ | 35+ |
| Copyright Year | 2025 | 2026 |

---

## Technical Implementation

### File Changes Summary
| File | Lines | Estimated Changes |
|------|-------|-------------------|
| SocialMediaContentPackPDF.tsx | 906 | +150 lines |
| VideoScriptsPDF.tsx | 718 | +120 lines |
| SalesPitchDataPDF.tsx | 810 | +200 lines |
| BrandAssetGuidePDF.tsx | 975 | +100 lines |
| WebsiteCopyPDF.tsx | 666 | +150 lines |
| IndustryMarketingKitPDF.tsx | 763 | +350 lines |

### Order of Implementation
1. **IndustryMarketingKitPDF** - Add 3 new industry kits (largest change)
2. **WebsiteCopyPDF** - Add 5 missing agent descriptions + pricing
3. **SalesPitchDataPDF** - Update ROI calculators for all 7 tiers
4. **BrandAssetGuidePDF** - Add 5 new agent icons + tier colors
5. **SocialMediaContentPackPDF** - Add industry-specific templates
6. **VideoScriptsPDF** - Add industry-specific scripts

---

## Export Docs Page Updates

Update the card descriptions in `ExportDocumentation.tsx` to reflect new content:
- Social Media Content Pack: "80+ ready-to-post templates for all 6 platforms"
- Video Script Library: "35+ production-ready scripts from 15s hooks to 5-min demos"
- Industry Marketing Kits: "Targeted content for 7 key verticals including HVAC, Plumbing, Beauty, Food Service"
