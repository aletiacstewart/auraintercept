
# Full Platform Consistency Update + AI Agent System Review

This plan implements all 18 audit findings, the $25/10 employees pricing standardization, and includes AI agent system recommendations based on a deep code review.

---

## Part 1: Platform Consistency Fixes (14 Files)

### File 1 — `src/pages/Index.tsx`

| Line | Issue | Fix |
|---|---|---|
| 1056 | `No Voice` badge on Aura Presence | Remove badge entirely — all tiers include voice |
| 1127 | `$10/employee` | `$25 per 10 employees` |
| 1128 | `starting at $499` | `starting at $299` |

---

### File 2 — `src/pages/Contact.tsx`

Update tier name select options (lines 174–179):

| Current | Updated |
|---|---|
| Aura Express (Restaurants) | Aura Starter (Restaurants) |
| Aura Halo (Salons & Wellness) | Aura Growth (Salons & Wellness) |
| Aura Core (AI Tools) | Aura Presence (Web Presence) |
| Single-Point (Small Service) | Aura Logistics (Field Service) |
| Multi-Track (Field Operations) | Aura Performance (Full Automation) |
| Aura Pro Command (Enterprise) | Aura Command (Enterprise) |

---

### File 3 — `src/pages/TalkToAura.tsx`

Update `tierLabels` map (lines 44–51):

| Current | Updated |
|---|---|
| express: 'Aura Express' | express: 'Aura Starter' |
| halo: 'Aura Halo' | halo: 'Aura Growth' |
| core: 'Aura Core' | core: 'Aura Presence' |
| single_point: 'Aura Single-Point' | single_point: 'Aura Logistics' |
| multi_track: 'Aura Multi-Track' | multi_track: 'Aura Performance' |
| command: 'Aura Pro Command' | command: 'Aura Command' |
| (missing) | aura_flow: 'Aura Connect' |

---

### File 4 — `src/pages/IntegrationDocs.tsx`

Line 30: Replace `ALL tiers including Aura Core` with `ALL tiers including Aura Presence`
Line 39: Replace `Speech-based conversations via microphone/speakers are available on Single-Point+ tiers` with `Speech-based conversations via microphone/speakers are available on all paid tiers`

---

### File 5 — `src/pages/Auth.tsx`

| Line | Issue | Fix |
|---|---|---|
| 974 | `selectedTier === 'flow'` | `selectedTier === 'aura_flow'` |
| 1315 | `one-time fee of $500` | `one-time fee starting at $299` |

---

### File 6 — `src/pages/Subscription.tsx`

| Line | Issue | Fix |
|---|---|---|
| 289 | `'$10/employee'` × 7 columns | `'$25/10 employees'` × 7 |
| 801 | `$10/employee` | `$25 per 10 employees` |
| 806 | `starting at $499` | `starting at $299` |

---

### File 7 — `src/pages/TermsOfService.tsx`

| Line | Issue | Fix |
|---|---|---|
| 55 | `The Enterprise subscription plan is billed at $250 per month.` | `Subscription plans range from $197 to $3,497 per month across 7 tiers (Aura Starter through Aura Command).` |
| 56 | `Subscriptions include 10 employee accounts. Additional employees are $10/month each.` | `Employee accounts vary by tier (2–50 included). Additional employees: $25/month per 10 employees.` |

---

### File 8 — `src/components/landing/PricingComparisonTable.tsx`

Line 168: Change all 7 columns from `'$10/employee'` to `'$25/10 employees'`

---

### File 9 — `src/components/company/EmployeeManagement.tsx`

Line 377: Change `$10/employee` to `$25 per 10 employees`

---

### File 10 — `src/lib/documentationConfig.ts`

| Line | Issue | Fix |
|---|---|---|
| 802 | `core.calendar: { required: false }` | `{ required: true, reason: 'Required for Scheduling Agent (inherits Connect+ agents)' }` |
| 794 | `halo.social_media: { required: true }` | `{ required: false, reason: 'Optional for Growth tier' }` |
| 814 | `single_point.social_media: { required: true }` | `{ required: false, reason: 'Optional for Logistics tier' }` |

---

### File 11 — `src/components/documentation/SalesPitchDataPDF.tsx`

