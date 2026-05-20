## Marketing & Sales Master PDF

Create a single comprehensive sales-enablement PDF that a rep (or prospect) can download from the platform. It covers every AI operative, every platform feature, all dashboards, and all hubs/consoles — branded in Cyber-Sentry style and aligned with canonical pricing.

### New file
`src/components/documentation/MarketingSalesMasterPDF.tsx` — React + `@react-pdf/renderer` component (same pattern as `PlatformDocumentPDF.tsx` / `SalesPitchDataPDF.tsx`).

### PDF Structure (sections)

1. **Cover** — Aura Intercept badge, title "Marketing & Sales Master Guide", tagline, version/date.
2. **Executive Summary** — what Aura is, who it's for, the 4-tier model at a glance, 90-Day Live Trial note (first 30 days = onboarding).
3. **Pricing & Tiers** — Core / Boost / Pro / Elite cards: monthly price, onboarding fee, employee cap, included operatives & consoles. Pulled from `TIER_AGENT_CONFIG`.
4. **The 10 AI Operatives** — one section per operative (Triage/AI Receptionist, Customer Journey, Outreach, Creative Content, Web Presence, Dispatch, Field Navigation, Business Finance, Analytics Intelligence, Admin). Each entry: what it does, key capabilities, customer-facing label, tier availability, sample use cases. Sourced from `subscriptionAgentConfig.ts` + `agentStyles.ts`.
5. **Industry Specialists** — overview of the 18-industry pack system and how specialists auto-activate.
6. **Platform Features** — grouped catalog:
   - Communication: Voice (SignalWire/ElevenLabs), SMS (keywords, auto-responder), Email (Resend), Web Chat, Missed-call automation
   - Scheduling & Booking: unified booking, Google Calendar OAuth, public booking widget
   - Field Operations: dispatch, route/ETA, check-in, technician PWA
   - Business Finance: quotes, invoices, inventory, Stripe
   - Marketing & Outreach: campaigns, lead capture & scoring, content engine, social media adapters
   - Web Presence: Smart Website, blog management, chat widget install, custom domains
   - Analytics & Reports: NLP analytics, KPI dashboard, demand forecast, revenue analysis
   - Knowledge & AI: Tavily research, knowledge base, conversational intelligence
   - Customer Portal: unified customer portal, public company listing
7. **Dashboards** — Aura Command Center (hero), Company Admin Dashboard (Simple/Pro modes), Technician Dashboard, Customer Portal Home — what each shows and who uses it.
8. **Consoles & Hubs (7 + 1)** — Customer Portal · Field Operations · Business Management · Outreach & Sales · Social Media · Creative & Web Presence · Analytics & Reports · AI Operatives Hub (Elite). One block per console: purpose, primary operatives, tier required, screenshots-of-record (text descriptions only).
9. **3rd-Party Stack Disclosure** — SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Social — each requires customer's own account + card; Concierge Onboarding configures on their behalf. Standard legal disclaimer.
10. **Trial & Onboarding** — 90-Day Live Trial structure (30d onboarding / 60d live), onboarding fee per tier, what's delivered during onboarding.
11. **Sales Talking Points / Objection Handling** — short reusable snippets reps can paste.
12. **Contact & Next Steps** — CTAs (Book Demo, Start Trial, Audit), URLs (`auraintercept.ai`).

### Data sources (read-only, no logic changes)
- `src/lib/subscriptionAgentConfig.ts` — tiers, operatives, consoles
- `src/lib/agentStyles.ts` — plain-English customer labels
- `src/lib/industryCapabilities.ts` + `industryPackSchema.ts` — feature gating context
- Existing PDFs for tone reference: `SalesPitchDataPDF.tsx`, `PlatformDocumentPDF.tsx`, `PricingSummaryPDF.tsx`
- Memory: canonical-four-tier-model, canonical-naming-registry, trial-period-standard, third-party-fee-disclaimer

### Wiring (download entry point)
Add a "Marketing & Sales Master Guide" download button alongside the existing PDF downloads in **`src/pages/ai-consoles/MarketingSalesConsole.tsx`** (and surface it on the platform-admin Export Docs page at `/export-docs` if it exists). Uses `@react-pdf/renderer`'s `pdf().toBlob()` → triggers download (same pattern as other PDFs in `documentation/`).

### Style
- Cyber-Sentry theme via theme CSS vars only (no hex/rgba) — match existing PDFs' styled stylesheet.
- Heading hierarchy, section dividers, callout boxes for tier/disclaimer.
- Page numbers + footer with "Aura Intercept · auraintercept.ai · {date}".

### Out of scope
- No pricing/tier math changes.
- No backend/edge-function changes.
- No new routes — reuses existing console pages for the download trigger.
- No copy changes to other PDFs.

### Verification
- `npm run build` clean.
- Manual: open MarketingSalesConsole → click button → PDF downloads → spot-check every section renders, page breaks clean, no overflow, all 10 operatives + 8 consoles + 4 tiers present.
