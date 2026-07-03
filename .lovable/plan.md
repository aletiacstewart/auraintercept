# Wire Contact form + Audit PDF into `landing-capture-lead`

Both claims verified: `Contact.tsx` only `console.log`s; `AuditResults.tsx` streams the PDF with zero capture. `landing-capture-lead` exists.

## Fix 1 — `src/pages/Contact.tsx`

Replace the stubbed `onSubmit` with a real `supabase.functions.invoke('landing-capture-lead', ...)` call:

- Body: `{ name, email, phone: phone || undefined, industry: service_interest || undefined, notes: company_name ? "Company: ${company_name}\n\n${notes}" : notes, source: 'contact_page' }`.
- On error → destructive toast, keep form values.
- On success → existing "Message Received!" toast + `form.reset()`.
- Handle 429 rate-limit response with a friendly "Please wait a moment and try again" message (the function returns `{ error }` on 429; branch on that string).
- Add `import { supabase } from '@/integrations/supabase/client'` if missing.

## Fix 2 — `src/components/audit/AuditResults.tsx`

Gate the existing `PDFDownloadLink` behind a small inline name+email capture. Audit results themselves stay unauthenticated/ungated — only the PDF export is gated.

- New state: `leadCaptured`, `captureName`, `captureEmail`, `isCapturing`.
- `handleCaptureAndDownload`: invokes `landing-capture-lead` with `{ name: captureName, email: captureEmail, industry: industryId ?? undefined, notes: 'Completed the Free AI Opportunity Audit and downloaded the PDF report.', source: 'opportunity_audit' }`. On success → `setLeadCaptured(true)`. On error → log + still unlock (don't block value delivery over a backend hiccup), but show a toast noting delivery may be delayed. On 429 → keep form open, show rate-limit toast, do NOT unlock.
- Use the existing `industryId` prop (Claude's `selectedIndustry` name doesn't exist here).
- Client-side validation: trimmed non-empty name (≤100), valid email (≤255) using a small zod schema so behavior matches the server. Disable button while invalid or `isCapturing`.
- Replace the `PDFDownloadLink` block:
  - If `!leadCaptured`: render inline card with Name input, Email input, and "Unlock My Checklist" button.
  - If `leadCaptured`: render the existing `PDFDownloadLink` unchanged.
- Copy stays consistent with the "no signup required to view results" promise — capture copy is scoped to the PDF: "Enter your details to download your personalized setup checklist."

## Explicitly out of scope

- Team notifications on new leads (flagged as follow-up in the source prompt).
- Removing the phantom `send-walkthrough-demo` reference in `supabase/config.toml` — separate cleanup.
- Any changes to `landing-capture-lead` itself.

## Acceptance

- Contact form submit → new `leads` row `source='contact_page'`, `intent='demo_request'`.
- Invalid email in Contact form → server validation rejects; UI shows destructive toast.
- Audit results screen shows on-screen findings without capture.
- PDF section shows name/email inputs; on submit → new `leads` row `source='opportunity_audit'`, then `PDFDownloadLink` renders and the user can download.
- Rate-limit (429) on either form → friendly toast, form remains usable, no broken UI.