| Line | Current | Fix |
|---|---|---|
| 711 | `Aura Halo tier is $397/month for salons or Single-Point at $1,500/month` | `Aura Growth tier is $597/month for salons or Aura Logistics at $1,497/month` |
| 807 | Tier name: `Aura Halo (Salons/Wellness)`, Price: `$397/mo` | `Aura Growth (Salons/Wellness)`, `$597/mo` |
| 811 | `- 1-3 person operations` | `- Up to 5 employee operations` |
| 815 | `- 3 AI Operatives: Receptionist, Scheduling, Follow-up` | `- 11 AI Operatives: Receptionist, Scheduling, Follow-up + Marketing Stack` |
| 820 | Tier name: `Single-Point` | `Aura Logistics` |
| 833 | Tier name: `Multi-Track` | `Aura Performance` |
| 837 | `- 5-10 employees` | `- Up to 25 employees` |
| 841 | `- 10 AI Operatives + 2 Consoles` | `- 22 AI Operatives + All 7 Consoles` |
| 846 | Tier name: `Aura Pro Command (Enterprise)` | `Aura Command (Enterprise)` |
| 765 | `Multi-Track tier` case study reference | `Aura Performance tier` |

---

### File 12 — `src/components/documentation/WebsiteCopyPDF.tsx`

| Line | Current | Fix |
|---|---|---|
| 532 | Label: `Aura Core - $500/mo` | `Aura Presence - $797/mo` |
| 536 | `Up to 3 AI Operatives` | `12 AI Operatives` |
| 538 | `3 Control Centers` | `4 Control Centers` |
| 540 | `Up to 4 employees` | `Up to 8 employees` |
| 552 | Label: `Single-Point - $1,497/mo` | `Aura Logistics - $1,497/mo` |
| 556 | `Up to 6 AI Operatives` | `18 AI Operatives` |
| 557 | `6 Control Centers` | `6 Control Centers` (correct) |
| 561 | `Up to 8 employees` | `Up to 15 employees` |
| 566 | Label: `Multi-Track - $2,497/mo` | `Aura Performance - $2,497/mo` |
| 570 | `Up to 12 AI Operatives` | `22 AI Operatives` |
| 575 | `Up to 16 employees` | `Up to 25 employees` |
| 580 | Label: `Aura Pro Command - $3,497/mo` | `Aura Command - $3,497/mo` |
| 589 | `Up to 32 employees` | `Up to 50 employees` |
| 625 | `$499-$999 depending on complexity` | `$299–$499 depending on tier (Custom for Command)` |

---

### File 13 — `src/components/documentation/PlatformFAQPDF.tsx`

| Line | Current | Fix |
|---|---|---|
| 355 | `Express and Flow tiers can be live within 3-5 business days. Multi-Track and Command tiers...` | `Starter and Connect tiers can be live within 3-5 business days. Performance and Command tiers...` |
| 489 | `Talk to Aura (Voice) is included in Aura Express, Aura Flow, Aura Halo, Single-Point, Multi-Track, and Aura Pro Command. Aura Core includes only Message Aura (Text)...` | `Talk to Aura (Voice) is included on ALL paid tiers. Every tier from Aura Starter through Aura Command includes full voice, SMS, and email capabilities.` |
| 494 | `Twilio ($1.15/number + usage)` | `SignalWire ($1.15/number + usage)` (Twilio is no longer used) |
| 498 | Question: `What's included in the Aura Halo tier specifically?` | `What's included in the Aura Growth tier specifically?` |
| 499 | Answer uses `SUBSCRIPTION_TIERS.halo` (already uses config correctly) | No change needed — already pulls from config |
| 529 | `Voice is available on Aura Express, Flow, Halo, Single-Point, Multi-Track, and Command tiers.` | `Voice is available on ALL paid tiers (Starter through Command).` |
| 630 | `Express/Flow/Core include 2 consoles, Halo/Single-Point include 3 consoles, Multi-Track includes 4 consoles` | `Starter (0), Connect (1), Growth (3), Presence (4), Logistics (6), Performance (7), Command (7+Hub)` |

---

### File 14 — `supabase/functions/landing-chat/index.ts`

Complete rewrite of the AURA_SYSTEM_PROMPT pricing section (lines 16–33) to match current platform standards:

```
- Aura Starter ($197/mo): AI Voice & Chat for restaurants, smart links, 2 employees, 1 AI Operative (AI Receptionist). Requires ElevenLabs + SignalWire.
- Aura Connect ($397/mo): AI voice, chat, and scheduling with calendar sync. 3 AI Operatives (Receptionist, Scheduling, Follow-up). 1 Console (Customer Portal). 3 employees.
- Aura Growth ($597/mo): 11 AI Operatives, 3 Consoles. AI scheduling + marketing + social media suite. 5 employees. For salons and wellness businesses.
- Aura Presence ($797/mo): 12 AI Operatives, 4 Consoles. Full marketing + web presence + social media. 8 employees.
- Aura Logistics ($1,497/mo): 18 AI Operatives, 6 Consoles. Field operations, dispatch, quoting, invoicing. 15 employees.
- Aura Performance ($2,497/mo): 22 AI Operatives, all 7 Consoles. Advanced analytics and full automation. 25 employees.
- Aura Command ($3,497/mo): All 24 AI Operatives, all 7 Consoles + AI Operatives Hub. Enterprise, 50 employees.
- Annual billing saves ~16%
- Additional employees: $25/mo per 10 employees beyond included amount
- All tiers include Voice (Talk to Aura), SMS (Message Aura), and Email
- Required integrations: SignalWire (not Twilio), ElevenLabs, Resend, A2P 10DLC
```

