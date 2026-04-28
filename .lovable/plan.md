
# Platform-Wide Naming & Content Consistency Pass

The codebase has 4 sources of truth — `subscriptionAgentConfig.ts` (tier→agents), `agentStyles.ts` (plain-English labels), console page titles, and PDF/guide copy. These have drifted apart. This plan locks them all to one canonical set.

## Canonical Names (Source of Truth)

### Tiers
| Internal ID | Display | Price | Implementation |
|---|---|---|---|
| starter | Aura Core | $197/mo | $0 |
| connect | Aura Boost | $497/mo | $299 |
| performance | Aura Pro | $997/mo | $599 |
| command | Aura Elite | $1,997/mo | $999 |

90-day free trial, no credit card. (Already correct in most places — sweep for stragglers.)

### 7 Consoles (canonical titles)
1. **Customer Portal Console** (customer_portal)
2. **Field Operations Console** (field_operations)
3. **Business Management Console** (business_management)
4. **Outreach & Sales Console** (marketing_sales)
5. **Social Media Console** (social_media)
6. **Creative & Web Presence Console** (creative_web_presence)
7. **Analytics & Reports Console** (analytics_reports)

Plus **AI Operatives Hub** (Elite). Eliminate variants: "Ops Console", "Mgt Ops", "Technician-Field Ops", "Business Ops Hub", etc.

### 24 AI Agents (canonical names)
Customer Portal: **AI Receptionist, Booking Agent, Follow-Up Agent, Review Agent**
Field Operations: **Dispatch Agent, Route Agent, ETA Agent, Check-In Agent**
Business Management: **Admin Agent, Quoting Agent, Invoice Agent, Inventory Agent**
Outreach & Sales: **Lead Agent, Marketing Agent, Campaign Agent, Outreach Agent**
Creative & Web: **Creative Content Agent, Web Presence Agent**
Social Media: **Social Scheduler Agent, Social Analytics Agent**
Analytics & Reports: **Insights Agent, Performance Agent, Revenue Agent, Forecast Agent**

Eliminate variants: "Scheduling Agent" → Booking Agent; "Social Feed Queue" → Social Scheduler Agent; "Customer Insights Agent" → Insights Agent (in PDFs); "Triage" used only as the internal ID (display = "AI Receptionist" or plain "Front Desk" in customer-facing chat per existing memory).

### Plain-English Customer Labels (already in `agentStyles.ts` — keep)
Front Desk · On The Way · Office/Billing · Marketing · Social Posts · Reports · Website. These are intentional customer-facing rollups; do **not** change.

## Files to Edit

### Console page titles (4 fixes)
- `src/pages/ai-consoles/AnalyticsConsole.tsx` — "Analytics & Reports Ops" → "Analytics & Reports Console"
- `src/pages/ai-consoles/SocialMediaConsole.tsx` — "Social Media Ops" → "Social Media Console"
- `src/pages/ai-consoles/MarketingSalesConsole.tsx` — "Outreach & Sales Ops" → "Outreach & Sales Console"
- `src/pages/ai-consoles/FieldOpsConsole.tsx` — "Technician-Field Ops" → "Field Operations Console"
- `src/pages/ai-consoles/BusinessManagementConsole.tsx` — "Business Mgt Ops Console" → "Business Management Console"

### Help / guides
- `src/pages/PlatformGuides.tsx` — normalize the route-alias map (lines 55–67) and body copy: replace "Social Feed Queue" with "Social Scheduler Agent", "Scheduling Agent" with "Booking Agent", and rename console references to the canonical 7 titles.
- `src/pages/Help.tsx` — fix the "Aura Pro Command tier" typo (line 762) → "Aura Elite tier"; standardize console titles in any inline copy.
- `src/lib/howToUseContent.ts` — rename modal titles: "Field Ops + Dispatch Operative" → "Field Operations Console"; "Social Media Ops" → "Social Media Console"; "Outreach & Sales Ops" → "Outreach & Sales Console"; "Business Management Ops" → "Business Management Console".
- `src/lib/voiceNavigation.ts` — comment cleanup only (already mostly correct).

### PDFs
- `src/components/documentation/WebsiteCopyPDF.tsx` — fix duplicated/nested `<Text>` blocks at lines 581 and 586 (FAQ answers wrapped twice — visible bug); standardize agent names in lines 378–476.
- `src/components/documentation/PlatformDocumentPDF.tsx`, `ComprehensiveGuidesPDF.tsx`, `AIAgentGuidesPDF.tsx`, `CompanyGuidesPDF.tsx`, `CompanyOnboardingPDF.tsx` — sweep for "Scheduling Agent" / "Social Feed Queue" / "Aura Express" / old console names; replace with canonical.
- `src/components/documentation/PlatformFAQPDF.tsx` — fix the trial reminder cadence copy (line 473 says "7/3/1 days"; standardize to "30/7/1 days" to match `trial-reminders` edge function).
- `src/components/documentation/SalesPitchDataPDF.tsx`, `PricingSummaryPDF.tsx`, `VideoScriptsPDF.tsx`, `SocialMediaContentPackPDF.tsx` — verify tier display names + prices (already mostly correct, light sweep).

### Other UI surfaces
- `src/pages/ForBusiness.tsx` — verify agent counts (8/14/20/24) match `subscriptionAgentConfig.ts` actual counts (8/12/16/24). **Fix tagline numbers to 8/12/16/24.**
- `src/components/audit/AuditChecklistPDF.tsx`, `AuditResults.tsx` — verify agent/console counts match canonical.
- `src/lib/agentStyles.ts` — no changes (already canonical).
- `src/lib/subscriptionAgentConfig.ts` — no changes (already canonical source of truth).

### Database / migrations
- `supabase/migrations/20260115203319_*.sql` — comment-only fix: stale "single_point/multi_track" comment on `subscription_tier`. Add a new migration that updates the COMMENT to reflect the 4-tier model. (No data changes.)

### Subtle fixes
- `src/pages/Auth.tsx` line 888 — "ElevenLabs … Free–$99/mo" cost note conflicts with the "bundled in tier, no extra fees" memory rule. Remove the per-month cost text; replace with "Included in tier".
- `src/pages/Index.tsx` line 1117 — same issue: "$5/mo (30k) • $22/mo (100k) • $99/mo (500k)" usage pricing. Replace with "Included in your tier".

## Out of Scope (intentionally untouched)
- The plain-English rollup labels in `agentStyles.ts` (Front Desk / On The Way / etc.) — these are a deliberate customer-facing UX choice per memory.
- Internal agent IDs (`triage`, `booking`, `social_scheduler`, etc.) — they remain stable for routing.
- Pricing values (already canonical: $197/$497/$997/$1,997).

## Memory Update
Append a "Canonical naming registry" memory pointing future sessions at `subscriptionAgentConfig.ts` + `agentStyles.ts` + this plan's console title list, so future drift is prevented.

## Verification
After edits, run two greps to confirm zero residuals:
- `rg "Aura Express|Scheduling Agent|Social Feed Queue|Mgt Ops|Technician-Field Ops|Aura Pro Command"`
- `rg "(Analytics|Social Media|Outreach & Sales|Business Management) Ops"` (should only match planning/comments)

Estimated edits: ~15 files. No DB schema changes, no edge function logic changes (one comment-only migration).
