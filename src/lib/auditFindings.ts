export type Severity = "P0" | "P1" | "P2" | "P3";
export type Area =
  | "Mock data"
  | "Naming drift"
  | "Workflow handoffs"
  | "Settings & integrations"
  | "AI consoles"
  | "Dashboards"
  | "Help / guides"
  | "CSS / theme"
  | "Marketing"
  | "Edge functions";

export interface AuditFinding {
  id: string;
  area: Area;
  severity: Severity;
  title: string;
  observed: string;
  expected: string;
  files: { path: string; lines?: string }[];
  route?: string;
  memoryRef?: string;
  fixSize: "S" | "M" | "L";
}

export const AUDIT_DATE = "2026-05-16";

export const AUDIT_FINDINGS: AuditFinding[] = [
  // ── Naming drift ────────────────────────────────────────────
  {
    id: "naming-tier-starter",
    area: "Naming drift",
    severity: "P1",
    title: "Legacy tier value 'starter' still emitted to auth/Stripe flow",
    observed: "5 surfaces still pass tier='starter' instead of 'core'.",
    expected: "Canonical key is 'core'. LEGACY_TIER_MAP rescues at runtime; UI must emit canonical.",
    files: [
      { path: "src/pages/Index.tsx", lines: "930" },
      { path: "src/pages/Contact.tsx", lines: "187" },
      { path: "src/pages/ForBusiness.tsx", lines: "22" },
      { path: "src/components/agents/TierComparisonCards.tsx", lines: "156" },
      { path: "src/lib/helpContentConfig.ts", lines: "69-83" },
    ],
    memoryRef: "mem://marketing/pricing/canonical-four-tier-model",
    fixSize: "S",
  },
  {
    id: "naming-tier-command",
    area: "Naming drift",
    severity: "P1",
    title: "Legacy tier value 'command' used in place of 'elite'",
    observed: "13 occurrences of tier='command'.",
    expected: "Canonical key is 'elite'.",
    files: [
      { path: "src/pages/Index.tsx", lines: "188, 206" },
      { path: "src/pages/ForBusiness.tsx", lines: "25" },
      { path: "src/lib/helpContentConfig.ts", lines: "84, 85, 143-154, 280, 315" },
      { path: "src/components/agents/TierComparisonCards.tsx", lines: "183" },
    ],
    memoryRef: "mem://marketing/pricing/canonical-four-tier-model",
    fixSize: "S",
  },
  {
    id: "naming-control-centers",
    area: "Naming drift",
    severity: "P1",
    title: "'Control Centers' vs 'Consoles' terminology drift",
    observed: "Help.tsx and Auth.tsx say 'Control Centers'; everywhere else uses 'consoles'.",
    expected: "Single canonical noun across product, marketing, help, PDFs.",
    files: [
      { path: "src/pages/Help.tsx", lines: "642" },
      { path: "src/pages/Auth.tsx", lines: "840, 1482" },
    ],
    memoryRef: "mem://architecture/canonical-naming-registry",
    fixSize: "S",
  },
  {
    id: "naming-crm-warranty-css",
    area: "Naming drift",
    severity: "P1",
    title: "CRM/Warranty CSS tokens never cleaned up after removal",
    observed: "--feature-warranties, .guide-card-crm, .badge/.icon/.text/.bg-feature-warranties still defined in index.css.",
    expected: "CRM/Warranty rename declared complete — these tokens are dead code.",
    files: [{ path: "src/index.css", lines: "74, 164, 330, 837-840, 899-902, 1254, 1272" }],
    memoryRef: "mem://marketing/standardization/crm-and-warranty-removal-complete",
    fixSize: "S",
  },
  {
    id: "naming-dup-portal-install",
    area: "Naming drift",
    severity: "P1",
    title: "Two Customer Portal install pages exist",
    observed: "CustomerPortalInstall.tsx (28 KB) and CustomerPortalAppInstall.tsx (10 KB) both exist.",
    expected: "One canonical install surface; the other should be deleted.",
    files: [
      { path: "src/pages/CustomerPortalInstall.tsx" },
      { path: "src/pages/CustomerPortalAppInstall.tsx" },
    ],
    memoryRef: "mem://architecture/mobile-app-publication-and-url-logic",
    fixSize: "M",
  },
  {
    id: "naming-ical-uid",
    area: "Naming drift",
    severity: "P3",
    title: "iCal UID uses @lovable.app",
    observed: "calendarUtils.ts:76 emits UID:${id}@lovable.app in downloaded .ics files.",
    expected: "@auraintercept.ai per published-domain standard.",
    files: [{ path: "src/lib/calendarUtils.ts", lines: "76" }],
    memoryRef: "mem://architecture/published-domain-standardization",
    fixSize: "S",
  },
  {
    id: "naming-pack-schema-missing",
    area: "Naming drift",
    severity: "P2",
    title: "industryPackSchema.ts referenced but no INDUSTRY_PACKS export found",
    observed: "Only consoleNamingConsistency.test.ts references it.",
    expected: "Either update memory pointer or extract the inline registry.",
    files: [{ path: "src/lib/industryPackSchema.ts" }],
    memoryRef: "mem://architecture/industry-template-pack-system",
    fixSize: "S",
  },
  {
    id: "naming-tone-professional",
    area: "Naming drift",
    severity: "P3",
    title: "'Professional' tone label could be misread as tier",
    observed: "BlogTopicInput and AuraIntelligenceSettings expose a tone option 'professional'.",
    expected: "Confirm this value never flows into tier resolution; otherwise rename.",
    files: [
      { path: "src/components/blog/BlogTopicInput.tsx", lines: "66" },
      { path: "src/components/settings/AuraIntelligenceSettings.tsx", lines: "445" },
    ],
    fixSize: "S",
  },

  // ── Workflow handoffs ───────────────────────────────────────
  {
    id: "workflow-multi-location-ghost",
    area: "Workflow handoffs",
    severity: "P1",
    title: "Multi-location ghost fields still in DB schema",
    observed: "google_business_location_id column visible in 3 generated type slots.",
    expected: "Multi-location is forbidden; drop the column via migration.",
    files: [{ path: "src/integrations/supabase/types.ts", lines: "6275, 6334, 6393" }],
    memoryRef: "mem://product/multi-location-scope-exclusion",
    fixSize: "M",
  },

  // ── Settings & integrations ─────────────────────────────────
  {
    id: "settings-email-guard-missing",
    area: "Settings & integrations",
    severity: "P1",
    title: "send-staff-notification bypasses the email guard",
    observed: "Function calls Resend without guardedEmailSend / increment_email_usage.",
    expected: "Every Resend caller must route through the shared guard for quota aggregation.",
    files: [{ path: "supabase/functions/send-staff-notification/index.ts" }],
    memoryRef: "mem://architecture/email/send-cap-guard-standard",
    fixSize: "S",
  },

  // ── Help / guides ───────────────────────────────────────────
  {
    id: "help-two-surfaces",
    area: "Help / guides",
    severity: "P1",
    title: "Two parallel help surfaces with drifting content",
    observed: "Help.tsx (49 KB) and AIHelpCenter.tsx (27 KB) duplicate pricing/tier/console copy.",
    expected: "Single content source rendered by both surfaces.",
    files: [
      { path: "src/pages/Help.tsx" },
      { path: "src/components/help/AIHelpCenter.tsx" },
    ],
    fixSize: "M",
  },
  {
    id: "help-elite-enterprise",
    area: "Help / guides",
    severity: "P1",
    title: "AIHelpCenter calls Elite tier 'enterprise'",
    observed: "L114 description suffix '— Full suite, enterprise'.",
    expected: "Elite is the canonical name; 'enterprise' is not a tier label.",
    files: [{ path: "src/components/help/AIHelpCenter.tsx", lines: "114" }],
    memoryRef: "mem://marketing/pricing/canonical-four-tier-model",
    fixSize: "S",
  },
  {
    id: "help-config-legacy-keys",
    area: "Help / guides",
    severity: "P1",
    title: "helpContentConfig.ts uses legacy starter/command keys throughout",
    observed: "23 lines tagged tier:'starter' or tier:'command'.",
    expected: "Bulk rename to 'core' / 'elite'.",
    files: [{ path: "src/lib/helpContentConfig.ts", lines: "69-315" }],
    memoryRef: "mem://marketing/pricing/canonical-four-tier-model",
    fixSize: "S",
  },
  {
    id: "help-industry-coverage",
    area: "Help / guides",
    severity: "P2",
    title: "Industry-aware coverage not exhaustively verified",
    observed: "Sample of healthcare verticals shows overrides; full 18-vertical matrix not QA'd.",
    expected: "Every vertical (esp. healthcare) overrides generic HVAC fallback copy.",
    files: [
      { path: "src/lib/industryHelpContent.ts" },
      { path: "src/lib/industryHelpPrompts.ts" },
    ],
    memoryRef: "mem://features/help/industry-aware-content-standard",
    fixSize: "M",
  },

  // ── CSS / theme ─────────────────────────────────────────────
  {
    id: "css-raw-color-classes",
    area: "CSS / theme",
    severity: "P1",
    title: "768 raw text-white/bg-black/text-black/bg-white usages",
    observed: "Mix of legitimate (PDF/print) and Cyber-Sentry token violations.",
    expected: "All in-app surfaces use semantic tokens.",
    files: [{ path: "src/pages/" }, { path: "src/components/" }],
    memoryRef: "mem://style/cyber-sentry-design-standard",
    fixSize: "L",
  },
  {
    id: "css-internal-scrollbars",
    area: "CSS / theme",
    severity: "P1",
    title: "107 internal scrollbars outside allowed chat exception",
    observed: "overflow-(y-)?auto/overflow-scroll across console bodies and admin pages.",
    expected: "Only chat surface (max-h-[60vh]) may scroll internally.",
    files: [{ path: "src/pages/" }, { path: "src/components/" }],
    memoryRef: "mem://style/cyber-sentry-design-standard",
    fixSize: "L",
  },
  {
    id: "css-companies-hex",
    area: "CSS / theme",
    severity: "P2",
    title: "Companies.tsx hardcodes fallback brand colors",
    observed: "#0EA5E9 / #8B5CF6 literals on 14 lines as fallbacks for company.primary/secondary_color.",
    expected: "Reference theme tokens for fallbacks.",
    files: [{ path: "src/pages/Companies.tsx", lines: "90, 91, 267, 268, 279, 280, 356, 395, 397, 405, 407, 575, 599, 604" }],
    memoryRef: "mem://style/brand-asset-registry",
    fixSize: "S",
  },
  {
    id: "css-console-logs",
    area: "CSS / theme",
    severity: "P2",
    title: "38 stray console.log/debug in src/",
    observed: "Dev logs not stripped before publish.",
    expected: "Remove or gate behind import.meta.env.DEV.",
    files: [{ path: "src/" }],
    fixSize: "S",
  },
  {
    id: "css-brand-cyan-literal",
    area: "CSS / theme",
    severity: "P2",
    title: "Brand cyan #00E5FF inlined instead of token",
    observed: "Contact.tsx, CompanyBlog.tsx, CompanyBlogPost.tsx use the literal.",
    expected: "Reference --brand-cyan (or equivalent token).",
    files: [
      { path: "src/pages/Contact.tsx", lines: "341" },
      { path: "src/pages/CompanyBlog.tsx", lines: "148" },
      { path: "src/pages/CompanyBlogPost.tsx", lines: "130" },
    ],
    fixSize: "S",
  },

  // ── Marketing ───────────────────────────────────────────────
  {
    id: "marketing-index-cta-raw",
    area: "Marketing",
    severity: "P1",
    title: "Index hero CTA uses raw gradient + text-white",
    observed: "L930 from-teal-500 to-cyan-500 + text-white bypasses theme.",
    expected: "Use bg-gradient-cta + foreground token.",
    files: [{ path: "src/pages/Index.tsx", lines: "930" }],
    memoryRef: "mem://style/cyber-sentry-design-standard",
    fixSize: "S",
  },
  {
    id: "marketing-flow-demo-consoles",
    area: "Marketing",
    severity: "P1",
    title: "AI Agent Flow Demo narration repeats '7 consoles' claim",
    observed: "L247, L296 — verify against canonical (currently aligned).",
    expected: "Confirm-only; flag if the canonical count changes.",
    files: [{ path: "src/pages/AIAgentFlowDemo.tsx", lines: "247, 296" }],
    fixSize: "S",
  },
  {
    id: "marketing-privacy-lovable-link",
    area: "Marketing",
    severity: "P3",
    title: "PrivacyPolicy links to lovable.dev/privacy",
    observed: "L250 external link.",
    expected: "Intentional (hosting partner). Leave unless white-labeling.",
    files: [{ path: "src/pages/PrivacyPolicy.tsx", lines: "250" }],
    fixSize: "S",
  },

  // ── Edge functions ──────────────────────────────────────────
  {
    id: "edge-url-comments-leak",
    area: "Edge functions",
    severity: "P3",
    title: "url.ts docstring references lovable.app patterns",
    observed: "Comment-only references in URL detection helper.",
    expected: "Cosmetic — clean up when next touching the file.",
    files: [{ path: "src/lib/url.ts", lines: "16, 17" }],
    fixSize: "S",
  },

  // ── Dashboards ──────────────────────────────────────────────
  {
    id: "dashboard-view-mode-verify",
    area: "Dashboards",
    severity: "P3",
    title: "Verify CompanyAdminDashboard density toggle persistence",
    observed: "useDashboardViewMode hook localStorage reads not exhaustively traced.",
    expected: "Toggle persists across mounts/sessions.",
    files: [{ path: "src/hooks/useDashboardViewMode.ts" }],
    memoryRef: "mem://features/dashboard/simple-pro-view-mode",
    fixSize: "S",
  },
];