---
name: Specialist Operatives Available on All Plans
description: Industry Specialist Operatives are available and active on every tier (including free trial); activation is driven by the industry pack, not subscription tier
type: feature
---
Industry Specialist Operatives (Diagnostic, Permit & Code, Site Survey, Insurance Claim, Listing Writer, Offer Drafter, Comp Analyst, Style Consultant, Loyalty Coach, Menu Writer, Reservation Optimizer, Task Triager, Calendar Optimizer, Review Responder) are **industry-specific** and ship with **every** plan including the free trial.

**Implementation:**
- `SPECIALIST_MIN_TIER = 'free'` in `src/lib/subscriptionAgentConfig.ts`
- `tierAllowsSpecialists()` always returns `true`
- Activation is determined by the industry pack (`useIndustryPack`), NOT by subscription tier
- Both `SpecialistOperativesConsole` and `SpecialistOperativesLauncher` honor this via `tierAllowsSpecialists`

**Why:** Specialists are vertical-specific value (e.g., a dental tenant needs Recall/Insurance specialists regardless of paying $197 or $1,997). Gating them by tier broke the industry-pack promise.
