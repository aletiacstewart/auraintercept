
# Company-Configurable Console Features ✅ IMPLEMENTED

## Summary
Added per-company visibility toggles to the `smart_websites` table so companies can hide irrelevant console features (like Emergency, Tracking, Billing) from their embedded chat widget.

## Changes Made

### 1. Database Migration ✅
Added 6 new boolean columns to `smart_websites`:
- `show_console_appointments` (default: true)
- `show_console_quotes` (default: true)
- `show_console_tracking` (default: true)
- `show_console_billing` (default: true)
- `show_console_emergency` (default: true)
- `show_console_feedback` (default: true)

### 2. UnifiedCustomerConsole.tsx ✅
- Fetches console feature settings from `smart_websites`
- Filters quick actions AND tabs based on company settings (in conjunction with tier)
- Emergency section only shows if `show_console_emergency` is enabled

### 3. SmartWebsiteManager.tsx ✅
- Added "Console Features" card in Visibility tab
- 6 toggle switches for each feature

## How to Use
1. Go to **Web Presence Manager** > **Visibility** tab
2. Find the **Console Features** section
3. Toggle off features you don't need (e.g., Tracking, Emergency, Billing)
4. Your embedded chat widget will only show enabled features
