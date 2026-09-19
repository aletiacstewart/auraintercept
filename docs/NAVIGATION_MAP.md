# Navigation map

Routes are declared in `src/App.tsx`; the menus come from `src/lib/navigationConfig.ts` and are rendered by `src/components/dashboard/DashboardSidebar.tsx`.

## Public

```text
/                 home
/pricing          plans
/audit            free audit (lead capture)
/lead-capture     promo videos
/blog, /blog/:slug
/book             public booking
/status           service status
/auth, /signup, /reset-password
```

## Company dashboard (`company_admin`)

```text
/dashboard                      overview + First Steps checklist
/dashboard/appointments         schedule
/dashboard/leads /customers /quotes /invoices
/dashboard/agents               agent hub (Discover, My Agents, Performance, Approvals, Activity, Conversations)
/dashboard/analytics            one analytics surface (?tab=overview|revenue|customers|forecast|performance|reports|intake)
/dashboard/integrations         Connections + Health tabs
/dashboard/team /billing /settings
```

## Staff and customers

```text
/technician/*        my jobs, schedule, messages, AI console
/customer-portal/*   book, my appointments, invoices, support
```

## Platform admin

```text
/dashboard/companies
/dashboard/admin/feature-flags
/dashboard/admin/system-health
/dashboard/platform-guides
/dashboard/super-switcher
```

## Redirects (old to new)

| Old | Now goes to |
| --- | --- |
| `/dashboard/ai-consoles/analytics`, `/business-insights`, `/revenue-analysis` | `/dashboard/analytics` |
| `/dashboard/ai-agent`, `/dashboard/ai-consoles/specialists` | `/dashboard/agents` |
| `/dashboard/3rd-party-overview`, every per-provider setup page | `/dashboard/integrations` |
| `/dashboard/tavily-limits`, `/dashboard/integrations/tavily` | `/dashboard/integrations` |
| `/dashboard/platform-health` | `/dashboard/admin/system-health` |

## Typical first-run flow

```text
sign up -> dashboard (First Steps card)
   -> pick business type -> connect calendar -> connect calls/texts/email
   -> invite the team -> test run -> confetti
   -> product tour offers a walk through the menu
```
