/**
 * Platform Brief assembler.
 * Produces a single self-contained markdown document describing the entire
 * Aura Intercept platform for use as external LLM context. Contains no
 * secrets, no tenant data, no PII — only architectural facts derived from
 * the codebase and static config.
 */

import { LAUNCH_PRICING, formatPrice, type TierKey } from "./launchPricing";
import { AGENT_STYLES } from "./agentStyles";

// -------------------- Static reference data --------------------
// Curated inventories. Kept intentionally in one place so a single edit
// keeps the brief accurate.

const EDGE_FUNCTIONS = [
  "admin-reset-password", "agent-action-executor", "ai-agent", "ai-agent-chat",
  "ai-agent-health", "ai-orchestrator", "appointment-reminders", "aura-unified",
  "booking-actions", "caldav-server", "calendar-feed", "campaign-track",
  "chat-widget", "check-subscription", "check-unsubscribe-alerts", "content-engine",
  "cost-alerts", "create-checkout", "create-company-admin", "create-onboarding-invite",
  "create-platform-admin", "crm-sync-leads", "crm-test-connection", "cron-health-check",
  "customer-portal", "customer-register", "delete-users", "dispatch-integrations",
  "elevenlabs-aura-token", "elevenlabs-clone-voice", "elevenlabs-conversation-token",
  "elevenlabs-post-call", "elevenlabs-tts", "generate-blog-batch",
  "generate-blog-content", "generate-campaign-content", "generate-campaign-series",
  "generate-content-image", "generate-knowledge-base", "generate-social-batch",
  "generate-social-content", "generate-social-variations", "generate-website-content",
  "get-onboarding-invite", "google-calendar-auth", "google-calendar-sync",
  "google-calendar-webhook", "initialize-company-agents", "kb-auto-import",
  "landing-capture-lead", "landing-chat", "lead-follow-up-reminders",
  "lead-import-commit", "lead-import-parse", "log-site-event", "manage-user",
  "missed-call-handler", "monthly-digest", "notify-platform-on-signup",
  "outbound-call", "parse-faq-document", "parse-inventory-document",
  "publish-social-content", "quarterly-digest", "resend-webhook",
  "reset-user-password", "save-onboarding-progress", "seed-aura-intercept",
  "seed-super-admin", "send-appointment-email", "send-appointment-sms",
  "send-campaign", "send-company-welcome", "send-email-guarded",
  "send-job-notification", "send-review-request", "send-staff-notification",
  "sms-diagnostic", "sms-handler", "social-oauth", "social-oauth-data-deletion",
  "social-oauth-deauthorize", "social-webhook", "stripe-customer-portal",
  "submit-onboarding", "super-switcher-magiclink", "sync-company-workspace",
  "test-voice-reminder", "translate-ui", "trial-reminders", "unsubscribe",
  "upload-onboarding-file", "validate-password", "verify-domain",
  "verify-insurance", "voice-booking-agent", "voice-handler", "voice-navigator",
  "voice-post-prompt", "voice-swaig", "weekly-digest", "widget-api",
];

