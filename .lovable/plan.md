## Goal

Replace "invoices ... directly" wording with "automatic billing" language in the 3rd-party acknowledgement copy across the app.

## Edits (copy-only, 4 files)

1. **`src/pages/Auth.tsx:1407`** (signup checkbox)
   - Before: `...each provider invoices me directly and separately from my Aura plan fee.`
   - After: `...each provider bills me directly through automatic billing on my card, separately from my Aura plan fee.`

2. **`src/pages/Index.tsx:1225`** (pricing disclaimer)
   - Before: `Each provider invoices you directly and separately from your Aura plan fee.`
   - After: `Each provider bills you directly through automatic billing on your card, separately from your Aura plan fee.`

3. **`src/components/landing/PricingComparisonTable.tsx:171`** (table subtitle)
   - Same swap: `invoices you directly and separately` → `bills you directly through automatic billing on your card, separately`.

4. **`src/pages/TermsOfService.tsx:196`** (legal)
   - Before: `Each provider invoices you directly and separately from your Aura plan fee...`
   - After: `Each provider automatically bills your card directly and separately from your Aura plan fee...`

No logic, schema, or component structure changes. Bold spans and surrounding markup preserved.

## Out of scope

- Other "invoice" usages in the app (customer invoices, billing module). Only the 3rd-party-provider acknowledgement copy is touched.