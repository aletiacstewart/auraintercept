## Goal

Polish the `/for-business` Dynamic Demo Page: fix the EN/ES toggle scope, clean the industry dropdown, compact the pricing tier cards, link tiers to the real signup flow, and make sure when a prospect launches a demo they get an industry-pre-seeded company **plus** an emailed copy of the demo links so they can test on desktop and mobile.

---

## 1. EN / ES toggle — clarify scope

**Issue:** The user expects toggling EN→ES to translate everything (consoles, Aura responses, AI Operatives, Ask Aura, etc.). Today only the marketing nav strings are translated; consoles, AI prompts, and AI responses are English-only.

**Plan:** Translating the entire dashboard + AI runtime is a multi-week effort (hundreds of console strings + AI prompt localization + assistant output language). For this loop I will:

- Make the language toggle clearly **scoped to public-facing marketing pages only** by adding a small tooltip ("Marketing pages — full app translation coming soon") on the toggle.
- Hide the EN/ES toggle from inside the dashboard / consoles where it currently does nothing meaningful, so it isn't misleading.
- Add a follow-up note in memory so the full-app i18n becomes its own tracked initiative.

If you want me to instead start on full app translation now, say so and I will scope a separate plan — it will be large.

---

## 2. Industry dropdown cleanup

In `src/components/marketing/IndustryDropdownPicker.tsx` and `src/lib/industryMarketingContent.ts`:

- **Remove** the trailing "Other" group + the "other" item from the dropdown so it doesn't appear at the bottom (kept internally as a fallback only).
- Restyle group `SelectLabel`s: **bold + underlined + cyan-blue** (`text-primary font-bold underline underline-offset-4 uppercase tracking-wide text-xs`) so titles are visually distinct from selectable items.
- Selectable industry items stay normal weight / foreground color.

---

## 3. Compact pricing tier cards

In `ForBusiness.tsx` `PRICING_TIERS` section:

- Switch from large cards to a **compact 4-column grid** (`grid-cols-2 md:grid-cols-4`) using smaller `Card` padding (`p-3`), smaller price text (`text-xl` instead of `text-3xl`), tighter tagline (`text-[10px]`), and a small CTA pill at the bottom of each card.
- Rough layout per card: tier name (sm bold) → price (xl bold primary) → 1-line tagline → "Choose plan" button.

---

## 4. Link tier cards to the real subscription / signup flow

Each compact card becomes clickable / has a "Choose plan" button that navigates to:

```
/auth?mode=company&tab=signup&tier=<starter|connect|performance|command>
```

(Mapping: Core→starter, Boost→connect, Pro→performance, Elite→command — matches `selectedTier` in `Auth.tsx`.)

Also, in `Auth.tsx`, add a small `useEffect` that reads the `tier` query param and pre-selects `selectedTier` on mount so the card lands the user on the correct plan in the signup form.

---

## 5. Pass industry into demo signup + email the credentials

### 5a. Industry → demo (already mostly done)

`StartDemoDialog` already sends `industry: industryId` to `create-demo-trial`, and the edge function already seeds appointments / leads / colors / service area per industry. I'll verify the dialog is opened from the Final CTA / Hero and confirm the current `industry` query param is what flows through.

### 5b. Email the demo links so the prospect can open them on desktop + mobile

Update `supabase/functions/create-demo-trial/index.ts`:

- After successfully creating the company + 3 users, send a Resend email to the prospect's `email` containing:
  - Industry label + business name confirmation
  - The 3 logins (Owner, Technician, Customer) with email + shared demo password
  - One-click sign-in links to `https://auraintercept.ai/auth?demo=1&u=<encoded-email>` for each role
  - A QR code link / mobile-friendly note: "Open this email on your phone to test the technician + customer mobile experience"
  - Expiry timestamp (48h)
  - Aura Intercept branded HTML template
- Use existing `RESEND_API_KEY` secret (already used by other edge functions).
- Send is best-effort — if Resend fails the demo still launches; we just log the failure and surface a toast: "Demo ready. We couldn't email a copy — credentials are shown above."

### 5c. Visible confirmation in the dialog

In `DemoCredentialsCard`, add a small line: "✉️ A copy was emailed to <email> so you can open the demo on your phone too."

---

## Files to edit

- `src/pages/ForBusiness.tsx` — compact pricing grid + Choose-plan links to `/auth`.
- `src/components/marketing/IndustryDropdownPicker.tsx` — bold/underlined cyan group labels, hide "Other" group.
- `src/lib/industryMarketingContent.ts` — drop the `Other` entry from `INDUSTRY_GROUPS` (keep `INDUSTRY_CONTENT.other` as fallback).
- `src/components/common/LanguageToggle.tsx` — add tooltip clarifying scope.
- `src/components/dashboard/DashboardLayout.tsx` (and any console header that renders `LanguageToggle`) — hide the toggle inside the dashboard.
- `src/pages/Auth.tsx` — read `?tier=` query param and pre-select the matching plan.
- `src/components/marketing/DemoCredentialsCard.tsx` — add "emailed a copy" confirmation line.
- `supabase/functions/create-demo-trial/index.ts` — send Resend email with the 3 logins after provisioning.

## Out of scope (this loop)

- Full Spanish translation of consoles, AI Operatives, Ask Aura responses (large separate initiative — can plan next).
