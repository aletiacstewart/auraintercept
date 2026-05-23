## Goal
Expand `MarketingSalesMasterPDF` from a high-level overview (~12 pages) into a deep, sales-rep-ready reference (~30–40 pages) with substantive per-agent, per-feature, per-dashboard, and per-hub detail.

## Current state
Single PDF with: Cover → Exec Summary → 4-Tier table → Pricing/Tiers → 10 Operatives (2 batches, brief) → Industry Specialists (overview) → Feature Catalog (grouped lists) → Dashboards (table) → Consoles & Hubs (list) → 3rd-Party Stack → Trial + Talking Points → Next Steps. Pulls data from `subscriptionAgentConfig`, `agentStyles`, `industryCapabilities`.

## Expansion plan (sections to deepen)

### 1. AI Operatives — full profile per operative (10 pages, 1/page)
For each of the 10 operatives:
- Name + customer-facing label + underlying agent IDs (from 24-agent map)
- One-line pitch + 3-sentence "what it actually does"
- Channels (voice, SMS, email, web chat, social)
- Triggers / handoffs (who routes to it, where it routes next)
- Sample transcript snippet (1 short Q&A)
- KPIs the operative moves
- Tier availability badges (Core / Boost / Pro / Elite)
- Required 3rd-party services (e.g. SignalWire for voice) with billing note

### 2. Industry Specialists — expanded
- Full table of specialist operatives (listing_writer, comp_analyst, menu_writer, style_consultant, loyalty_coach, review_responder, site_survey, diagnostic, calendar_optimizer, task_triager, insurance_claim) with: name, what it does, which industries auto-activate it, sample output

### 3. Feature Catalog — per-feature detail (replaces grouped lists)
Group by capability area; each feature gets:
- Name + one-line value prop
- Where it lives in the app (route)
- Tier required
- Who uses it (admin / employee / customer / technician)
- 3rd-party dependency, if any

Areas: Voice & Telephony · SMS & Messaging · Email · Web Chat & Smart Website · Social Media · Scheduling & Booking · Field Ops & Dispatch · Quotes/Invoices/Payments · Lead Capture & Scoring · Customer Portal · Analytics · AI Operatives & Hub · Knowledge Base · Tutorials/Help · Notifications · Integrations

### 4. Dashboards — per-dashboard page
Detail page each for: Aura Command Center · Company Admin Dashboard (Simple/Pro modes) · Employee Dashboard · Technician Dashboard · Customer Portal Home · Platform Health (admin) · Subscription Analytics · Analytics Dashboard Suite (8 tabs)
Each page: who sees it, top widgets/KPIs, primary actions, default route.

### 5. Consoles & Hubs — per-console page
Detail page each for: Outreach & Sales · Business Management · Field Ops · Social Media · Content Engine · Customer Portal Console · Analytics Console · AI Operatives Hub (Elite). Each: purpose, tabs/sub-views, operatives surfaced, tier required, KPIs.

### 6. Industry Packs Appendix
One-row-per-industry table covering all 18 packs: industry_id, cluster, terminology (job/customer), specialists auto-activated, marketing playbook tagline.

### 7. Sales rep toolkit (new)
- Discovery question script (6–8 questions)
- 60-second elevator pitch
- 3-minute demo flow
- Tier-fit decision tree (employees + industry → recommended tier)
- Expanded objection handling (12+ Q&A, vs current ~5)
- Email & SMS outreach templates (3 each)

### 8. Compliance & legal one-pager
- 3rd-party billing disclosure (verbatim approved copy)
- A2P 10DLC requirement
- Trial terms (90-Day Live Trial, onboarding due at start, non-refundable onboarding)

## Data sources (no business-logic changes)
- `src/lib/subscriptionAgentConfig.ts` — tiers, operatives, consoles, specialists
- `src/lib/agentStyles.ts` — labels
- `src/lib/industryCapabilities.ts`, `industryPackSchema.ts`, `industryMarketingPlaybooks.ts` — industry packs
- `src/pages/ai-consoles/*` — console names/routes
- `src/lib/howToUseContent.ts` — feature blurbs
- Memory: pricing, trial, 3rd-party policy, sidebar v1, plain-English labels

## Files to change
- `src/components/documentation/MarketingSalesMasterPDF.tsx` — major expansion; keep existing styles, add new sections + page-per-item layouts. May split into helper sub-components in the same file.
- No changes to consoles, routes, business logic, or other PDFs.

## QA
- Render the PDF, convert pages to images with `pdftoppm`, scan every page for overflow / clipped text / table column issues, iterate until clean.
- Deliver final PDF as `/mnt/documents/marketing-sales-master-guide.pdf` via `<presentation-artifact>` so you can download immediately, and keep the in-app PDFDownloadLink so it stays available from the Outreach & Sales Console.

## Out of scope
- Pricing changes, new features, new tiers, backend/edge-function edits, Spanish locale, other PDFs.
