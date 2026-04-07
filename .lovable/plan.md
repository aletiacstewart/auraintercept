

# Remaining Platform Inconsistencies — Final Cleanup Plan

## Issues Found

### Group 1: Legacy tier names in user-facing text (6 files)

| File | Issue | Fix |
|------|-------|-----|
| `src/pages/Help.tsx:825-830` | "Call to Book (Single-Point)" / "Online Booking (Multi-Track+)" | → "Call to Book (Core)" / "Online Booking (Boost+)" |
| `src/components/documentation/PlatformFAQPDF.tsx:635` | "Available on Halo tier and above" | → "Available on all tiers (Core and above)" |
| `src/components/documentation/PlatformFAQPDF.tsx:640` | "Available on Multi-Track and Command tiers" | → "Available on Boost and above (Field Ops agents)" |
| `src/components/documentation/PricingSummaryPDF.tsx:85-86` | "Performance+ (for Invoicing)" and "Connect+ (Social Media)" | → "Elite (for Invoicing)" and "Pro+ (Social Media)" |
| `src/components/documentation/PricingSummaryPDF.tsx:553` | "Content Features (Connect+)" | → "Content Features (Pro+)" |
| `src/components/documentation/WebsiteCopyPDF.tsx:621` | "Try free for 14 days" | → "Try free for 30 days" |

### Group 2: Legacy tier IDs in code logic (5 files)

| File | Issue | Fix |
|------|-------|-----|
| `src/pages/SmartWebsite.tsx:207-209` | Comment says "Single-Point+" and array uses `single_point`, `multi_track` | Update comment to "Core+" and add `starter`, `connect`, `performance` to the paid tier array |
| `src/components/company/EmployeeManagement.tsx:52-58` | Limits use `core: 2, single_point: 5, multi_track: 10, command: 25` | → `starter: 10, connect: 25, performance: 50, command: 999, free: 2` (matching canonical model) |
| `src/components/agents/AgentDependencyDiagram.tsx:7` | Type uses `'single_point' | 'multi_track' | 'command'` | → `'starter' | 'connect' | 'performance' | 'command'` and update internal references |
| `src/components/onboarding/LaunchPathSelector.tsx:31` | `['MULTI_TRACK', 'COMMAND']` check | → `['PERFORMANCE', 'COMMAND']` |
| `src/lib/documentationConfig.ts:439,446,453,490` | "Connect+", "Performance+" labels in third-party config | → "All tiers", "Elite", "Pro+" |

### Group 3: Auth.tsx legacy labels (1 file)

| File | Issue | Fix |
|------|-------|-----|
| `src/pages/Auth.tsx:809` | "Connect+" label for Social Media | → "Pro+" |

### Group 4: ThirdPartyCostDisclosureDialog legacy labels (1 file)

| File | Issue | Fix |
|------|-------|-----|
| `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx:67` | "Invoice Payments (Performance+ tiers)" | → "Invoice Payments (Elite tier)" |
| Same file line 77 | "Automatic Social Posting (Connect+ tiers)" | → "Social Posting (Pro+ tiers)" |

## Implementation

**Batch 1** — Fix user-facing text in `Help.tsx`, `PlatformFAQPDF.tsx`, `PricingSummaryPDF.tsx`, `WebsiteCopyPDF.tsx`, `Auth.tsx`, `ThirdPartyCostDisclosureDialog.tsx`

**Batch 2** — Fix code logic in `SmartWebsite.tsx`, `EmployeeManagement.tsx`, `AgentDependencyDiagram.tsx`, `LaunchPathSelector.tsx`, `documentationConfig.ts`

Total: 11 files with targeted string/logic replacements.

