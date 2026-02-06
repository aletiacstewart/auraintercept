
# Control Center Count Correction Plan

## Summary
The documentation incorrectly states 8 Control Centers when there are actually **7 Control Centers (Consoles)**. The AI Operatives Hub is a management interface, not a Control Center itself.

## Correct Structure

### 7 Control Centers (Consoles)
| # | Control Center | Required Tier |
|---|----------------|---------------|
| 1 | Customer Portal | Scheduling |
| 2 | Outreach & Sales Ops | Growth |
| 3 | Social Media Ops | Growth |
| 4 | Creative & Web Presence | Business |
| 5 | Field Operations | Field Ops |
| 6 | Business Management | Field Ops |
| 7 | Analytics & Reports | Performance |

### Management Interface (Separate)
| Interface | Required Tier | Purpose |
|-----------|---------------|---------|
| AI Operatives Hub | Command | Central management for all 24 operatives |

## Files Requiring Updates

### 1. src/lib/documentationConfig.ts

**PLATFORM_STATS** (line 635):
- Change `totalConsoles: 8` to `totalConsoles: 7`

**SUBSCRIPTION_TIERS - command tier** (lines 194-199):
- Change `consoles: 8` to `consoles: 7`
- Update highlight from "All 7 Consoles + AI Operatives Hub" to "All 7 Control Centers + AI Operatives Hub (Management Interface)"

**CONSOLES array** (lines 561-569):
- Move `ai_operatives_hub` to a separate exported constant `MANAGEMENT_INTERFACES`
- Keep it in the file but categorize it distinctly

### 2. src/lib/helpContentConfig.ts

**TIER_CONSOLE_COUNTS** (line 588):
- Change `command: 8` to `command: 7`
- Update comment from "8 total consoles" to "7 total consoles"

**CONSOLE_HELP_CONFIG**:
- Verify `ai_operatives_hub` is properly labeled as a management interface, not a console

### 3. src/components/documentation/PlatformFAQPDF.tsx

Multiple FAQ answers reference the console count dynamically via `PLATFORM_STATS.totalConsoles`, so they will auto-correct once the config is updated.

**Line 524** answer text mentions "organized into X Control Centers" - will auto-update.

## Technical Changes Summary

```text
documentationConfig.ts:
├── PLATFORM_STATS.totalConsoles: 8 → 7
├── SUBSCRIPTION_TIERS.command.consoles: 8 → 7
├── SUBSCRIPTION_TIERS.command.highlights: Update wording
└── CONSOLES array: Move ai_operatives_hub to separate section

helpContentConfig.ts:
├── TIER_CONSOLE_COUNTS.command: 8 → 7
└── Comment: "8 total" → "7 total"
```

## Resulting Tier Console Access

| Tier | Console Count | Consoles Available |
|------|--------------|-------------------|
| Starter | 0 | None |
| Scheduling | 1 | Customer Portal |
| Growth | 3 | + Outreach & Sales, Social Media |
| Business | 4 | + Creative & Web Presence |
| Field Ops | 6 | + Field Operations, Business Management |
| Performance | 7 | + Analytics & Reports |
| Command | 7 | All 7 + AI Operatives Hub (management interface) |

## Verification Steps
After implementation:
1. Check Platform Guides shows "7 Control Centers (Consoles)"
2. Verify FAQ PDF exports show correct count
3. Confirm AI Operatives Hub is labeled as management interface
4. Test subscription comparison cards display correct console counts
