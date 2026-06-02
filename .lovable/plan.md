# Fix: SignalWire "Connect" button appears to do nothing

## Root cause
`src/pages/integrations/SMSIntegration.tsx` wraps the page in `<InlineFormProvider>` and renders `<InlineFormHost className="mb-4" />` at the **very top** of the page (above the Setup Guide, the Carrier Cheat Sheet, and the SignalWire card).

`FormShell` (`src/components/ui/form-shell.tsx`) detects the inline provider and, instead of opening a centered dialog, mounts the credential form (with all the inputs and the Save button) into that top-of-page host. From where the user is scrolled — looking at the SignalWire card and the Carrier Cheat Sheet — clicking **Connect** silently injects the form ~2000px above and nothing appears to happen. There is no Save button on screen because the entire form (and its Save button) is rendered off‑screen at the top.

The Cancel / Save buttons themselves are wired correctly; this is purely a placement / visibility bug.

## Fix
Switch this page back to the standard dialog behavior so Connect opens a centered modal over the page with the credential fields + Save button.

### Change in `src/pages/integrations/SMSIntegration.tsx`
1. Remove the `InlineFormProvider` wrapper and the `<InlineFormHost className="mb-4" />` element.
2. Remove the now-unused imports (`InlineFormProvider`, `InlineFormHost`).
3. Leave the rest of the page (`FormShell`, `handleOpenSetup`, `handleSave`, `saveMutation`, the form fields) untouched. With no inline provider in scope, `FormShell` automatically falls back to its built-in `Dialog`, so clicking **Connect** opens a centered modal containing the SignalWire credential inputs (`signalwire_project_id`, `signalwire_api_token`, `signalwire_space_url`, `signalwire_phone_number`) and the existing **Save** button at the bottom.

No other files change. No backend, edge function, schema, or styling work is needed.

## Verification
- Navigate to `/dashboard/integrations/sms`.
- Click **Connect** on the SignalWire card → a centered dialog opens with the 4 credential fields, a **Cancel** button, and a **Save** button.
- Fill required fields → click **Save** → toast "Integration saved!", dialog closes, badge flips to **Connected**.

## Out of scope
- The Carrier Call‑Forwarding Cheat Sheet section already auto‑saves the selected carrier locally; no Save button is added there.
- No changes to pricing, Stripe, or other integration pages.
