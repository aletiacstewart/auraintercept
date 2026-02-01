
# Free Audit Update Plan

## Overview
Update the AI Opportunity Audit to include all new tiers, features, and industry-specific questions for restaurants, wellness/beauty, and personal assistants.

## Current State Analysis

The audit currently has:
- **6 Tiers**: EXPRESS, CORE, HALO, SINGLE_POINT, MULTI_TRACK, COMMAND
- **22 Questions** across 8 sections
- **Missing**: Aura Flow tier ($297/mo) - Personal Assistant scheduling tier

### Key Gap Identified
**Aura Flow** is defined in `documentationConfig.ts` but NOT included in the audit scoring system. This tier is positioned between Express ($197) and Halo ($397) for businesses needing AI scheduling without a customer portal.

---

## Implementation Plan

### Phase 1: Add Aura Flow Tier to Scoring System

**File: `src/components/audit/types.ts`**

1. Update `TierType` to include FLOW:
   ```typescript
   export type TierType = 'EXPRESS' | 'FLOW' | 'CORE' | 'HALO' | 'SINGLE_POINT' | 'MULTI_TRACK' | 'COMMAND';
   ```

2. Update `TierScores` interface to include FLOW scoring

3. Add FLOW to `TIER_RECOMMENDATIONS`:
   - Price: $297/mo
   - 4 AI Operatives (Receptionist, Scheduling, Follow-up + Text/Voice)
   - 0 Consoles (calendar sync only, no customer portal)
   - Implementation: $399
   - 2 employees

4. Update all existing question scoring matrices to include FLOW scores

---

### Phase 2: Add New Industry-Specific Questions

**New Section: "Industry & Service Type" (4 questions)**

| Question | Purpose |
|----------|---------|
| "What type of business do you operate?" | Primary industry identifier for Express/Halo/Flow targeting |
| "Do customers typically need to schedule appointments?" | Differentiates scheduling-heavy vs walk-in businesses |
| "What's your primary service delivery model?" | Identifies if field ops (Multi-Track) or in-location (Halo) |
| "Do you have an online ordering or menu system?" | Restaurant-specific for Express tier |

**New Questions for Existing Sections:**

| Section | New Question | Target Tier |
|---------|-------------|-------------|
| Communication | "Do you need AI to handle reservation or booking calls?" | Flow/Halo |
| Scheduling | "Would direct calendar sync (without customer portal) work for you?" | Flow vs Halo |
| Scheduling | "How many appointments do you handle per day?" | Volume-based scoring |
| Retention | "Do you send appointment reminders to customers?" | Flow/Halo automation |
| Operations | "Do you offer walk-in services or appointment-only?" | Express vs Halo |

---

### Phase 3: Update Scoring Logic for New Tiers

**Scoring Philosophy:**

| Tier | Primary Signals |
|------|-----------------|
| **Express** ($197) | Restaurant/cafe, walk-in, menu/ordering links, low scheduling needs |
| **Flow** ($297) | Personal assistant needs, calendar-focused, no portal needed, solo/small team |
| **Halo** ($397) | Salon/wellness, appointment-heavy, needs customer portal, 3+ employees |
| **Core** ($500) | Text-only OK, manual operations preferred, content/web focus |
| **Single-Point** ($1,500) | Lead-focused, review collection priority, 5+ employees |
| **Multi-Track** ($3,997) | Field techs, dispatch needs, GPS routing, quotes in field |
| **Command** ($5,997) | 15+ techs, multi-location, enterprise features |

---

### Phase 4: Update AuditResults Component

**File: `src/components/audit/AuditResults.tsx`**

1. Add FLOW to `TIER_ICONS` - use `CalendarDays` icon
2. Add FLOW to `TIER_COLORS` - teal/cyan gradient (between Express amber and Halo rose)
3. Add FLOW to `TIER_BG_COLORS` - teal background
4. Add FLOW to `TIER_ORDER` array (after EXPRESS, before CORE)
5. Add FLOW to `TIER_ROI_ESTIMATES`:
   - Hours saved: 10/week
   - Leads recovered: 5
   - Revenue impact: $3,000-6,000

---

### Phase 5: Update AgentOpportunityAudit Component

**File: `src/components/audit/AgentOpportunityAudit.tsx`**

