
# Update PricingComparisonTable with New Plan Information

## Overview
Update the "See More Details" comparison table to accurately reflect the new universal agent distribution, console access, and 3rd party integration requirements for all subscription tiers.

---

## Changes Required

### 1. AI Agents Section (Lines 96-125)

**Universal Agents → ALL tiers get ✓:**
| Agent | Current | Updated |
|-------|---------|---------|
| AI Receptionist (Triage) | Express ❌, Core ❌ | ALL ✓ |
| Campaign Agent | Command only | ALL ✓ |
| Lead Agent | Command only | ALL ✓ |
| Marketing Agent | Command only | ALL ✓ |
| Social Media Agent | Command only | ALL ✓ |
| Social Media Scheduler | Command only | ALL ✓ |
| Social Media Analytics | Command only | ALL ✓ |
| Creative Agent | Command only | ALL ✓ |

**Tier-Specific Agents (remain as-is):**
| Agent | Express | Flow | Halo | Core | Single | Multi | Command |
|-------|---------|------|------|------|--------|-------|---------|
| Follow-up Agent | ❌ | ❌ | ✓ | ❌ | ✓ | ✓ | ✓ |
| Review Agent | ❌ | ❌ | ❌ | ❌ | ✓ | ✓ | ✓ |
| Scheduling Agent | ❌ | ✓ | ✓ | ❌ | ❌ | ✓ | ✓ |
| Dispatch/Route/ETA/Checkin | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ | ✓ |
| Quote/Invoice Agent | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ | ✓ |
| Admin/Inventory | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ |
| Analytics Agents | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ |
| Web Presence Agent | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ |

---

### 2. Control Centers Section (Lines 128-137)

**Update title from:** `Control Centers (0 / 0 / 1 / 0 / 1 / 2 / 7)`  
**To:** `Control Centers (2 / 2 / 3 / 2 / 3 / 4 / 7)`

**Updated Console Access:**
| Console | Express | Flow | Halo | Core | Single | Multi | Command |
|---------|---------|------|------|------|--------|-------|---------|
| Customer Portal | ❌ | ❌ | ✓ | ❌ | ✓ | ✓ | ✓ |
| Field Operations | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ | ✓ |
| Business Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ |
| Outreach & Sales Ops | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytics & Reports | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ |
| Social Media | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Web Presence | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ |

---

### 3. Required 3rd Party Integrations Section (Lines 169-177)

**Based on `INTEGRATION_REQUIREMENTS` from documentationConfig.ts:**

| Integration | Express | Flow | Halo | Core | Single | Multi | Command |
|-------------|---------|------|------|------|--------|-------|---------|
| Resend (Email) | Optional | Required | Optional | Optional | Required | Required | Required |
| Stripe (Payments) | Optional | Optional | Optional | Optional | Optional | Required | Required |
| Twilio (SMS/Voice) | Required | Required | Required | Optional | Required | Required | Required |
| ElevenLabs (Voice) | Required | Required | Required | Optional | Required | Required | Required |
| Calendar Sync | Optional | Required | Required | Optional | Optional | Required | Required |
| Social Media Accounts | Required | Required | Required | Required | Required | Required | Required |
| Tavily (AI Research) | Optional | Optional | Optional | Optional | Optional | Optional | Optional |

---

## Technical Implementation

### File: `src/components/landing/PricingComparisonTable.tsx`

**Section 1 - AI Agents (lines 97-125):**
```typescript
// Universal agents - ALL tiers
{ name: 'AI Receptionist (Triage)', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Campaign Agent', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Lead Agent', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Marketing Agent', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Social Media Agent', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Social Media Scheduler', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Social Media Analytics', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Creative Agent', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
```

**Section 2 - Control Centers title (line 128):**
```typescript
title: 'Control Centers (2 / 2 / 3 / 2 / 3 / 4 / 7)',
```

**Section 3 - Control Centers features (lines 129-137):**
```typescript
{ name: 'Outreach & Sales Ops Console', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
{ name: 'Social Media Console', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' },
```

**Section 4 - Required 3rd Party Integrations (lines 169-177):**
```typescript
{ name: 'Resend (Email)', express: 'Optional', flow: 'Required', halo: 'Optional', core: 'Optional', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
{ name: 'Stripe (Payments)', express: 'Optional', flow: 'Optional', halo: 'Optional', core: 'Optional', singlePoint: 'Optional', multiTrack: 'Required', command: 'Required' },
{ name: 'Twilio (SMS & Voice)', express: 'Required', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
{ name: 'ElevenLabs (Voice)', express: 'Required', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
{ name: 'Calendar Sync', express: 'Optional', flow: 'Required', halo: 'Required', core: 'Optional', singlePoint: 'Optional', multiTrack: 'Required', command: 'Required' },
{ name: 'Social Media Accounts', express: 'Required', flow: 'Required', halo: 'Required', core: 'Required', singlePoint: 'Required', multiTrack: 'Required', command: 'Required' },
{ name: 'Tavily (AI Research)', express: 'Optional', flow: 'Optional', halo: 'Optional', core: 'Optional', singlePoint: 'Optional', multiTrack: 'Optional', command: 'Optional' },
```

---

## Summary of Agent Counts per Tier

| Tier | Agents | Consoles |
|------|--------|----------|
| Express | 8 | 2 |
| Flow | 10 | 2 |
| Halo | 10 | 3 |
| Core | 8 | 2 |
| Single-Point | 10 | 3 |
| Multi-Track | 17 | 4 |
| Command | 24 | 7 |

---

## Validation After Implementation

- [ ] All 7 tiers show ✓ for 8 universal agents
- [ ] Control Centers title shows correct counts (2/2/3/2/3/4/7)
- [ ] Outreach & Sales console shows ✓ for all tiers
- [ ] Social Media console shows ✓ for all tiers
- [ ] 3rd Party Integrations match INTEGRATION_REQUIREMENTS config
- [ ] Social Media Accounts shows "Required" for all tiers (they have social agents)
- [ ] Tavily shows "Optional" for all tiers (AI research is optional)
