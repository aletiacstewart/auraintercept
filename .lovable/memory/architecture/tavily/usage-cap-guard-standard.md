---
name: Tavily Usage Cap Guard
description: All Tavily API calls go through `_shared/tavily-guard.ts` (guardedTavilyFetch) which enforces 1,000 credits/month per company, logs to tavily_usage_attempts, and aggregates across the company + employees + customers
type: feature
---
# Tavily Credit Cap Enforcement

Default: 1,000 credits/month per company. Override via `companies.tavily_caps` JSONB `{"monthly":2000}` or env `TAVILY_MONTHLY_CAP`.

Credit costs: Search basic=1/q, advanced=2/q; Extract basic=1/5 URLs, advanced=2/5 URLs; Map basic=1/10 URLs, with-instructions=1/5; Crawl = Map+Extract.

Pattern: `const r = await guardedTavilyFetch({ supabase, companyId, apiKey, source, body }); if (r===null) skip; else if (r.ok) await r.json()`.

DB: `tavily_usage_counters` (monthly), `tavily_usage_attempts` (log: sent/blocked_monthly/failed), RPC `increment_tavily_usage(company_id, credits, monthly_cap)` SECURITY DEFINER atomic.

Aggregation: keyed by `company_id` only — all calls (admin, employee, customer portal) that resolve the company's `tavily_api_key` count to the same bucket.

UI: `/dashboard/tavily-limits` + hook `useTavilyUsage(companyId)`. Linked from `/dashboard/integrations/tavily`.

Migrated: generate-blog-content, generate-blog-batch, generate-website-content, generate-social-variations, generate-social-batch, generate-campaign-content.
