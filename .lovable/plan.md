# Update Free Audit Question Set

Apply the user's "Corrected Question Set" to the audit engine. Assumption confirmed by the user's note: Billing (Quoting/Invoicing/Inventory) = **Pro** tier, automated social posting = **Boost+** tier.

## Files to change

### 1. `src/components/audit/types.ts` — Universal questions

- Fix driver text on `social_media_activity`: "Marketing (Pro+)" → "**Social Media (Boost+) auto-creates and posts content**".
- Fix driver text on `marketing_automation`: "Marketing (Pro+)" → "**Outreach & Sales (Pro+) includes Campaign + Outreach automation**".
- In the **Setup & Integrations** section (before `launch_timeline`), add three new universal questions in this order:
  1. `phone_setup` — "What's your business phone setup today?" (moved up from Field & Trades / Other) with the 4 existing options.
  2. `business_entity_ein` — "Do you have a registered business entity and EIN?" (NEW) with options: Yes, fully set up (LLC/Inc + EIN) / Sole proprietor with EIN / Not yet registered / Not sure. Description: "10DLC SMS registration requires an EIN and legal business name — we'll flag this early so it doesn't stall your launch."
  3. `current_software` — "Are you currently using any business/field-service software?" (NEW) with options: No — spreadsheets or paper / Yes — a CRM or field-service tool (ServiceTitan, Jobber, Housecall Pro, etc.) / Yes — industry-specific software not listed above / A mix of a few different tools. Description: "Helps us scope migration effort vs. a fresh start."
- Tier score arrays for the three added questions will use neutral, slightly-weighted values consistent with the pattern used elsewhere in the file.

### 2. `src/lib/auditIndustryQuestions.ts` — Industry buckets

**FIELD_TRADES**
- Fix `quoting_process` description: "Billing (Elite)" → "**Billing (Pro) includes AI Quoting + Invoicing**".
- Fix `inventory_tracking` description: "Billing (Elite)" → "**Billing (Pro) includes Inventory Management**".
- Remove `phone_setup` question (now universal).

**RESTAURANTS**
- Merge `rest_takeout_delivery_mix` + `rest_online_ordering` into a single question `rest_takeout_ordering`: "How do customers order takeout or delivery today?" with 4 options (Dine-in only / Own online ordering / Only 3rd-party apps / Phone only). Description kept: "Smart Link routes online orders to your existing apps".
- Remove `rest_waitlist_management`.

**BEAUTY_WELLNESS**
- Remove `bw_intake_forms`.
- Fix `bw_retail_inventory` description: "Billing (Elite)" → "**Billing (Pro) adds inventory + retail**".

**HEALTHCARE**
- Replace current 5-question bucket with the spec's 2-question set:
  - `hc_service_location` — "Where do you mostly deliver your services?" (4 options).
  - `hc_pricing_model` — "How do you quote / price work today?" (3 options).
- Phone question stays in Universal only.

**OTHER_FALLBACK**
- Keep `other_service_location` and `other_quoting`; remove `other_phone_setup` (now universal).

### 3. No changes needed to:
- `AgentOpportunityAudit.tsx` (composes questions dynamically from these two files).
- `AuditResults.tsx` / scoring (already averages across all answered questions).
- PDF export — will pick up new questions automatically if it reads from the same source; otherwise a follow-up regeneration only.

## Verification

- Run `tsgo` on the two edited files to ensure no type breakage.
- Manually confirm question counts:
  - Universal: 12 → 15.
  - Field & Trades bucket: 6 → 5 industry questions (phone moved out).
  - Restaurants: 5 → 3.
  - Beauty & Wellness: 5 → 4.
  - Healthcare: 5 → 2.
  - Other: 3 → 2.
