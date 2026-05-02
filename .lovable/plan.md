## Add "Industries" row to Pricing Comparison "Ideal For" section

Add a new row in the existing **Ideal For** section of `src/components/landing/PricingComparisonTable.tsx` listing the industries that best match each plan, sourced from the demo seeder tier mapping (`mem://platform-operations/demo-account-registry`).

### Mapping (from demo seeder)

| Tier | Industries |
|---|---|
| Core ($197) | Beauty & Wellness, Restaurants, Real Estate, Personal Assistant |
| Boost ($497) | Handyman, Auto Care, Appliance Repair, Pest Control, Fencing |
| Pro ($997) | Security Systems, Pool & Spa, Landscape, Solar |
| Elite ($1,997) | HVAC, Electrical, Plumbing, Roofing, Construction |

### Change

In the `sections` array, expand the `Ideal For` block to include a third row:

```ts
{
  title: 'Ideal For',
  features: [
    { name: 'Business Size', starter: 'Solo / Small', connect: 'Small teams', performance: 'Growing companies', command: 'Enterprise' },
    { name: 'Use Case', starter: 'Booking & web presence', connect: 'Field service teams', performance: 'Full business mgmt', command: 'Full suite enterprise' },
    {
      name: 'Industries',
      starter: 'Beauty & Wellness, Restaurants, Real Estate, Personal Assistant',
      connect: 'Handyman, Auto Care, Appliance Repair, Pest Control, Fencing',
      performance: 'Security Systems, Pool & Spa, Landscape, Solar',
      command: 'HVAC, Electrical, Plumbing, Roofing, Construction',
    },
  ],
},
```

### Rendering note

The existing `renderValue` cell uses `text-xs` and centers content; for multi-industry strings it will wrap naturally inside the fixed-width column. No layout/CSS changes needed — the cell already handles arbitrary string values (it only treats `'check'`/`'x'` specially).

### Files

- `src/components/landing/PricingComparisonTable.tsx` — add the `Industries` row.