---

## Part 2: AI Agent System Review

### Current Architecture Assessment

The AI agent system is well-architected with:
- **`ai-agent-chat`** (7069 lines): Full multi-agent system with 20+ agent prompts, tool definitions, and tool execution handlers
- **`ai-agent`** (1280 lines): Simplified single-agent interface for the Customer Portal Console
- **`ai-orchestrator`** (675 lines): Event routing and multi-agent coordination

The system is **largely functional**. Here are the key issues found and recommended improvements:

---

### AI Agent Issue 1 — `landing-chat` Has Severely Outdated Knowledge

**Severity: HIGH**
The landing page chatbot (first impression for prospects) still references Twilio, old tier names, wrong prices ($500/mo, $3,997/mo, $5,997/mo), and wrong employee counts. This directly contradicts what visitors see on the homepage. Fixed in File 14 above.

---

### AI Agent Issue 2 — `ai-agent/index.ts` Uses `google/gemini-2.5-flash`; `ai-agent-chat/index.ts` Is Not Verified

Both core agent functions use Lovable AI Gateway correctly. The `ai-agent-chat` function is the primary workhorse for all agent types and is properly structured. No model changes needed.

---

### AI Agent Issue 3 — `IntegrationDocs.tsx` Incorrectly States Voice Requires `Single-Point+`

Line 39 says voice is `available on Single-Point+ tiers`. This is outdated — all paid tiers now include voice. Fixed in File 4 above.

---

### AI Agent Improvement 1 — Add Missing `aura_flow` to `TalkToAura.tsx` tierLabels

The `tierLabels` map in `TalkToAura.tsx` is missing `aura_flow: 'Aura Connect'`. If a Connect tier user lands on this page, they see `Aura Pro Command` as the fallback label. Fixed in File 3 above.

---

### AI Agent Improvement 2 — `PlatformFAQPDF.tsx` Still References `Twilio` Instead of `SignalWire`

Line 494 says `Twilio ($1.15/number + usage)`. The platform migrated to SignalWire. This misleads potential customers reading the FAQ PDF and affects pricing accuracy. Fixed in File 13 above.

---

### AI Agent Improvement 3 — Knowledge Base PDF Extraction (Existing Known Issue)

Per the architecture memory, PDF knowledge documents have `NULL` values for `content_text`, meaning the AI agent cannot read uploaded PDF knowledge documents. This is a separate, previously-identified issue that requires the `parse-faq-document` edge function to correctly extract text during upload. This is noted for awareness — not included in this plan as it requires a separate database/storage investigation.

---

## Summary Table

| # | File | Type | Changes |
|---|---|---|---|
| 1 | `src/pages/Index.tsx` | UI | Remove No Voice badge, fix pricing text |
| 2 | `src/pages/Contact.tsx` | UI | Rename all 6 tier options |
| 3 | `src/pages/TalkToAura.tsx` | UI | Rename all tier labels, add missing aura_flow |
| 4 | `src/pages/IntegrationDocs.tsx` | UI | Fix Core→Presence, fix voice tier statement |
| 5 | `src/pages/Auth.tsx` | UI | Fix 'flow'→'aura_flow' bug, fix $500→$299 |
| 6 | `src/pages/Subscription.tsx` | UI | Fix employee pricing × 2 locations + fee |
| 7 | `src/pages/TermsOfService.tsx` | Legal | Update billing terms to 7-tier structure |
| 8 | `src/components/landing/PricingComparisonTable.tsx` | UI | Fix employee pricing |
| 9 | `src/components/company/EmployeeManagement.tsx` | UI | Fix employee pricing message |
| 10 | `src/lib/documentationConfig.ts` | Config | Fix 3 integration requirement flags |
| 11 | `src/components/documentation/SalesPitchDataPDF.tsx` | PDF | Fix all tier names, prices, counts |
| 12 | `src/components/documentation/WebsiteCopyPDF.tsx` | PDF | Fix all tier labels, operative/employee counts |
| 13 | `src/components/documentation/PlatformFAQPDF.tsx` | PDF | Fix tier names, voice statement, Twilio→SignalWire |
| 14 | `supabase/functions/landing-chat/index.ts` | Edge Fn | Full pricing knowledge base rewrite |