const ROUTES: Record<string, string[]> = {
  "Public": [
    "/", "/about", "/audit", "/blog", "/blog/:slug", "/contact", "/for-business",
    "/privacy-policy", "/terms-of-service", "/talk-to-aura",
    "/book/:companySlug", "/chat/:companySlug", "/customer-portal/:companySlug",
    "/site/:subdomain", "/site/:subdomain/blog", "/site/:subdomain/blog/:slug",
    "/intake/:token",
  ],
  "Auth": [
    "/auth", "/signin", "/signup", "/onboarding", "/customer-auth",
    "/oauth/google-calendar",
  ],
  "Customer Portal": [
    "/customer", "/customer-dashboard", "/customer-portal",
    "/customer-portal-install", "/appointment", "/appointments",
  ],
  "Technician (Field Ops)": [
    "/technician", "/technician/ai-console", "/technician/availability",
    "/technician/calendar", "/technician/history", "/technician/install",
    "/technician/jobs", "/technician/profile", "/technician/settings",
    "/dispatch-field-ops-app", "/field-ops-app", "/business-mgt-ops-app",
  ],
  "Company Admin — Dashboard": [
    "/dashboard", "/dashboard/companies", "/dashboard/customers",
    "/dashboard/employees", "/dashboard/employees/:id", "/dashboard/quick-setup",
    "/dashboard/appointments", "/dashboard/calls", "/dashboard/messages",
    "/dashboard/invoices", "/dashboard/quotes", "/dashboard/inventory",
    "/dashboard/leads", "/dashboard/leads/import", "/dashboard/campaigns",
    "/dashboard/campaigns/:id", "/dashboard/referrals",
    "/dashboard/notification-settings", "/dashboard/subscription",
    "/dashboard/knowledge", "/dashboard/help",
  ],
  "Company Admin — AI Consoles": [
    "/dashboard/ai-agent", "/dashboard/ai-agent-guide", "/dashboard/ai-agents",
    "/dashboard/ai-agents/:agentId", "/dashboard/ai-consoles/analytics",
    "/dashboard/ai-consoles/business-insights", "/dashboard/ai-consoles/business-mgt-ops",
    "/dashboard/ai-consoles/customer-insights", "/dashboard/ai-consoles/customer-portal",
    "/dashboard/ai-consoles/field-ops", "/dashboard/ai-consoles/kpi-dashboard",
    "/dashboard/ai-consoles/marketing-sales", "/dashboard/ai-consoles/new-lead",
    "/dashboard/ai-consoles/performance-report", "/dashboard/ai-consoles/revenue-analysis",
    "/dashboard/ai-consoles/revenue-forecast", "/dashboard/ai-consoles/social-media",
    "/dashboard/ai-consoles/specialists", "/dashboard/ask-aura",
    "/dashboard/content-engine", "/dashboard/video-console",
  ],
  "Company Admin — Operations": [
    "/dashboard/operations", "/dashboard/dispatch-field-ops",
    "/dashboard/dispatch-field-ops-install", "/dashboard/business-mgt-ops-install",
    "/dashboard/field-ops-install", "/dashboard/availability",
    "/dashboard/automation", "/dashboard/analytics", "/dashboard/analytics-reports",
  ],
  "Company Admin — Web Presence": [
    "/dashboard/smart-website", "/dashboard/blog-management",
    "/dashboard/customer-portal-app-install", "/dashboard/customer-website-app",
  ],
  "Company Admin — Integrations": [
    "/dashboard/integrations/calendar", "/dashboard/integrations/crm",
    "/dashboard/integrations/email", "/dashboard/integrations/embed",
    "/dashboard/integrations/sms", "/dashboard/integrations/social",
    "/dashboard/integrations/tavily", "/dashboard/integrations/voice",
    "/dashboard/3rd-party-overview",
  ],
  "Platform Admin (Aura Intercept only)": [
    "/dashboard/architecture", "/dashboard/calculators", "/dashboard/audit-report",
    "/dashboard/cyber-sentry-mockup", "/dashboard/cyber-sentry-portal-mockup",
    "/dashboard/admin/industry-packs", "/dashboard/pack-coverage",
    "/dashboard/super-switcher", "/super-switcher", "/dashboard/subscription-analytics",
    "/dashboard/platform-issues", "/dashboard/platform-guides",
    "/dashboard/platform-health", "/dashboard/onboarding-invites",
    "/dashboard/email-limits", "/dashboard/tavily-limits",
    "/dashboard/email-logs", "/dashboard/sms-logs", "/dashboard/platform-brief",
    "/design-preview",
  ],
};

const INTEGRATIONS = [
  { name: "SignalWire", role: "Telephony (voice + SMS routing, SWML)", customerAccount: true },
  { name: "ElevenLabs", role: "Voice AI agents, cloning, TTS, post-call analysis", customerAccount: true },
  { name: "Resend", role: "Transactional + campaign email", customerAccount: true },
  { name: "Tavily", role: "Web-search grounding for AI operatives", customerAccount: true },
  { name: "Stripe", role: "Subscription billing + customer portal", customerAccount: true },
  { name: "A2P 10DLC", role: "SMS carrier registration & compliance", customerAccount: true },
  { name: "Upload-Post", role: "Social multi-platform auto-posting (optional)", customerAccount: true },
  { name: "Google Calendar", role: "Two-way calendar sync via OAuth", customerAccount: true },
  { name: "Meta / LinkedIn / TikTok OAuth", role: "Social publishing (manual + OAuth paths)", customerAccount: true },
  { name: "Lovable AI Gateway", role: "Chat, image, embeddings — platform-managed", customerAccount: false },
];

