
## The Problem & Your Idea — Confirmed ✅

Yes, it makes complete sense. The current `sessions` and `avgResp` values on every agent card are **hardcoded fake numbers** (e.g. `sessions: 87`, `avgResp: '0.9s'`). They mean nothing. Your idea is exactly right: replace those two metrics on each agent card with **real, meaningful KPIs pulled live from the database**.

---

## Metric Proposal for Every Agent

Here's what each metric pair should become, per agent:

**Business Ops Console**

| Agent | Metric 1 | Metric 2 |
|---|---|---|
| Quoting Agent | **Quotes** — total quotes created | **Converted** — quotes with status `accepted` |
| Invoicing Agent | **Invoices** — total invoices | **Paid** — invoices with status `paid` |
| Lead Gen Agent | **Leads** — total leads | **Converted** — leads with status `converted` |
| Ops Agent | **Appts** — total appointments | **Confirmed** — appointments with status `confirmed` or `completed` |

**New agents to add to the sidebar** (currently only 4, but 8 tabs exist):
- Inventory Agent → **Items** (total inventory items) / **Low Stock** (items below min_quantity)
- Companies Agent → **Companies** (total companies) / **Active** (companies with active subscription)
- Employees Agent → **Staff** (total employees/profiles) / **Active** (active employees)
- Customers Agent → **Customers** (total customer profiles) / **New This Month**

**Field Ops Console**

| Agent | Metric 1 | Metric 2 |
|---|---|---|
| Dispatch Agent | **Jobs** — total job assignments | **En Route** — jobs with status `en_route` or `in_progress` |
| Route Agent | **Routes** — job assignments with directions used | **Completed** — completed today |
| ETA Agent | **Pending** — jobs not yet completed | **On Time** — jobs completed within window |
| Check-In Agent | **Arrivals** — job check-ins today | **Completed** — jobs completed today |

**Marketing & Sales Console**

| Agent | Metric 1 | Metric 2 |
|---|---|---|
| Marketing Agent | **Campaigns** — total campaigns | **Active** — campaigns with status `active` |
| Leads Agent | **Leads** — total leads | **Converted** — leads converted |
| Audience Agent | **Customers** — total customer profiles | **Segments** — distinct segments |

**Analytics Console** — use `agent_performance_metrics` + `subscription_usage_tracking` tables:

| Agent | Metric 1 | Metric 2 |
|---|---|---|
| Analytics Agent | **Requests** — total AI requests this month | **Success** — success rate % |
| Revenue Agent | **Revenue** — total paid invoices $ | **Growth** — vs last month |
| Insights Agent | **Reports** — total reminders/reports sent | **Saved** — (or data points analyzed) |

**Social Media Console** — currently no real social data tables, so use meaningful proxies:

| Agent | Metric 1 | Metric 2 |
|---|---|---|
| Content Agent | **Campaigns** — marketing campaigns | **Active** — active campaigns |
| Scheduler Agent | **Posts** — campaigns scheduled | **Published** — completed campaigns |
| Brand Voice Agent | **Customers** — reached | **Engaged** — with response |

---

## Implementation Plan

### Step 1 — Extend `CyberAgent` interface in `CyberConsoleLayout.tsx`

Replace the hardcoded `sessions: number` and `avgResp: string` fields with semantic ones:

```ts
export interface CyberAgent {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  hsl: string;
  status: 'active' | 'standby' | 'off';
  metric1Value: number | string;  // e.g. 42
  metric1Label: string;            // e.g. 'Leads'
  metric2Value: number | string;  // e.g. 7
  metric2Label: string;            // e.g. 'Converted'
}
```

Update the agent card rendering to use `metric1Label/Value` and `metric2Label/Value` instead of `Sessions`/`Avg Resp`.

### Step 2 — Add a live data query hook `useConsoleAgentMetrics.ts`

Create `src/hooks/useConsoleAgentMetrics.ts` that queries all the tables needed for BusinessOps metrics:
- `leads` — count total + count `status = 'converted'`
- `quotes` — count total + count `status = 'accepted'`
- `invoices` — count total + count `status = 'paid'`
- `appointments` — count total + count `status IN ('confirmed','completed')`
- `inventory_items` — count total + count where `quantity < min_quantity`
- `profiles` — count employees by company
- `customer_profiles` — count total + new this month
- `companies` — count total + active

All queries filtered by `company_id`.

### Step 3 — Update `BOPS_AGENTS` array in `BusinessOpsAgentConsole.tsx`

Add all 8 agents (currently only 4) and feed live metric values from the hook:
```ts
{ id: 'quoting', metric1Value: metrics.quotesTotal, metric1Label: 'Quotes', metric2Value: metrics.quotesConverted, metric2Label: 'Converted' }
{ id: 'invoicing', metric1Value: metrics.invoicesTotal, metric1Label: 'Invoices', metric2Value: metrics.invoicesPaid, metric2Label: 'Paid' }
{ id: 'leads', metric1Value: metrics.leadsTotal, metric1Label: 'Leads', metric2Value: metrics.leadsConverted, metric2Label: 'Converted' }
{ id: 'operations', metric1Value: metrics.apptsTotal, metric1Label: 'Appts', metric2Value: metrics.apptsConfirmed, metric2Label: 'Confirmed' }
{ id: 'inventory', metric1Value: metrics.inventoryTotal, metric1Label: 'Items', metric2Value: metrics.inventoryLowStock, metric2Label: 'Low Stock' }
{ id: 'companies', metric1Value: metrics.companiesTotal, metric1Label: 'Companies', metric2Value: metrics.companiesActive, metric2Label: 'Active' }
{ id: 'employees', metric1Value: metrics.employeesTotal, metric1Label: 'Staff', metric2Value: metrics.employeesActive, metric2Label: 'Active' }
{ id: 'customers', metric1Value: metrics.customersTotal, metric1Label: 'Customers', metric2Value: metrics.customersNew, metric2Label: 'New' }
```

Also wire `onAgentClick` for all 8 agents (inventory, companies, employees, customers are already tabs but not yet wired as agent cards).

### Step 4 — Update FieldOps, Marketing, Analytics, Social consoles

Same pattern: update agent arrays to use meaningful `metric1/metric2` labels+values with live data where available.

### Files to change:
1. `src/components/ai/chat/CyberConsoleLayout.tsx` — update `CyberAgent` interface + card rendering
2. `src/hooks/useConsoleAgentMetrics.ts` — **new file** with live data queries
3. `src/components/billing/BusinessOpsAgentConsole.tsx` — 8 agents + live metrics
4. `src/components/employee/FieldOpsAgentConsole.tsx` — FieldOps agents + job metrics
5. `src/components/marketing/MarketingSalesAgentConsole.tsx` — Marketing agents + campaign/lead metrics
6. `src/components/analytics/AnalyticsAgentConsole.tsx` — Analytics agents + performance metrics
7. `src/components/social/SocialMediaAgentConsole.tsx` — Social agents + campaign metrics
