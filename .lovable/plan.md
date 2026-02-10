

## Fix: Ensure Voice Icon Visibility on Customer Console

### Problem
The voice (Mic) icon and phone icon in the customer console header are conditionally rendered based on `get_company_feature_flags`. The database function and GlassHeader code are correct, but there may be a timing/state issue where the feature flags query runs before a company is fully selected, causing `hasVoiceChat` to remain `false`.

### Root Cause Analysis
In `AIAgentConsole.tsx`:
- Line 260: `const hasVoiceChat = !!featureFlags?.has_voice_chat;`
- Line 262: `const twilioPhone = featureFlags?.twilio_phone_number;` (still named "twilio" but returns SignalWire number)
- The feature flags query at line 244-258 depends on `companyId`, which is only set after company selection on the `/customer-portal` route.

The verified database query for company `04c57cbe-...` returns `has_voice_chat: true`, `has_phone: true`, `has_sms: true`. So the icons should appear once the company is selected.

### Changes

#### 1. Add defensive logging for feature flag state
Add a `console.log` in `AIAgentConsole.tsx` after the feature flags query resolves to confirm the values at runtime. This will help verify the icons are being correctly gated.

#### 2. Rename misleading variable
Rename `twilioPhone` to `signalwirePhone` (line 262) to match the actual data source and avoid confusion during future debugging.

#### 3. Verify GlassHeader receives correct props
Confirm that `showPhone` and `showVoice` props are being passed with the correct boolean values after company selection by checking the rendered component in the browser.

### Technical Details

**File: `src/components/ai/AIAgentConsole.tsx`**

- Rename `twilioPhone` variable to `signalwirePhone` on line 262
- Update reference on line 264 (`callablePhone`) accordingly
- Add a `useEffect` with console logging for `featureFlags` to trace the issue at runtime:
  ```tsx
  useEffect(() => {
    if (featureFlags) {
      console.log('[AIAgentConsole] Feature flags:', featureFlags);
    }
  }, [featureFlags]);
  ```

This is a minimal, low-risk change to verify and fix icon visibility. No database or edge function changes are needed — the backend is already returning the correct data.