const DATABASE_TABLES = [
  "agent_performance_metrics", "agent_proposed_actions", "ai_agent_configs",
  "ai_agent_context", "ai_agent_events", "ai_agent_logs", "appointment_access_logs",
  "appointments", "beta_invite_codes", "blog_posts", "business_hours",
  "calendar_event_mappings", "calendar_sync_jobs", "call_logs", "campaign_recipients",
  "campaign_sends", "companies", "company_agent_autonomy", "company_ai_content_profiles",
  "company_compliance_documents", "company_integrations", "company_role_agent_access",
  "company_role_permissions", "content_engine_history", "cost_estimates",
  "crm_connections", "crm_sync_log", "cross_company_access_logs",
  "customer_company_associations", "customer_feedback", "customer_profiles",
  "customer_referrals", "customer_segments", "customer_technician_history",
  "customers", "digest_delivery_logs", "email_send_attempts", "email_templates",
  "email_usage_counters", "employee_availability", "employee_job_assignments",
  "employee_registration_codes", "employee_time_off", "faqs",
  "google_calendar_connections", "holiday_closures", "industry_blueprints",
  "industry_template_packs", "insurance_verification_requests", "inventory_items",
  "inventory_transactions", "invoice_line_items", "invoices", "job_assignments",
  "knowledge_documents", "launch_milestones", "launch_progress",
  "lead_activities", "lead_follow_ups", "lead_import_jobs", "lead_import_rows",
  "leads", "marketing_campaigns", "missed_call_callbacks", "oauth_state_nonces",
  "onboarding_invites", "onboarding_step_events", "onboarding_submissions",
  "onboarding_uploads", "platform_issues", "platform_settings", "profiles",
  "protocol_switch_events", "push_subscriptions", "quote_line_items", "quotes",
  "reminder_logs", "reminder_settings", "role_mappings", "scheduled_blog_posts",
  "scheduled_posts", "scheduled_social_posts", "services", "site_chat_logs",
  "site_metrics", "site_visitor_logs", "smart_links", "smart_website_holidays",
  "smart_websites", "sms_keywords", "sms_logs", "sms_templates",
  "social_accounts", "social_content_drafts", "staff_notification_preferences",
  "staff_notifications", "subscription_events", "subscription_usage_tracking",
  "suppressed_emails", "tavily_usage_attempts", "tavily_usage_counters",
  "technician_service_assignments", "tenant_integrations", "tts_usage",
  "ui_translations", "unsubscribe_alerts", "user_roles", "winback_offers",
];

const CONSTRAINTS = [
  "4 pricing tiers only (Core / Boost / Pro / Elite) — no more, no fewer.",
  "No multi-location support (explicitly out of scope).",
  "No CRM/Warranty modules — replaced by 'Lead Capture & Scoring' branding.",
  "All third-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Upload-Post) require the CUSTOMER's own account and credit card. Each provider invoices the customer directly. Aura never resells or marks up.",
  "Identity split: platform_admin (ai@auraintercept.ai) is Lovable-managed and has no company. company_admin (auraintercept@gmail.com) owns all Aura Intercept GCP/Google/OAuth integrations as a tenant.",
  "AI cannot edit auth.users directly. Use SECURITY DEFINER RPCs for public metadata reads.",
  "24 agents map to 10 operatives. 'technician' is the universal employee role.",
  "60-Day Live Trial = 30 days concierge onboarding + 30 days full live use. Onboarding fee is due at trial start.",
  "Zero mock data anywhere in production surfaces. Everything is either real or an explicit empty state.",
  "Cyber-Sentry theme: CSS variables only, no hex/rgba literals in components.",
  "All API URLs strictly https://auraintercept.ai — no Lovable preview URLs.",
];

// -------------------- Builder --------------------

export function buildPlatformBrief(generatedAtIso: string): string {
  const generatedAt = new Date(generatedAtIso);
  const now = generatedAt.toISOString();

  const sections: string[] = [];

  sections.push(header(now));
  sections.push(overviewSection());
  sections.push(pricingSection());
  sections.push(operativesSection());
  sections.push(routesSection());
  sections.push(edgeFunctionsSection());
  sections.push(databaseSection());
  sections.push(integrationsSection());
  sections.push(constraintsSection());
  sections.push(howToUseSection());

  return sections.join("\n\n");
}

function header(iso: string): string {
  return [
    "# Aura Intercept — Platform Brief",
    "",
    `_Generated: ${iso}_`,
    "",
    "Self-contained architectural snapshot for use as external LLM context ",
    "(Claude, ChatGPT, Codex, etc.). Contains no secrets, no tenant data, and no PII.",
    "",
    "**Stack:** React 18 + Vite 5 + TypeScript 5, Tailwind CSS v3, shadcn/ui, ",
    "Supabase (Lovable Cloud) with Postgres + RLS + Edge Functions (Deno), ",
    "Lovable AI Gateway (Gemini + GPT), Stripe billing, SignalWire telephony, ",
    "ElevenLabs voice AI, Resend email.",
    "",
    "**Hosted at:** auraintercept.ai, www.auraintercept.ai, auraintercept.lovable.app",
  ].join("\n");
}

