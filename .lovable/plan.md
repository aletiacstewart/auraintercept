

## Full Platform Consistency Update

This plan implements all 18 audit findings plus the $25/10 employees pricing standardization across the entire platform.

---

### 1. Homepage -- `src/pages/Index.tsx`

| Line | Current | Updated |
|---|---|---|
| 1056 | `No Voice` badge on Aura Presence | **Remove entire badge** |
| 1127 | `$10/employee` | `$25 per 10 employees` |
| 1128 | `starting at $499` | `starting at $299` |

---

### 2. Contact Page -- `src/pages/Contact.tsx`

Update tier names in select dropdown (lines 174-179):

| Current | Updated |
|---|---|
| Aura Express (Restaurants) | Aura Starter (Restaurants) |
| Aura Halo (Salons & Wellness) | Aura Growth (Salons & Wellness) |
| Aura Core (AI Tools) | Aura Presence (Web Presence) |
| Single-Point (Small Service) | Aura Logistics (Field Service) |
| Multi-Track (Field Operations) | Aura Performance (Full Automation) |
| Aura Pro Command (Enterprise) | Aura Command (Enterprise) |

---

### 3. Talk to Aura Page -- `src/pages/TalkToAura.tsx`

Update `tierLabels` mapping (lines 44-51):

| Current | Updated |
|---|---|
| express: 'Aura Express' | express: 'Aura Starter' |
| halo: 'Aura Halo' | halo: 'Aura Growth' |
| core: 'Aura Core' | core: 'Aura Presence' |
| single_point: 'Aura Single-Point' | single_point: 'Aura Logistics' |
| multi_track: 'Aura Multi-Track' | multi_track: 'Aura Performance' |
| command: 'Aura Pro Command' | command: 'Aura Command' |

---

### 4. Integration Docs -- `src/pages/IntegrationDocs.tsx`

Line 30: Change "Aura Core" to "Aura Presence"

---

### 5. Auth Page -- `src/pages/Auth.tsx`

- **Line 974**: Change `'flow'` to `'aura_flow'` in the tier display mapping
- **Lines 1314-1315**: Update Concierge Onboarding fee from `$500` to `$299-$499` (matching documentationConfig implementation fees: $299 for Starter, $399 for Connect, $499 for Growth+)

---

### 6. Subscription Page -- `src/pages/Subscription.tsx`

- **Line 289**: Change all 7 columns from `'$10/employee'` to `'$25/10 employees'`
- **Line 801**: Change `$10/employee` to `$25 per 10 employees`

---

### 7. Terms of Service -- `src/pages/TermsOfService.tsx`

- **Line 55**: Update from "Enterprise subscription plan is billed at $250 per month" to reflect the 7-tier structure: "Subscription plans range from $197 to $3,497 per month"
- **Line 56**: Change "10 employee accounts. Additional employees are $10/month each" to "Employee accounts vary by tier. Additional employees: $25/month per 10 employees"

---

### 8. Pricing Comparison Table -- `src/components/landing/PricingComparisonTable.tsx`

- **Line 168**: Change all 7 columns from `'$10/employee'` to `'$25/10 employees'`

---

### 9. Employee Management -- `src/components/company/EmployeeManagement.tsx`

- **Line 377**: Change `$10/employee` to `$25 per 10 employees`

---

### 10. Config -- `src/lib/documentationConfig.ts`

- **Line 802**: Change `core.calendar.required` from `false` to `true` with reason "Required for booking (inherits Connect-level agents)"
- **Line 794**: Change `halo.social_media.required` from `true` to `false` (Optional per memory standard)
- **Line 814**: Change `single_point.social_media.required` from `true` to `false` (Optional per memory standard)

---

### 11. Sales Pitch PDF -- `src/components/documentation/SalesPitchDataPDF.tsx`

| Line | Current | Updated |
|---|---|---|
| 711 | "Aura Halo tier is $397/month for salons" | "Aura Growth tier is $597/month for salons" |
| 807 | "Aura Halo (Salons/Wellness)" at $397/mo | "Aura Growth (Salons/Wellness)" at $597/mo |
| 820 | "Single-Point" at $1,497/mo | "Aura Logistics" at $1,497/mo |
| 833 | "Multi-Track" at $2,497/mo | "Aura Performance" at $2,497/mo |
| 846 | "Aura Pro Command (Enterprise)" | "Aura Command (Enterprise)" |

---

### 12. Website Copy PDF -- `src/components/documentation/WebsiteCopyPDF.tsx`

- **Line 532**: Change "Aura Core - $500/mo" to "Aura Presence - $797/mo"
- **Line 625**: Change "$499-$999 depending on complexity" to "$299-$499 depending on tier (Custom for Command)"

---

### 13. Platform FAQ PDF -- `src/components/documentation/PlatformFAQPDF.tsx`

Update all hardcoded legacy tier names in FAQ answers:
- **Line 355**: "Express and Flow" to "Starter and Connect"; "Multi-Track and Command" to "Performance and Command"
- **Line 456**: "Express", "Flow", "Halo", "Core", "Single-Point", "Multi-Track" to updated names in implementation fee answer
- **Line 489**: Replace full answer to include ALL tiers (Aura Presence now has voice)
- **Line 498-499**: "Aura Halo" to "Aura Growth" in question and answer text
- **Line 529**: Update voice tier list to include Presence (all tiers now have voice)
- **Line 630**: "Express/Flow/Core" to "Starter/Connect/Presence"; "Halo/Single-Point" to "Growth/Logistics"; "Multi-Track" to "Performance"
- **Line 640**: "Multi-Track and Command" to "Performance and Command"

---

### 14. Landing Chat Edge Function -- `supabase/functions/landing-chat/index.ts`

Full rewrite of pricing knowledge base (lines 16-29):
- Rename all tiers to standard names
- Fix all prices to match documentationConfig ($197, $397, $597, $797, $1,497, $2,497, $3,497)
- Fix employee counts (2, 3, 5, 8, 15, 25, 50)
- Change additional employees from "$10/mo per employee" to "$25/mo per 10 employees"
- Remove "No Voice" distinction for Aura Presence -- all tiers include voice
- Update operative counts per documentationConfig

---

### Summary

| Category | Files Changed |
|---|---|
| Tier naming | 8 files (Contact, TalkToAura, IntegrationDocs, SalesPitchPDF, WebsiteCopyPDF, PlatformFAQPDF, landing-chat, Auth) |
| Pricing ($25/10 employees) | 6 files (Index, Subscription, TermsOfService, PricingComparisonTable, EmployeeManagement, landing-chat) |
| Voice badge removal | 1 file (Index) + FAQ PDF updates |
| Implementation fee fix | 3 files (Index, Subscription, WebsiteCopyPDF) |
| Config corrections | 1 file (documentationConfig) |
| **Total unique files** | **14 files** |

