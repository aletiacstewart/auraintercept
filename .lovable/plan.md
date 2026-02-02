
# Company-Configurable Console Features

## Current Problem
The `UnifiedCustomerConsole` displays features (Appt, Quote, Track, Billing, Emergency, etc.) based on the **subscription tier** only. This means:
- All companies on Multi-Track+ see all features
- Aura Intercept (a platform/SaaS company) shows irrelevant features like Emergency and Track
- No way for companies to hide features that don't apply to their business type

## Solution Overview
Add per-company visibility toggles to the `smart_websites` table and update the console to respect them.

---

## Database Changes

Add new columns to `smart_websites` table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `show_console_appointments` | boolean | true | Appt tab and quick action |
| `show_console_quotes` | boolean | true | Quote tab and quick action |
| `show_console_tracking` | boolean | true | Track quick action |
| `show_console_billing` | boolean | true | Billing quick action |
| `show_console_emergency` | boolean | true | Emergency section at bottom |
| `show_console_feedback` | boolean | true | Feedback quick action |

These work **in conjunction** with subscription tier - a feature must be both:
1. Included in the company's subscription tier, AND
2. Enabled by the company in their settings

---

## Technical Changes

### 1. Database Migration

```sql
ALTER TABLE smart_websites
ADD COLUMN show_console_appointments BOOLEAN DEFAULT true,
ADD COLUMN show_console_quotes BOOLEAN DEFAULT true,
ADD COLUMN show_console_tracking BOOLEAN DEFAULT true,
ADD COLUMN show_console_billing BOOLEAN DEFAULT true,
ADD COLUMN show_console_emergency BOOLEAN DEFAULT true,
ADD COLUMN show_console_feedback BOOLEAN DEFAULT true;
```

### 2. Update UnifiedCustomerConsole.tsx

**Modify the config fetch** to include the new visibility settings from `smart_websites`:

```typescript
// Add to fetchConfigById
const { data: websiteSettings } = await supabase
  .from('smart_websites')
  .select('show_console_*')
  .eq('company_id', companyId)
  .maybeSingle();
```

**Update visibility logic** to combine tier + company settings:

```typescript
// Current: only tier-based
const visibleQuickActions = getQuickActionsForTier(effectiveTier);

// New: tier-based AND company settings
const visibleQuickActions = getQuickActionsForTier(effectiveTier).filter(action => {
  if (action.id === 'schedule' && !websiteSettings?.show_console_appointments) return false;
  if (action.id === 'quote' && !websiteSettings?.show_console_quotes) return false;
  if (action.id === 'track' && !websiteSettings?.show_console_tracking) return false;
  if (action.id === 'billing' && !websiteSettings?.show_console_billing) return false;
  if (action.id === 'emergency' && !websiteSettings?.show_console_emergency) return false;
  if (action.id === 'feedback' && !websiteSettings?.show_console_feedback) return false;
  return true;
});
```

### 3. Add Settings UI in SmartWebsiteManager.tsx

Add a new "Console Features" section in the Settings tab:

```text
+------------------------------------------+
| Console Features                         |
| Configure which features appear in your  |
| embedded chat widget                     |
+------------------------------------------+
| Appointments      [Toggle]               |
| Quotes            [Toggle]               |
| Tracking          [Toggle]               |
| Billing           [Toggle]               |
| Emergency         [Toggle]               |
| Feedback          [Toggle]               |
+------------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `smart_websites` table | Add 6 new boolean columns |
| `src/components/customer/UnifiedCustomerConsole.tsx` | Fetch website settings, filter actions/tabs by company toggles |
| `src/pages/SmartWebsiteManager.tsx` | Add Console Features settings section |

---

## User Experience

**For Aura Intercept:**
- Go to Web Presence Manager > Settings tab
- In new "Console Features" section, disable:
  - Tracking (not applicable for SaaS)
  - Emergency (no dispatch services)
  - Billing (if not using invoice system for customers)

**Result:** The embedded console only shows relevant features for your business type.

---

## Note on Subscription Tiers
This doesn't bypass tier restrictions - it only allows companies to **hide** features they have access to. A Single-Point company still can't enable Appt/Quote even if they toggle them on (they're filtered out at the tier level first).
