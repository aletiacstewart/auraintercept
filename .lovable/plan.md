## Goal

Bring every customer-facing knowledge artifact to a single, current source of truth so the PDFs you download into Aura's knowledge base are accurate. Standard everywhere:

- **4 Tiers**: Core $197 / Boost $497 / Pro $997 / Elite $1,997 (90-day free trial, no card)
- **24 Smart AI Agents = 10 Operatives** across **7 Control Centers + AI Operatives Hub**
- **3rd-party services bundled** (SignalWire, ElevenLabs, Resend, Tavily) — no extra fees
- **No CRM, no Warranty, no multi-location, no Twilio**
- **Contact email**: `ai@auraintercept.ai` (not `support@auraintercept.com`)
- **Universal `technician` role**, plain-English agent labels (Front Desk, On The Way, Billing, etc.)

## Scope (every item below will be reviewed and corrected)

### 1. Master config (drives PDFs + Help)
- `src/lib/documentationConfig.ts` — verify all 4 tiers, agent lists, console names, features, integrations, FAQ data
- `src/lib/helpContentConfig.ts` — fix legacy tier keys (`'starter'`, `'command'`) and console/agent mappings
- `src/lib/howToUseContent.ts` — remove CRM/warranty examples, refresh agent count phrasing
- `src/lib/industryMarketingContent.ts` — verify industry list (incl. SaaS/DaaS) and tier references

### 2. PDF generators (`src/components/documentation/`)
Review and update each:
- `AIAgentGuidesPDF.tsx`
- `PlatformDocumentPDF.tsx`
- `ComprehensiveGuidesPDF.tsx`
- `CompanyGuidesPDF.tsx`
- `CompanyOnboardingPDF.tsx`
- `PricingSummaryPDF.tsx`
- `SalesPitchDataPDF.tsx`
- `SocialMediaContentPackPDF.tsx`
- `VideoScriptsPDF.tsx`
- `BrandAssetGuidePDF.tsx`
- `WebsiteCopyPDF.tsx`
- `IndustryMarketingKitPDF.tsx`
- `PlatformFAQPDF.tsx` — replace `support@auraintercept.com` (3 places), remove "Command tier" wording
- Fix the duplicated `<li><li>4-Tier Subscription Access</li></li>` in `ExportDocumentation.tsx`

### 3. Pages
- `src/pages/ExportDocumentation.tsx` — descriptions, bullet lists, broken HTML
- `src/pages/PlatformGuides.tsx` — guide titles, links to consoles, agent names
- `src/pages/Help.tsx` — tier descriptions, FAQ answers, support contact
- `src/pages/Architecture.tsx` — flowcharts, "7 Control Centers + AI Operatives Hub" wording, links
- `src/pages/AIAgentGuide.tsx` — agent listing
- `src/pages/AIAgentFlowDemo.tsx` — narration scripts (24 agents / 7 consoles already correct, verify links)
- `src/pages/VideoPromptsPage.tsx` — every script's audio narration, tier references, agent names
- `src/pages/DemoAccountSeeder.tsx` — verify the 12 demo accounts (4 tiers × admin/employee/customer), `aidemo*!` password, descriptions
- `src/pages/IntegrationDocs.tsx` — confirm SignalWire/ElevenLabs/Resend/Tavily are described as bundled

### 4. Cross-link integrity
- Verify every "Learn more" / "View guide" / sidebar link in Help, PlatformGuides, ExportDocumentation, and the dashboard onboarding hub points to a real route
- Add missing links between related guides (e.g., Help → matching Platform Guide → matching PDF)

## Standardization rules applied everywhere
1. Replace `support@auraintercept.com` → `ai@auraintercept.ai`
2. Remove "Twilio", "Express/Flow/Halo", "Command/Growth/Starter" tier names → use Core/Boost/Pro/Elite
3. Remove CRM, Warranty, multi-location references
4. Use "24 Smart AI Agents organized as 10 Operatives across 7 Control Centers + AI Operatives Hub"
5. Note 3rd-party usage is bundled in tier (no carrier/usage fees)
6. Trial = 90 days, no credit card required

## Deliverable for you

After updates, the **Export Documentation** page (`/dashboard/export-docs`) will produce these clean PDFs ready to upload to Aura's knowledge base:

```text
1.  AI Agent & Console Guide
2.  Business / Platform Documentation
3.  Comprehensive Platform Guides
4.  Company Operating Guide
5.  Company Onboarding Guide
6.  Pricing Summary
7.  Sales Pitch Data
8.  Social Media Content Pack
9.  Video Scripts
10. Brand Asset Guide
11. Website Copy
12. Industry Marketing Kit
13. Platform FAQ
```

## Out of scope (won't touch)
- Database FAQ rows (already updated previously)
- Marketing pages outside the guide/help/docs surface
- Edge functions / backend logic
- Visual redesign — content & link corrections only

## Approach
Single sweeping pass: update master configs first (so PDFs that read from them inherit the fixes), then walk each PDF generator and page individually for hard-coded strings, then re-verify links. After completion you can hit `/dashboard/export-docs` and download all 13 PDFs in one session.