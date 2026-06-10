Add a "CRM" entry to the Integrations sidebar group in `src/components/dashboard/DashboardLayout.tsx`.

- Import `Database` icon from `lucide-react` alongside the existing icon imports.
- Insert one nav item inside the `Integrations` group:
  - label: "CRM"
  - icon: `Database`
  - href: `/dashboard/integrations/crm`
  - roles: `['platform_admin', 'company_admin']`
  - featureColor: `text-feature-integrations`

This links to the existing CRMIntegration page already present at `src/pages/integrations/CRMIntegration.tsx` and registered in `src/App.tsx`.