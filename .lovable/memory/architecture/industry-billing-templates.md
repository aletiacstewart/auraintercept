---
name: Industry Billing Templates
description: Quote/invoice line-item templates seeded per industry pack; forms pre-fill from these
type: feature
---
All 28 industry_template_packs rows have populated `quote_template` and `invoice_template` JSONB columns.

Shape:
```
{
  line_items: [{description, quantity, unit_price, taxable}],
  default_tax_rate: number,
  default_terms: string,
  footer_note: string
}
```

`BusinessQuoteForm` and `InvoiceForm` pre-fill line items from these in 'direct' mode and use `pack.terminology.quote/invoice` for labels. `getAppointmentRules(pack).address_required === false` hides Service/Billing Address (in-office verticals).

`hasFieldTechnicians(pack)` from `src/lib/industryCapabilities.ts` is the canonical gate for dispatch-vs-in-office UI: false for booking cluster + healthcare verticals. `FieldOperations.tsx` swaps title/icon/workflows when false. `TechnicianDashboard.tsx` hides Directions button when address not required.
