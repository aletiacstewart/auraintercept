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
  status?: "open" | "fixed" | "false_positive";
}

export const AUDIT_DATE = "2026-05-16";

export const AUDIT_FINDINGS: AuditFinding[] = [
  // ── Naming drift ────────────────────────────────────────────
  {
    id: "naming-tier-internal-ids",
    area: "Naming drift",
    severity: "P3",
    status: "false_positive",
    title: "Legacy 'starter/connect/performance/command' tier values across UI",
    observed:
      "Initial scan flagged ~30 sites using these as 'legacy'. Verified false positive: these are the codebase INTERNAL canonical tier IDs (SubscriptionTier type). 'core/boost/pro/elite' are the user-facing DISPLAY names that map back via LEGACY_TIER_MAP in src/lib/subscriptionAgentConfig.ts.",
    expected: "Keep internal IDs as-is; use display names only in user-facing strings.",
    files: [{ path: "src/lib/subscriptionAgentConfig.ts", lines: "277-305" }],
    memoryRef: "mem://marketing/pricing/canonical-four-tier-model",
    fixSize: "S",
  },
  {
    id: "naming-control-centers",
    area: "Naming drift",
    severity: "P2",
    status: "open",
    title: "'Control Centers' wording lingers in Auth.tsx prose",
    observed:
      "Help.tsx FIXED to 'consoles'. Auth.tsx still uses 'control centers' in marketing copy (L840). Acceptable as softer wording but inconsistent.",
    expected: "Single canonical noun across product/marketing/help.",
    files: [{ path: "src/pages/Auth.tsx", lines: "840" }],
    memoryRef: "mem://architecture/canonical-naming-registry",
    fixSize: "S",
  },
  {
    id: "naming-crm-warranty-css",
    area: "Naming drift",
    severity: "P3",
    status: "fixed",
    title: "CRM/Warranty CSS tokens cleanup",
    observed: "FIXED — --feature-warranties, .guide-card-crm and all .badge/.icon/.text/.bg-feature-warranties classes removed from index.css.",
    expected: "Dead code removed after CRM/Warranty rename.",
    files: [{ path: "src/index.css" }],
    memoryRef: "mem://marketing/standardization/crm-and-warranty-removal-complete",
    fixSize: "S",
  },
  {
    id: "naming-dup-portal-install",
    area: "Naming drift",
    severity: "P3",
    status: "false_positive",
    title: "Two Customer Portal install pages — actually distinct surfaces",
    observed:
      "Verified: CustomerPortalInstall.tsx serves the public /customer-portal-install route (customers install the PWA). CustomerPortalAppInstall.tsx is the admin /dashboard/customer-portal-app-install page that renders the QR code pointing at the public URL. Not a duplicate.",
    expected: "Keep both as-is.",
    files: [
      { path: "src/pages/CustomerPortalInstall.tsx" },
      { path: "src/pages/CustomerPortalAppInstall.tsx" },
    ],
    fixSize: "S",
  },
  {
    id: "naming-ical-uid",
    area: "Naming drift",
    severity: "P3",
    status: "fixed",
    title: "iCal UID domain",
    observed: "FIXED — UID:${id}@auraintercept.ai (was @lovable.app).",
    expected: "@auraintercept.ai per published-domain standard.",
    files: [{ path: "src/lib/calendarUtils.ts", lines: "76" }],
    memoryRef: "mem://architecture/published-domain-standardization",
    fixSize: "S",
  },
  {
    id: "naming-pack-schema-missing",
    area: "Naming drift",
    severity: "P2",
    status: "open",
    title: "industryPackSchema.ts referenced but no INDUSTRY_PACKS export found",
    observed: "Only consoleNamingConsistency.test.ts references it.",
    expected: "Either update memory pointer or extract the inline registry.",
    files: [{ path: "src/lib/industryPackSchema.ts" }],
    memoryRef: "mem://architecture/industry-template-pack-system",
    fixSize: "S",
  },

  // ── Workflow handoffs ───────────────────────────────────────
  {
    id: "workflow-multi-location-ghost",
    area: "Workflow handoffs",
    severity: "P1",
    status: "open",
    title: "Multi-location ghost fields still in DB schema",
    observed: "google_business_location_id column visible in 3 generated type slots.",
    expected: "Multi-location is forbidden; drop the column via migration (requires user approval).",
    files: [{ path: "src/integrations/supabase/types.ts", lines: "6275, 6334, 6393" }],
    memoryRef: "mem://product/multi-location-scope-exclusion",
    fixSize: "M",
  },

  // ── Settings & integrations ─────────────────────────────────
  {
    id: "settings-email-guard-missing",
    area: "Settings & integrations",
    severity: "P3",
    status: "fixed",
    title: "send-staff-notification email guard",
    observed: "FIXED — function now routes through sendGuardedEmail; critical alert types (missed_call, job_update) bypass the daily cap.",
    expected: "Every Resend caller routes through the shared guard.",
    files: [{ path: "supabase/functions/send-staff-notification/index.ts" }],
    memoryRef: "mem://architecture/email/send-cap-guard-standard",
    fixSize: "S",
  },

  // ── Help / guides ───────────────────────────────────────────
  {
    id: "help-two-surfaces",
    area: "Help / guides",
    severity: "P1",
    status: "open",
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
    severity: "P3",
    status: "fixed",
    title: "AIHelpCenter no longer calls Elite 'enterprise'",
    observed: "FIXED — suffix updated to 'full Aura suite'.",
    expected: "Elite is the canonical name.",
    files: [{ path: "src/components/help/AIHelpCenter.tsx", lines: "114" }],
    memoryRef: "mem://marketing/pricing/canonical-four-tier-model",
    fixSize: "S",
  },
  {
    id: "help-control-centers",
    area: "Help / guides",
    severity: "P3",
    status: "fixed",
    title: "Help.tsx '7 Control Centers' wording",
    observed: "FIXED — now reads '7 consoles'.",
    expected: "Consistent with rest of product/marketing.",
    files: [{ path: "src/pages/Help.tsx", lines: "642" }],
    fixSize: "S",
  },
  {
    id: "help-industry-coverage",
    area: "Help / guides",
    severity: "P2",
    status: "open",
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
    status: "open",
    title: "768 raw text-white/bg-black/text-black/bg-white usages",
    observed: "Mix of legitimate (PDF/print, marketing brand surfaces) and Cyber-Sentry violations in app shell.",
    expected: "All in-app surfaces use semantic tokens; PDF/print exempt.",
    files: [{ path: "src/pages/" }, { path: "src/components/" }],
    memoryRef: "mem://style/cyber-sentry-design-standard",
    fixSize: "L",
  },
  {
    id: "css-internal-scrollbars",
    area: "CSS / theme",
    severity: "P1",
    status: "open",
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
    status: "open",
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
    status: "open",
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
    status: "open",
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
    severity: "P3",
    status: "false_positive",
    title: "Index hero CTA gradient — intentional brand surface",
    observed: "Marketing page intentionally uses raw brand gradients; not a Cyber-Sentry violation since marketing surfaces are exempt.",
    expected: "Keep as-is.",
    files: [{ path: "src/pages/Index.tsx", lines: "930" }],
    fixSize: "S",
  },
  {
    id: "marketing-privacy-lovable-link",
    area: "Marketing",
    severity: "P3",
    status: "open",
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
    status: "open",
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
    status: "open",
    title: "Verify CompanyAdminDashboard density toggle persistence",
    observed: "useDashboardViewMode hook localStorage reads not exhaustively traced.",
    expected: "Toggle persists across mounts/sessions.",
    files: [{ path: "src/hooks/useDashboardViewMode.ts" }],
    memoryRef: "mem://features/dashboard/simple-pro-view-mode",
    fixSize: "S",
  },
];
