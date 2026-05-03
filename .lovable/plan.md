## Fix 1 — Surface Voice / SMS / Email / Chat on Core AND Boost

Both tiers already include these channels (Triage = AI Receptionist, Customer Journey covers SMS + email follow-up; voice via bundled SignalWire/ElevenLabs minutes; chat via web widget). Boost adds Dispatch + Field Navigation on top. The descriptions just don't say so.

Update **`src/lib/subscriptionAgentConfig.ts`**:

- **starter (Core, $197):** "Voice, SMS, email & web chat handled by 8 Smart AI Agents — booking, follow-up, creative content & web presence included"
- **connect (Boost, $497):** "Voice, SMS, email & web chat + 12 Smart AI Agents with dispatch, routing & field operations"

Mirror the channel callout for **both Core and Boost** in the public-facing surfaces:

- `src/components/documentation/PricingSummaryPDF.tsx`
- `src/components/documentation/SalesPitchDataPDF.tsx`
- `src/components/documentation/WebsiteCopyPDF.tsx`
- `src/components/documentation/PlatformFAQPDF.tsx`
- `src/components/documentation/ComprehensiveGuidesPDF.tsx`
- `src/lib/helpContentConfig.ts` and `src/lib/documentationConfig.ts`

Add a "Channels included" line to Core and Boost feature lists: **Voice calls, SMS, Email, Web chat** (bundled — no carrier passthrough, per existing memory rule). Pro and Elite already inherit these implicitly; add the same line for consistency.

No tier permissions or agent arrays change — Triage + Customer Journey already power those channels via existing edge functions (`ai-agent-chat`, `signalwire-*`, `send-*-email`).

## Fix 2 — Reseed the 6 healthcare demo accounts

The seeder `supabase/functions/seed-demo-accounts-v2/index.ts` already declares all 6 healthcare industries (lines 366–433), but `auth.users` returns 0 rows for them — the function hasn't been re-run since they were added.

Action: run the existing seeder, no code change needed.

1. Open **`/dashboard/demo-seeder`** as platform admin.
2. Click **"Seed All Demo Accounts"** — idempotent: upserts companies, resets passwords, inserts the 6 healthcare tenants:

| Industry | Tier | Admin | Employee | Patient |
|---|---|---|---|---|
| Dental | Boost | dentaladmin@demo.com | dentalemployee@demo.com | dentalcustomer@demo.com |
| Chiropractic | Core | chiropracticadmin@demo.com | chiropracticemployee@demo.com | chiropracticcustomer@demo.com |
| Medical Office | Pro | medicalofficeadmin@demo.com | medicalofficeemployee@demo.com | medicalofficecustomer@demo.com |
| Veterinary | Boost | veterinaryadmin@demo.com | veterinaryemployee@demo.com | veterinarycustomer@demo.com |
| Physical Therapy | Core | physicaltherapyadmin@demo.com | physicaltherapyemployee@demo.com | physicaltherapycustomer@demo.com |
| Optometry | Core | optometryadmin@demo.com | optometryemployee@demo.com | optometrycustomer@demo.com |

Password (universal): **`aidemo*!`**

After seeding, all 18 healthcare user rows appear in the Users panel.

## Memory updates

- Update **`mem://marketing/pricing/canonical-four-tier-model`**: Core AND Boost explicitly include Voice / SMS / Email / Web Chat (bundled).

## Out of scope

- No new edge functions, no DB migrations, no tier-permission changes.
- Healthcare scope guardrails (no EHR/Rx/records) stay as-is.
