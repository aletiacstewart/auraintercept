# Industry-Specific Platform Customization — v3 (Saved Plan)

Revised based on your corrections. Reservation/Waitlist agent removed entirely. Recurring Route Agent dropped — the existing `route` agent already handles routing and just needs prompt tuning per industry. **Net new operatives reduced from 6 → 4.**

---

## Q&A — direct answers to your questions

### 1. Will more AI agents be created? How many?

Today: **10 operatives (24 underlying agents)**. Proposal adds **4 net-new specialist operatives** (down from 6 in v2). Most "industry-specific" behavior is achieved by giving the **existing 10 operatives industry-flavored prompts and KB packs** — not by creating more agents.

| New operative | Shared by which industries | Purpose |
|---|---|---|
| **Diagnostic Agent** (vision + symptom analysis) | HVAC, Plumbing, Electrical, Appliance Repair, Auto Care, Pool & Spa, Solar | Photo/symptom → likely fix + parts list |
| **Permit & Code Agent** | Plumbing, Electrical, Solar, Roofing, Fencing, Construction, Security | Local code/permit checks before scheduling |
| **Site Survey & Quote Agent** | Solar, Roofing, Fencing, Landscape, Construction, Security | Pre-install survey workflow + takeoff math |
| **Insurance Claim Agent** | Roofing, Auto Care, Plumbing (water damage) | Claim-ready report generation |

**Dropped from v2 (your feedback):**
- ~~Recurring Route Agent~~ — the existing **`route` agent** (operative: `field_navigation`) already does this. We'll just add industry-specific prompt deltas: "weekly pool routes", "monthly pest routes", "landscape recurring jobs". **Zero new code, zero new operative.**
- ~~Reservation & Waitlist Agent~~ — removed entirely. Real Estate uses standard appointment scheduling. Restaurants use the existing AI Receptionist + Smart Link to push customers to their own booking platform (already built). Beauty customers come to the shop, not on a route — no agent needed.

**Total operatives platform-wide: 10 + 4 = 14** (down from 16 in v2).

### 2. New API or 3rd-party integrations required?

**No mandatory new integrations.** Same answer as v2 — works on existing stack (SignalWire, ElevenLabs, Resend, Tavily, Stripe, Google Calendar, Lovable AI Gateway).

Optional Pro/Elite-only future enhancers: Weather API (HVAC seasonality, Roofing storm tracking), Solar production APIs (Enphase/SolarEdge). Not blockers.

### 3. Is there enough benefit to justify it?

Yes. Three concrete wins:
1. **Conversion lift** — "Built for HVAC contractors" beats "Built for service businesses" at signup.
2. **Lower trial churn** — relevant KPIs and job templates on day 1 instead of generic.
3. **Stronger upgrade path** — locking the 4 specialist agents to Pro/Elite gives every vertical a real reason to upgrade.

### 4. Demo accounts — consolidation strategy

Consolidate from 12 → **7 demos**, grouped by industry cluster (since each cluster shares the same agent pack):

| Demo company | Cluster covered | Tier |
|---|---|---|
| Demo Trades Co (HVAC + Plumbing + Electrical + Appliance) | Cluster A | One per tier (4) |
| Demo Outdoor Co (Solar + Roofing + Landscape + Fencing + Pool + Pest) | Cluster B | Pro tier (1) |
| Demo Repair Co (Auto + Handyman + Construction + Security) | Cluster C | Pro tier (1) |
| Demo Booking Co (Restaurants + Beauty + Real Estate + Personal Assistant) | Cluster D | Pro tier (1) |

Each demo has admin + employee + customer = **21 accounts total** (down from ~36). Demo registry memory will be updated.

### 5. Risk areas — clarified

- **"Maintenance burden"** = every new feature now needs to answer "which industry packs include this?". The pack architecture isolates this cleanly — devs add the field to one or more pack rows, no React refactors. **Manageable.**
- **Streamlined signup** — yes. Add **one mandatory step**: industry selector (visual cards, not dropdown). Industry choice then drives downstream defaults, *removing* later setup steps. **Net signup gets shorter.**

### 6. Tier gating recommendation

Hybrid model:

- **Universal-but-tailored** (Core+): industry-flavored dashboard widgets, job templates, terminology, KB seeds, prompt overrides for the existing 10 operatives → every customer gets their industry's flavor on Core.
- **Specialist agents** (Pro+): all 4 new operatives gated to Pro/Elite — Diagnostic Agent, Permit & Code Agent, Site Survey & Quote Agent, Insurance Claim Agent. High-value AI = upgrade trigger.

