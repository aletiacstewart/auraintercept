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
    status: "fixed",
    title: "'Control Centers' wording lingers in Auth.tsx prose",
    observed:
      "FIXED — Auth.tsx L840 now reads 'agents, consoles, and integrations', matching the Help.tsx canonical wording.",
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
    status: "false_positive",
    title: "industryPackSchema.ts referenced but no INDUSTRY_PACKS export found",
    observed:
      "Verified: industryPackSchema.ts exports the Zod schemas used by src/pages/admin/IndustryPacksAdmin.tsx. The runtime INDUSTRY_PACKS registry intentionally lives in useIndustryPack — the schema file is the editor's validation contract, not the registry.",
    expected: "Keep schema file; runtime packs stay inside useIndustryPack.",
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
    status: "false_positive",
    title: "Industry-aware coverage not exhaustively verified",
    observed:
      "By design: BY_INDUSTRY only contains overrides for verticals where the generic trades copy is misleading (real_estate, restaurants, beauty_wellness today). All other verticals intentionally inherit the cluster fallback per the industry-aware-content-standard. New overrides are added as content gaps surface, not pre-emptively across all 18 verticals.",
    expected: "Override-on-demand; generic fallback acceptable for unmodeled verticals.",
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
    status: "fixed",
    title: "Raw text-white/bg-black/text-black/bg-white usages swept across /pages and /components",
    observed:
      "FIXED — every /components/* and /pages app surface tokenized to semantic foreground/muted-foreground/border tokens. Remaining hits are confined to intentional explicit-dark / marketing surfaces: TalkToAura, CyberSentryPortalMockup, Index hero, PublicChat, AIAgentFlowDemo. Per the Cyber-Sentry standard these are exempt.",
    expected: "App surfaces use theme tokens; marketing/dark surfaces may keep literals.",
    files: [{ path: "src/pages/" }, { path: "src/components/" }],
    memoryRef: "mem://style/cyber-sentry-design-standard",
    fixSize: "L",
  },
  {
    id: "css-internal-scrollbars",
    area: "CSS / theme",
    severity: "P1",
    status: "false_positive",
    title: "107 internal scrollbars outside allowed chat exception",
    observed:
      "Re-audited: original count was inflated by Radix primitives and bounded `flex-1 overflow-y-auto` panels inside dialog/console layouts (the chat-exception intent). KnowledgeBase + EmployeeAvailability are clean. Remaining hits are all inside fixed-height flex containers, which is the allowed pattern.",
    expected: "Allowed pattern: flex-bounded or `max-h-[60vh]` scrollers.",
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
    status: "fixed",
    title: "38 stray console.log/debug in src/",
    observed:
      "FIXED — vite.config.ts now passes `esbuild.pure: ['console.log','console.debug']` for production builds, so all 38 hits are dead-code-eliminated from shipped JS while staying available in dev. console.warn/error preserved.",
    expected: "Dev logs stripped from production bundle.",
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
    status: "fixed",
    title: "PrivacyPolicy links to lovable.dev/privacy",
    observed:
      "FIXED — Section 14 rewritten to reference Aura Intercept's sub-processor model with a privacy@auraintercept.ai contact, removing the lovable.dev/privacy outbound link.",
    expected: "No outbound branding leaks from the privacy page.",
    files: [{ path: "src/pages/PrivacyPolicy.tsx", lines: "250" }],
    fixSize: "S",
  },

  // ── Edge functions ──────────────────────────────────────────
  {
    id: "edge-url-comments-leak",
    area: "Edge functions",
    severity: "P3",
    status: "fixed",
    title: "url.ts docstring references lovable.app patterns",
    observed: "FIXED — docstring rewritten to reference auraintercept.ai per the published-domain standard. Detection regexes unchanged.",
    expected: "Comments consistent with canonical domain.",
    files: [{ path: "src/lib/url.ts", lines: "16, 17" }],
    fixSize: "S",
  },

  // ── Dashboards ──────────────────────────────────────────────
  {
    id: "dashboard-view-mode-verify",
    area: "Dashboards",
    severity: "P3",
    status: "fixed",
    title: "Verify CompanyAdminDashboard density toggle persistence",
    observed:
      "FIXED — added useDashboardViewMode.test.ts covering default, hydration from localStorage, persistence across remounts, and setMode write-through. 4/4 pass.",
    expected: "Toggle persists across mounts/sessions; covered by test.",
    files: [{ path: "src/hooks/useDashboardViewMode.ts" }],
    memoryRef: "mem://features/dashboard/simple-pro-view-mode",
    fixSize: "S",
  },
];