1. Update tier percentage calculations to include FLOW
2. Update recommended tier logic to consider FLOW in the ranking

---

## New Question Set (Total: 30 questions)

### Section 1: Business Basics (4 questions - was 3)
- Employee count (existing)
- Multi-location (existing)
- Annual revenue (existing)
- **NEW: Industry/business type** (Restaurant, Salon/Spa, Personal Services, Field Services, Other)

### Section 2: Lead Intake & Response (3 questions - unchanged)
- Lead response time
- After hours calls
- Lead volume

### Section 3: Communication Preferences (4 questions - was 3)
- AI interaction mode (existing)
- Communication channels (existing)
- Missed calls (existing)
- **NEW: Reservation/booking call handling**

### Section 4: Scheduling & Operations (5 questions - was 3)
- Booking process (existing, updated options)
- Dispatch routing (existing)
- Customer ETA (existing)
- **NEW: Calendar sync vs portal preference**
- **NEW: Daily appointment volume**

### Section 5: Customer Retention & Reviews (3 questions - was 2)
- Review collection (existing)
- Customer reactivation (existing)
- **NEW: Appointment reminder system**

### Section 6: Social Media & Web Presence (3 questions - unchanged)
- Social media activity
- Content creation
- Website status

### Section 7: Business Operations (4 questions - was 3)
- Quoting process (existing)
- Inventory tracking (existing)
- Warranty claims (existing)
- **NEW: Walk-in vs appointment model**

### Section 8: Analytics & Growth (2 questions - unchanged)
- Performance tracking
- Marketing automation

### Section 9: Service Delivery Model (NEW - 2 questions)
- **NEW: Primary service location** (Customer location, Your location, Both)
- **NEW: Team structure** (Solo, Small team fixed location, Field technicians)

---

## Updated Section Order

```typescript
export const SECTION_ORDER = [
  'Business Basics',           // 4 questions
  'Industry & Services',       // 2 questions (new)
  'Lead Intake & Response',    // 3 questions
  'Communication Preferences', // 4 questions
  'Scheduling & Operations',   // 5 questions
  'Customer Retention',        // 3 questions
  'Social & Web Presence',     // 3 questions
  'Business Operations',       // 4 questions
  'Analytics & Growth',        // 2 questions
];
// Total: 30 questions
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/audit/types.ts` | Add FLOW tier, new questions, updated scoring matrices |
| `src/components/audit/AuditResults.tsx` | Add FLOW tier display, icons, colors, ROI |
| `src/components/audit/AgentOpportunityAudit.tsx` | Update tier calculations for FLOW |

---

## Technical Details

### New Type Definitions

```typescript
export type TierType = 'EXPRESS' | 'FLOW' | 'CORE' | 'HALO' | 'SINGLE_POINT' | 'MULTI_TRACK' | 'COMMAND';

export interface TierScores {
  EXPRESS: number;      // Restaurants
  FLOW: number;         // Personal Assistant (NEW)
  CORE: number;         // Digital foundation
  HALO: number;         // Salons/wellness
  SINGLE_POINT: number; // Lead focused
  MULTI_TRACK: number;  // Field ops
  COMMAND: number;      // Enterprise
}
```

### FLOW Tier Recommendation

```typescript
FLOW: {
  tier: 'FLOW',
  label: 'Aura Flow',
  price: '$297/mo',
  description: 'AI Personal Assistant with scheduling via direct calendar sync',
  keyFeatures: [
    'AI Receptionist (24/7 engagement)',
    'Scheduling Agent (calendar sync)',
    'Follow-up Agent (SMS + Email)',
    'Message Aura (Text) + Talk to Aura (Voice)',
    'Smart Link Sharing',
    'No customer portal - direct calendar only',
  ],
  agentCount: 4,
  consoleCount: 0,
  employeeLimit: '2 employees',
  implementationFee: '$399',
}
```

---

## Testing Considerations

After implementation:
1. Complete the audit selecting restaurant-focused answers - should recommend EXPRESS
2. Complete with salon/wellness answers - should recommend HALO
3. Complete with personal assistant/scheduling focus - should recommend FLOW
4. Verify all 7 tiers display correctly in results
5. Confirm fit percentages calculate correctly for all tiers
