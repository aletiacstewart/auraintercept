## Streamline Demo Signup + Tag Demo Companies

### What changes for the user
1. **Form** collects only: Name, Business Name, Email, Phone — plus two opt-in checkboxes:
   - "Email me Aura Intercept updates & demo tips"
   - "Text me Aura Intercept updates & demo tips" (disabled until phone entered, with the existing 10DLC compliance disclaimer)
2. **No more "Text me my demo links"** option — the demo link is shown right in the dialog instead.
3. **After launching**, the dialog shows a single shareable demo link with two buttons next to it: **Copy link** and **Open link** (opens in a new tab). The 3 role login cards remain below for trying each view.
4. **Every demo signup** is saved into the Aura Intercept admin "Companies" list, tagged as a **Demo** company, with the captured email/SMS opt-in flags visible.

### Technical changes

**Database migration** (new columns on `companies` so demos appear in the admin Companies dashboard with tags):
- `is_demo BOOLEAN DEFAULT false`
- `demo_email_opt_in BOOLEAN DEFAULT false`
- `demo_sms_opt_in BOOLEAN DEFAULT false`
- Index on `is_demo` for filtering
- Add `email_opt_in BOOLEAN DEFAULT false` to `demo_trials` to mirror SMS opt-in

**`StartDemoDialog.tsx`**:
- Add `emailOptIn` state alongside `smsOptIn`.
- Replace the single "Text me my demo links" block with two stacked checkboxes (email + SMS), each with proper labels and the SMS one keeping the 10DLC disclaimer.
- Pass `email_opt_in` and `sms_opt_in` to the edge function.

**`create-demo-trial` edge function**:
- Accept `email_opt_in` (new) and `sms_opt_in` (already accepted).
- On the `companies` insert, set `is_demo: true`, `demo_email_opt_in`, `demo_sms_opt_in`, and prefix the company name with `[DEMO]` so it's instantly visible in the admin Companies list.
- Persist both opt-ins onto `demo_trials` row.
- Build a single signed shareable URL (e.g. `https://auraintercept.ai/demo/{trial_id}` — reuses existing 3-role flow) and return it as `share_url` in the response. (For now: simplest correct implementation = `https://auraintercept.ai/for-business?demo={trial_id}` that auto-opens the credentials card; or just return `admin.redirect` URL with auto sign-in token. Final approach: return a single `share_url` pointing to a public route `/demo-access/{trial_id}` that loads the same 3-role launcher. Public RPC `get_demo_trial_access(p_trial_id)` returns the 3 role emails + universal password for that trial.)
- Keep best-effort Resend email of the credentials.

**`DemoCredentialsCard.tsx`**:
- Add a top section above the 3 role cards: a single read-only input showing the share URL with **Copy link** and **Open link** (new tab) buttons.
- Remove no longer accurate "we texted you" copy; keep email confirmation line if `emailed === true`.

**Admin Companies dashboard**:
- Locate the existing platform admin Companies list (likely `src/pages/admin/...` or `src/pages/Companies*.tsx`) and add a "Demo" badge column when `is_demo === true`, plus filter chip "Demos only". Will be confirmed during implementation by ripgrep.

### Notes / out of scope
- The 48-hour auto-expiry, seeded appointments/leads, and 3-role login cards all stay exactly as they are.
- 10DLC disclaimer text on the SMS opt-in is preserved (legal requirement).
- No Stripe / payment changes.
