

# Verify & Harden Real Autonomous Operation

## Goal
Confirm each of the 7 stack capabilities runs without human input, and patch any gap that requires manual triggering today.

## What Already Exists (verified in code)

| # | Capability | Backing edge functions / tables | Verdict |
|---|---|---|---|
| 1 | AI Receptionist + Customer Portal (24/7 voice/chat/SMS/email + self-service) | `voice-handler`, `voice-booking-agent`, `voice-swaig`, `sms-handler`, `chat-widget`, `landing-chat`, `aura-unified`, `customer-portal`, `customer-register`, `widget-api` + `appointments`/`quotes` tables | Real |
| 2 | Field Ops + Dispatch Agent (smart routing, ETAs, mobile) | `booking-actions` (Haversine geo-scoring + workload + customer-history weighting), `send-job-notification`, `RealTimeETASidebar`, `TechnicianJobQueue`, `TechnicianCheckIn`, PWA scoped to `/technician/` | Real |
| 3 | Business Mgmt + Finance (quotes, invoices w/ payment links, inventory) | `quotes`/`quote_line_items`, `invoices`/`invoice_line_items`, `inventory_items`/`inventory_transactions`, `parse-inventory-document`, Stripe payment links via `create-checkout`/`stripe-customer-portal` | Real |
| 4 | Outreach & Sales (lead scoring, campaigns, win-back) | `leads`/`lead_activities`/`lead_follow_ups`, `lead-follow-up-reminders`, `marketing_campaigns`/`campaign_recipients`, `generate-campaign-content`, `generate-campaign-series`, `winback_offers` | Real |
| 5 | Social Media + Creative Content (6 platforms, one topic) | `generate-social-content`, `generate-social-variations`, `generate-social-batch`, `generate-content-image`, `publish-social-content` (modular adapter), `social-oauth`, `scheduled_social_posts` | Real |
| 6 | Creative & Web Presence (site builder, blog, SEO) | `smart_websites`, `generate-website-content`, `generate-blog-content`, `generate-blog-batch`, `scheduled_blog_posts`, `site_metrics`, `site_visitor_logs` | Real |
| 7 | Analytics & Reports | `agent_performance_metrics`, `subscription_usage_tracking`, `site_metrics`, `weekly-digest`, `monthly-digest`, `quarterly-digest`, `analytics_intelligence` operative | Real |

**Findings:** Zero mock data in flows. AI Orchestrator emits 28 real event routes. Booking-Actions does true Haversine + load-balancing + customer-history scoring. SignalWire/ElevenLabs/Resend/Stripe all wired with E.164 normalization.

## Gap to Fix
Background loops exist as edge functions but I cannot confirm pg_cron schedules are registered (requires `cron` schema access). If schedules are missing, "autonomous" becomes "needs manual invocation."

## Plan (single migration + tiny audit page)

### Step 1 — Cron schedule audit migration
Create one migration that **idempotently** registers (or re-asserts) every recurring background job using `cron.schedule` + `net.http_post`:

```text
appointment-reminders        */5 * * * *   (every 5 min)
lead-follow-up-reminders     */15 * * * *  (every 15 min)
check-unsubscribe-alerts     0 * * * *     (hourly)
trial-reminders              0 9 * * *     (daily 9am UTC)
weekly-digest                0 13 * * MON  (Mon 1pm UTC)
monthly-digest               0 14 1 * *    (1st of month)
quarterly-digest             0 15 1 1,4,7,10 *
cost-alerts                  0 * * * *     (hourly)
publish-social-content       */5 * * * *   (scheduled posts due)
generate-blog-batch trigger  0 6 * * *     (daily blog scheduler check)
```
Each uses `cron.unschedule` first if exists, then re-schedules — so it's safe to re-run.

### Step 2 — Auto-run health probe
Add `cron-health-check` edge function (lightweight) that hits `ai-agent-health` for every active company tier-aware, every 30 min, and writes failures into `platform_issues` so admins see degradation without manual checking.

### Step 3 — Platform Admin "Autonomy Status" panel
Add a small read-only widget under **Platform Admin → Health** that shows last-run timestamp + success rate per scheduled job (queries `digest_delivery_logs`, `reminder_logs`, `ai_agent_logs`). Lets you visually confirm "no human input needed" is true in production.

### Step 4 — Document the autonomy contract
Update `mem://architecture/platform-functional-standard-v1` with the cron registry so future changes can't accidentally orphan a background job.

## Out of Scope
- No agent logic rewrites (already real).
- No new tables.
- No UI redesign — just a health panel.

## Files Touched
- `supabase/migrations/<new>_register_autonomy_cron.sql` (new)
- `supabase/functions/cron-health-check/index.ts` (new, ~80 lines)
- `src/pages/admin/PlatformHealth.tsx` (extend with `<AutonomyStatusPanel />`)
- `src/components/admin/AutonomyStatusPanel.tsx` (new)
- `mem://architecture/platform-functional-standard-v1` (memory update)

