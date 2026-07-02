## Scope

Three surfaces render the onboarding workbook. All will be updated together so the online form, the emailed workbook PDF, and the downloadable Company Onboarding PDF stay in sync:

1. `src/components/documentation/CompanyOnboardingPDF.tsx` — the full printable workbook (industry list, worksheets, KB, employees, ToS, carrier guide, sign-off).
2. `supabase/functions/_shared/onboarding-workbook-sections.ts` — the shorter workbook attached to the welcome email (Section 6 vendor list, section headings).
3. `src/components/onboarding/CompanyOnboardingForm.tsx` — the online form; contains a `mailto:` and industry pickers.
4. `src/components/audit/AgentOpportunityAudit.tsx` — audit tier-driver copy embedded in the workbook.

No schema, RLS, or backend logic changes.

---

## Fixes (mapped to the revision doc)

### 1. Industry list — remove 6 medical verticals
In `CompanyOnboardingPDF.tsx` (line ~392) replace the parenthetical industry list with the 17-industry list from the homepage (drops Home Health, Physical Therapy, Occupational Therapy, Hospice, Veterinary, Medical Practice; renames "Solar" → "Solar Energy"). Mirror the same list anywhere it appears in the online form's industry picker.

### 2. Google Workspace → free Google Account
In the PDF's "3rd-Party Account Worksheet" (line ~1048) remove the `Google Workspace` row and the `Google Workspace` chip in the account-owner-email grid (line ~1079). Add a Communication Routing clarifier above the Email Aliases block: *"These addresses send and receive through your Resend account on your own domain — no separate email hosting account needed."* Leave ToS §4, Key Reminders, Signature Acknowledgement, and Sign-Off unchanged.

Also drop the `Google Workspace account email` line from `_shared/onboarding-workbook-sections.ts` Section 6 (it currently doesn't list Workspace — verify and add only the "Google account for Calendar (free, OAuth)" as an unchecked one-liner).

### 3. Delete the ElevenLabs API Key field
Remove line ~687 in `CompanyOnboardingPDF.tsx` (`ElevenLabs API Key:` label + input). Keep the other non-secret account fields.

### 4. Merge the two vendor worksheets
Delete the standalone `3rd-Party Account Worksheet` block in the PDF and keep a single worksheet in Section 4 (Integration Requirements) with columns **Have It | Need Help Setting Up | Card on File | N/A** and rows: SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Google Account (free), Social Media Accounts. Append the "Account Owner / Admin Email per Provider" table underneath the merged worksheet.

### 5. Consolidate employee sections
Keep `Employee & Technician Roster` (richer). Delete `Section 6: Employee Accounts` (line ~793). Add a one-line clarifier to the Roster header: *"Everyone who needs a login — field or office."*

### 6. Consolidate document checklists
Keep the Master Document & Asset Checklist. Replace the sign-off page's 11-item "Attachments included" list with a single line: *"Confirm every item on the Master Document & Asset Checklist is attached before signing below."*

### 7. Renumber sections & pages
After the above deletions/merges, renumber sections sequentially (1..N, no gaps, no reused numbers, no "Section 3" skip). Fold the embedded audit's `Section A / C / D…` into the workbook's numbering scheme. Re-order so Knowledge Base Setup follows Integration Requirements. React-PDF handles page numbers automatically; verify no hard-coded "Page X" strings remain.

### 8. Audit tier-label + reframing
In `AgentOpportunityAudit.tsx` (and any mirrored copy inside `CompanyOnboardingPDF.tsx`):
- "Marketing (Pro+) auto-creates and posts content" → **"Social Media (Boost+) auto-creates and posts content"**
- "Marketing (Pro+) includes Campaign + Outreach automation" → **"Outreach & Sales (Pro+) includes Campaign + Outreach automation"**

Reframing: keep the questions but change the intro/driver copy from "which tier fits" to "how to configure your agents" (customer, not prospect). One-paragraph header rewrite only.

### 9. Extract carrier guide to appendix + add scenario field
Before the carrier instructions add a required checkbox group: **Immediate / After-hours only / Busy / Unreachable / Combination**. Move the 12 carrier-specific step-by-step pages to an "Appendix A — Carrier Forwarding Codes" at the end of the PDF, keeping the "My carrier" capture field inline and referencing the appendix by carrier name.

### 10. Standardize social platform list
Use one canonical list everywhere in the workbook & audit: **Facebook, Instagram, LinkedIn, TikTok** (matches homepage "up to 6 platforms, expanding" copy). Remove X / YouTube / GBP / Reddit from the Social Accounts capture page in the PDF.

### 11. Porting vs. forwarding
Add a top-level phone-setup toggle to the PDF: **[ ] Forward existing number to my new Aura number  [ ] Port my existing number into Aura**. If Port is selected, present a short porting sub-section (current carrier, account #, PIN, billing-name/address, LOA signature line). Forwarding branch continues to the (now-appendix) carrier codes.

### 12. Standardize outbound email to `ai@auraintercept.ai`
- `CompanyOnboardingPDF.tsx` line ~898 and ~1558: `onboarding@auraintercept.ai` → `ai@auraintercept.ai`.
- `CompanyOnboardingForm.tsx` line ~251: `onboarding@auraintercept.com` → `ai@auraintercept.ai` (also fixes wrong TLD).
- Grep the repo for any remaining `onboarding@auraintercept` and replace.

---

## Verification

- `tsgo` typecheck.
- Manually render the PDF via the existing Export Documentation route and skim for: 17-industry list, no ElevenLabs key field, single merged vendor worksheet, single employee roster, sequential section numbers, appendix at the end, updated audit tier labels, `ai@auraintercept.ai` everywhere.
- Confirm the emailed workbook (shared sections file) reflects the merged vendor list and no ElevenLabs key line.

## Out of scope

- Standalone Free Audit PDF healthcare-cluster removal (called out in #1 as a companion fix in a separate doc) — handle in a follow-up unless you want it in this pass.
- Picking the final social-posting vendor (#10 assumes FB/IG/LI/TikTok per current homepage).