function overviewSection(): string {
  return [
    "## 1. Platform Overview",
    "",
    "Aura Intercept is a multi-tenant AI operations platform for service-based ",
    "businesses. Each **company** is a tenant with its own users, customers, ",
    "appointments, integrations, and AI configuration. AI operatives run inside ",
    "the tenant boundary and are gated by subscription tier.",
    "",
    "**User roles (from `user_roles` + `has_role` RPC):**",
    "- `platform_admin` — Aura Intercept internal staff. Sees the entire platform.",
    "- `company_admin` — Tenant owner. Full access within their company.",
    "- `employee` (aka `technician`) — Universal staff role, tenant-scoped.",
    "- `customer` — End customer of a tenant, sees only their own portal.",
    "",
    "**Tenancy model:** every mutable table carries `company_id`; RLS enforces ",
    "tenant isolation via `has_role(auth.uid(), ...)` and a `member_of_company()` ",
    "helper. Cross-tenant reads are only permitted through explicit ",
    "`SECURITY DEFINER` RPCs that return safe columns.",
    "",
    "**Identity split (important):**",
    "- `ai@auraintercept.ai` — Lovable-managed platform_admin (no company).",
    "- `auraintercept@gmail.com` — Aura Intercept tenant company_admin. Owns all ",
    "  GCP / Google / OAuth integrations for the flagship tenant.",
  ].join("\n");
}

function pricingSection(): string {
  const lines: string[] = [
    "## 2. Pricing & Tiers",
    "",
    `**Beta pricing:** ${LAUNCH_PRICING.active ? "ACTIVE" : "inactive"} (${LAUNCH_PRICING.label}).`,
    "",
    "| Tier | Original / mo | Beta / mo | Onboarding (orig) | Onboarding (beta) | Annual (beta) |",
    "|------|---------------|-----------|-------------------|-------------------|---------------|",
  ];
  (Object.keys(LAUNCH_PRICING.tiers) as TierKey[]).forEach((key) => {
    const t = LAUNCH_PRICING.tiers[key];
    lines.push(
      `| ${t.name} | ${formatPrice(t.original)} | ${formatPrice(t.sale)} | ` +
      `${formatPrice(t.onboardingOriginal)} | ${formatPrice(t.onboardingSale)} | ` +
      `${formatPrice(t.annualSale)} |`,
    );
  });
  lines.push(
    "",
    "**Rules:**",
    "- Onboarding = 50% of beta monthly (per tier). Original strikethrough always shown.",
    "- Legacy tier names map through `LEGACY_TIER_MAP` for grandfathered subscriptions.",
    "- 60-Day Live Trial: 30d concierge onboarding + 30d full live use. Onboarding fee due at trial start.",
  );
  return lines.join("\n");
}

function operativesSection(): string {
  const grouped = new Map<string, string[]>();
  for (const [agentId, style] of Object.entries(AGENT_STYLES)) {
    if (!grouped.has(style.label)) grouped.set(style.label, []);
    grouped.get(style.label)!.push(agentId);
  }
  const lines: string[] = [
    "## 3. AI Operatives",
    "",
    "24 agent IDs consolidate into 10 user-facing operatives with plain-English ",
    "labels. All operatives are tenant-scoped and gated by subscription tier via ",
    "`company_role_agent_access` + `feature-access.ts`.",
    "",
    "| Operative label | Underlying agent IDs |",
    "|-----------------|----------------------|",
  ];
  for (const [label, ids] of Array.from(grouped.entries()).sort()) {
    lines.push(`| ${label} | \`${ids.join("\`, \`")}\` |`);
  }
  lines.push(
    "",
    "**Handoff:** agents route via `EVENT_ROUTING` in `ai-orchestrator` edge function. ",
    "The `aura-unified` function is the single conversational entry point that ",
    "dispatches to individual operatives.",
  );
  return lines.join("\n");
}

