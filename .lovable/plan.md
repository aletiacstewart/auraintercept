# 3rd-Party Integration Onboarding PDF

A new downloadable PDF that walks Concierge Onboarding staff (and self-serve customers) through every external account a company must create and connect — step by step, in the order they should be set up.

## What the PDF covers

One provider per section, each with: what it does, why the customer needs it, prerequisites, account signup, billing/credit card requirement, configuration steps, what to paste back into the Aura Intercept admin console, and verification checklist.

Sections (in setup order):

1. **Overview & Policy** — Customer owns every account, every provider bills the customer directly, Aura plan fee is platform-only (no markups, no bundled usage).
2. **Stripe** (billing for the customer's own customers) — account creation, business verification, bank account, tax info, where to paste publishable + secret keys.
3. **SignalWire** (voice + SMS telephony) — signup, add credit card, buy phone number, A2P 10DLC brand + campaign registration (carrier requirement, fees), project ID / space URL / API token, webhook URLs from Aura to paste back.
4. **ElevenLabs** (voice AI brain) — signup, plan selection, add credit card, create voice agent, configure client tools per the dashboard standard (copyable wait constraints), agent ID + API key.
5. **Resend** (transactional + marketing email) — signup, add credit card, verify sending domain (SPF/DKIM/DMARC DNS records with screenshots), API key.
6. **Tavily** (web search for operatives) — signup, add credit card, API key.
7. **Google Workspace / Calendar OAuth** — Google Cloud Console project, OAuth consent screen, authorized origins + redirect URIs (per the Google Calendar OAuth standard), client ID + secret, scope list.
8. **Social Media OAuth apps** — Facebook/Instagram, LinkedIn, X, TikTok, YouTube: developer account, app creation, redirect URIs, required scopes per platform, manual-post vs OAuth-post tradeoff.
9. **Custom Domain** — registrar, CNAME + TXT records per the domain configuration standard, verification.
10. **Final verification checklist** — one page per provider with checkboxes (account created, card on file, keys pasted into admin, test call/email/post succeeded).

Front matter: cover page, table of contents, legal disclaimer banner ("Each provider bills the customer directly on the customer's own credit card. Aura Intercept never resells, marks up, or absorbs third-party usage."), estimated time + monthly cost ranges per provider.

## Files

- **`src/lib/integrationOnboardingData.ts`** (new) — structured data: array of providers, each with `{ id, name, purpose, estTime, estCost, prereqs[], steps[{title, detail, screenshotHint?}], whatToPasteBack[], verification[] }`. Pure data so the PDF and any future in-app wizard can share it.
- **`src/components/documentation/IntegrationOnboardingPDF.tsx`** (new) — `@react-pdf/renderer` document following the same style/structure as `CompanyOnboardingPDF.tsx` and `MarketingSalesMasterPDF.tsx`. Uses `pdfSanitize.ts` helpers. Cover, TOC, one section per provider, verification checklist appendix.
- **`src/pages/ExportDocumentation.tsx`** (edit) — add a new card in the grid titled "3rd-Party Integration Onboarding Guide" with a `Plug`/`Settings2` icon, description, bullet list of included providers, and a `PDFDownloadLink` button matching the existing card pattern. Filename: `integration-onboarding-guide-YYYY-MM-DD.pdf`.

## Out of scope (this task)

- No new in-app wizard UI, no changes to actual integration code, no new edge functions.
- No changes to pricing copy beyond the legal disclaimer that already exists in memory.
- Not adding the PDF to the customer-facing onboarding screens (admin-only, on Export Documentation page).

## Technical notes

- Reuse the existing `@react-pdf/renderer` patterns and `pdfSanitize` to avoid encoding issues.
- All disclaimer language must match the "3rd-Party Policy" core memory (customer's own account, customer's own card, billed separately, no Aura markup).
- No live screenshots embedded — use written step text plus "screenshot hint" descriptions, so the PDF stays small and never goes stale when provider UIs change.
- No DB or schema changes.