### 7. Migration strategy

You confirmed: only existing trial companies are demo seeds. So **no migration code needed** for real users. Demo seeder gets re-run once. New signups land on the new flow from day 1.

---

## Grouped rollout (your suggestion — adopted)

### Phase 1 — Foundation (1-2 weeks)
- `industry_template_packs` table + RLS
- `useIndustryPack()` hook + provider
- Refactor `CompanyAdminDashboard` into widget-pack shell
- Add 1 mandatory industry-selector step to signup
- Wire industry-specific prompt deltas into existing 10 operatives (incl. `route` agent for recurring-route verticals)

### Phase 2 — Cluster A: Core Trades (2-3 weeks)
**HVAC, Plumbing, Electrical, Appliance Repair**
- New specialists: Diagnostic Agent, Permit & Code Agent (Plumbing/Electrical only)
- Shared widgets: emergency queue, parts inventory, dispatch heatmap
- Per-industry differences: HVAC seasonal heatmap; Plumbing 24/7 emergency queue; Electrical load-calc widget; Appliance error-code lookup
- **One demo cluster covers all 4.**

### Phase 3 — Cluster B: Outdoor & Property (2-3 weeks)
**Solar, Roofing, Landscape & Trees, Fencing & Decking, Pool & Spa, Pest Control**
- New specialists: Site Survey & Quote Agent, Insurance Claim Agent (Roofing only)
- Existing `route` agent gets recurring-route prompt delta for Pool, Pest, Landscape
- Per-industry: Solar production widget; Roofing storm map; Pool chemistry log; Pest infestation map

### Phase 4 — Cluster C: Repair & Service (2 weeks)
**Auto Care, Handyman & Cleaning, Construction (Painting/Flooring/Tile/Trim), Security Systems**
- Specialists: Diagnostic Agent (Auto), Site Survey & Quote Agent (Construction/Security)
- Per-industry: Auto bay scheduling; Construction multi-phase tracker; Security monitoring status

### Phase 5 — Cluster D: Booking-First (1-2 weeks, smaller scope now)
**Restaurants, Beauty & Wellness, Real Estate, Personal Assistant**
- **No new agents.** Uses existing AI Receptionist + standard appointment scheduling + Smart Links.
- Per-industry tweaks only:
  - Restaurants: Smart Link to external booking platform (already built); receptionist prompt for menu/hours/reservations handoff
  - Beauty: in-shop appointment scheduling, upsell tracker widget
  - Real Estate: standard appointment scheduling renamed "Showings"; lead-scoring tuned for buyer/seller intent
  - Personal Assistant: task-bundling prompt delta on existing operatives

### Phase 6 — Polish (1 week)
- Re-seed 7 industry-cluster demo accounts
- Parameterize Playwright visual regression suite per pack
- Per-industry help docs + welcome emails
- Marketing sub-pages

**Total: ~9-12 weeks for full delivery, ~5 weeks for Phases 1-2 (Cluster A live).**

---

## Architecture summary

```text
companies.industry_vertical ──► industry_template_packs (pack rows)
                                  │
                                  ├── dashboard_widgets[]   (KPI ids + order)
                                  ├── job_templates[]       (services, durations)
                                  ├── appointment_rules{}   (emergency, surveys, recurring)
                                  ├── agent_prompt_deltas{} (per-operative prompt overrides — incl. route)
                                  ├── extra_operatives[]    (which of the 4 new ones to enable)
                                  ├── form_schemas{}        (intake forms)
                                  ├── checklist_library[]   (tech mobile checklists)
                                  ├── kb_seed_documents[]   (preloaded knowledge)
                                  └── min_tier_per_extra{}  (Pro/Elite gating)
```

Adding a new industry post-launch = inserting a config row, no React changes.

---

## Headline numbers (revised)

- **4 new operatives** (down from 6 in v2)
- **Recurring routes handled by existing `route` agent** — prompt delta only, no new code
- **Cluster D ships with zero new agents** — pure prompt + widget tuning
- **0 new mandatory 3rd-party integrations**
- **7 demo companies** (down from 12)
- **1 new mandatory signup step** (replaces several later setup steps → net shorter)
- **~5 weeks to MVP** (Phases 1-2: Trades cluster live)
- **~9-12 weeks to full** (all 4 clusters, all 18 industries)

---

## Confirm to proceed

If this revised plan looks right, the next message will start **Phase 1 (Foundation)** — DB migration for `industry_template_packs`, the `useIndustryPack` hook, the dashboard widget-pack refactor, and the new signup step.