function routesSection(): string {
  const lines: string[] = ["## 4. Consoles & Routes", ""];
  for (const [group, routes] of Object.entries(ROUTES)) {
    lines.push(`### ${group}`);
    lines.push("");
    for (const r of routes) lines.push(`- \`${r}\``);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function edgeFunctionsSection(): string {
  const lines: string[] = [
    "## 5. Edge Functions",
    "",
    `${EDGE_FUNCTIONS.length} Deno edge functions in \`supabase/functions/\`. ` +
      "All internal-to-internal calls use `verify_jwt=false` + in-code JWT validation " +
      "via the shared `_shared/internal-auth.ts` gate. User-facing endpoints require " +
      "a real Supabase session; platform_admin actions require the role claim.",
    "",
  ];
  const grouped: Record<string, string[]> = {
    "AI & Orchestration": [], "Voice & Telephony": [], "Messaging": [],
    "Calendar & Scheduling": [], "Billing & Auth": [], "Content Generation": [],
    "Integrations & OAuth": [], "Digests & Cron": [], "Other": [],
  };
  for (const fn of EDGE_FUNCTIONS) {
    let bucket = "Other";
    if (/^ai-|^aura-|^agent-|orchestrator|health/.test(fn)) bucket = "AI & Orchestration";
    else if (/voice|call|swaig|elevenlabs|missed-call/.test(fn)) bucket = "Voice & Telephony";
    else if (/sms|email|resend|notif|campaign|unsubscribe|send-/.test(fn)) bucket = "Messaging";
    else if (/calendar|appointment|booking|caldav/.test(fn)) bucket = "Calendar & Scheduling";
    else if (/stripe|checkout|subscription|password|admin|user|register|onboarding|trial/.test(fn))
      bucket = "Billing & Auth";
    else if (/generate|content|blog|social|website|kb-|knowledge/.test(fn))
      bucket = "Content Generation";
    else if (/oauth|crm|dispatch|social-|widget|verify|domain|insurance/.test(fn))
      bucket = "Integrations & OAuth";
    else if (/digest|cron|reminder|health|weekly|monthly|quarterly/.test(fn))
      bucket = "Digests & Cron";
    grouped[bucket].push(fn);
  }
  for (const [bucket, fns] of Object.entries(grouped)) {
    if (!fns.length) continue;
    lines.push(`### ${bucket}`);
    lines.push(fns.map((f) => `\`${f}\``).join(", "));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function databaseSection(): string {
  return [
    "## 6. Database Schema (summary)",
    "",
    `${DATABASE_TABLES.length} public tables. All have RLS enabled. Every table ` +
      "except explicitly-public catalogues (industry_template_packs, ui_translations) " +
      "scopes access through `company_id` + `has_role`.",
    "",
    "**Table inventory:**",
    "",
    DATABASE_TABLES.map((t) => `\`${t}\``).join(", "),
    "",
    "**Key relationships:**",
    "- `profiles.company_id` → `companies.id` (tenant membership)",
    "- `user_roles.user_id` → `auth.users.id` (role assignment, NEVER stored on profiles)",
    "- `appointments` / `leads` / `customers` / `invoices` all pivot on `company_id`",
    "- `tenant_integrations` stores per-tenant credentials for SignalWire / ElevenLabs / Stripe / etc.",
    "- `industry_template_packs` (28 packs) drives per-vertical terminology, prompts, and form schemas",
  ].join("\n");
}

function integrationsSection(): string {
  const lines: string[] = [
    "## 7. Integrations & Third-Party Services",
    "",
    "**Policy:** every third-party provider requires the CUSTOMER's own account ",
    "and credit card. Each vendor invoices the customer directly and separately ",
    "from the Aura plan. Aura is platform-only; never resells or marks up.",
    "",
    "| Provider | Role | Customer account required |",
    "|----------|------|---------------------------|",
  ];
  for (const i of INTEGRATIONS) {
    lines.push(`| ${i.name} | ${i.role} | ${i.customerAccount ? "Yes" : "No (platform-managed)"} |`);
  }
  return lines.join("\n");
}

function constraintsSection(): string {
  const lines: string[] = ["## 8. Known Constraints & Rules", ""];
  for (const c of CONSTRAINTS) lines.push(`- ${c}`);
  return lines.join("\n");
}

function howToUseSection(): string {
  return [
    "## 9. How to Use This Brief",
    "",
    "Paste this document (or attach the .md file) as the first message in any AI ",
    "assistant conversation. Then ask focused questions such as:",
    "",
    "- \"Review the AI Operatives section — where is there overlap or redundancy?\"",
    "- \"Suggest UX improvements to the Technician (Field Ops) console based on the routes list.\"",
    "- \"Identify edge functions that likely need rate limiting or additional auth checks.\"",
    "- \"Given the 4-tier pricing, recommend which features should move between tiers.\"",
    "- \"Given the constraint that all third-party costs pass through, how should we frame this on the pricing page?\"",
    "",
    "For deeper context, share your GitHub repo URL and a 7-day Share Preview link.",
    "",
    "---",
    "_End of brief._",
  ].join("\n");
}

// -------------------- Test-only export --------------------
export const __TESTING__ = { EDGE_FUNCTIONS, DATABASE_TABLES };