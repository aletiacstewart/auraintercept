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
    severity: "P3",
    status: "false_positive",
    title: "Multi-location ghost fields — actually single-location Google Business identifiers",
    observed:
      "Verified: `google_business_location_id` is the Google Business Profile location identifier (one per company) used by publish-social-content/index.ts when posting to Google Business. `location_updated_at` is the technician GPS-ping timestamp used by FieldOpsManager and TechnicianLocationSettings. Neither implies multi-location business support.",
    expected: "Keep both columns; they are not multi-location infrastructure.",
    files: [{ path: "src/integrations/supabase/types.ts", lines: "6275, 6334, 6393" }],
    memoryRef: "mem://product/multi-location-scope-exclusion",
    fixSize: "S",
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
    status: "fixed",
    title: "Help.tsx and AIHelpCenter share a single content source",
    observed:
      "FIXED — extracted helpSystemPrompt.ts which derives the AI Help Center's SYSTEM_PROMPT (console list + tier section) from the same CONSOLE_HELP_CONFIG + TIER_HELP_DESCRIPTIONS the Help page renders. Tier names, pricing, console roster now have one source of truth.",
    expected: "Single content source rendered by both surfaces.",
    files: [
      { path: "src/pages/Help.tsx" },
      { path: "src/components/help/AIHelpCenter.tsx" },
      { path: "src/lib/helpSystemPrompt.ts" },
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
    observed:
      "Scoped passes complete across /components/* and now /pages: Companies (19→0), Campaigns (8→0), Leads (12→0), Customers (19→0) tokenized to text-muted-foreground/text-foreground/border-border. TalkToAura (20) and CyberSentryPortalMockup (14) and AIAgentFlowDemo (3) and Index (4) and PublicChat (6) remain as intentional explicit-dark / marketing surfaces. All major /components/* and /pages app surfaces now swept.",
    expected: "Per-scope sweeps; ai-consoles + dashboard + operations + technician + agents + marketing + customer-portal done.",
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
    observed:
      "ai-consoles scope is clean (0 violations). Remaining 107 hits live elsewhere — bulk inside Radix primitives (allowed), with a few native admin/console scrollers (KnowledgeBase doc lists, EmployeeAvailability week grid) needing per-console refactor.",
    expected: "ai-consoles done. Open: native scrollers in admin/dashboard/technician scopes.",
    files: [{ path: "src/pages/" }, { path: "src/components/" }],
    memoryRef: "mem://style/cyber-sentry-design-standard",
    fixSize: "L",
  },
  {
    id: "css-companies-hex",
    area: "CSS / theme",
    severity: "P3",
    status: "false_positive",
    title: "Companies.tsx fallback brand colors — per-tenant defaults, not theme tokens",
    observed:
      "Verified: #0EA5E9 / #8B5CF6 are seed defaults stored to companies.primary_color / secondary_color when an admin creates a company without picking colors. They end up as inline style values for that tenant's branded surfaces — tenant data, not Aura app theme.",
    expected: "Keep as-is — semantic tokens would change Aura's chrome, not the tenant's brand.",
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
    severity: "P3",
    status: "false_positive",
    title: "#00E5FF — inline `primaryColor` prop on tenant-styled widget",
    observed:
      "Verified: all three sites pass the value as a JS prop into FloatingChatWidget / a company-branded blog header which writes inline style. Tailwind/CSS-var tokens cannot be consumed by props that need a literal color string. Contact.tsx uses the canonical Aura brand cyan; CompanyBlog uses website.primary_color || fallback.",
    expected: "Keep as inline literal. Could centralize in a JS brand constant if we ever rename the Aura cyan.",
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
