## Goal

Merge `/talk-to-aura` into `/contact`. Embed the voice consultation experience inline on the Contact page (replacing the "Talk to Aura" navigate-button card), and redirect `/talk-to-aura` to `/contact` so existing links still work.

## Changes

### 1. `src/pages/Contact.tsx`
Replace the two "navigate elsewhere" cards (Talk to Aura voice card + Message Aura text card) with the actual Talk-to-Aura content from `TalkToAura.tsx`. Specifically, in the right column under Contact Information add:

- **Schedule by Phone** card (amber-styled phone CTA, `512-737-2424` / `512-REP-AiAi`, Call Now button, business hours) — this currently overlaps with the existing Contact Information card; keep the simple Phone row in Contact Information and add the larger amber "Call Now" CTA card from TalkToAura since it serves a different purpose (highlight scheduling).
- **Talk to Aura (Voice)** card — full `<VoiceChat companyId={AURA_COMPANY_ID} companyName="Aura Intercept" />` with terms-of-service checkbox gate, "Switch to text/voice mode" toggle, walkthrough-demo tip, and live transcript scroll area. Keep the same Aura tenant UUID (`04c57cbe-358e-4036-a3ad-b777a55f5be0`) and component wiring from TalkToAura.
- **What to Expect** checklist card (5 bullets: personalized demo, business needs discussion, custom pricing, implementation timeline, Q&A).

Drop the old "Talk to Aura (Voice)" card that navigates to `/talk-to-aura` and the "Message Aura (Text)" card that opens FloatingChatWidget. The site-wide FloatingChatWidget (Sparkles bubble) already provides the text-chat option, so removing the duplicate `showChat` state + bottom-mounted FloatingChatWidget on this page is fine; do not introduce a second floating bubble.

Add the relevant imports: `VoiceChat`, `Checkbox`, `Label`, `ScrollArea`, `cn`, `Link`, `Shield`, `Clock`, `CheckCircle2`, `Calendar`. Add local state for `termsAgreed`, `useTextMode`, `transcript`, and a `handleTranscript` callback (same shape as TalkToAura).

Style adjustments: keep the existing Contact page light/PublicHeader theme — do not bring the dark `bg-slate-900` gradient from TalkToAura. Use the existing `Card`/`bg-card` styling for the new cards so they blend with the rest of the Contact page, and use semantic tokens (`text-primary`, `bg-primary/10`, `text-amber-600` etc.) instead of the slate palette.

Update the SEO description to mention voice consultation.

### 2. `src/App.tsx`
Replace the `/talk-to-aura` route element so it redirects to `/contact` (using `<Navigate to="/contact" replace />`). Remove the `TalkToAura` import. Preserve the route so old inbound links/SMS demo links don't 404.

### 3. `src/pages/TalkToAura.tsx`
Delete the file (no longer reachable, and content lives on `/contact` now).

### 4. Other references
- `src/lib/auditFindings.ts`, `src/components/documentation/MarketingSalesMasterPDF.tsx`, `src/components/admin/ElevenLabsToolChecklist.tsx`: leave URL strings alone since `/talk-to-aura` still resolves (now redirects to `/contact`). No change needed.

## Out of scope

- VoiceChat component internals, ElevenLabs agent wiring, walkthrough-demo edge function.
- Sparkles floating chat bubble (already global on the landing pages).
- Public header/footer.

## Verification

- `/contact` shows form on the left and Contact Info + Schedule by Phone + Talk to Aura voice (with terms gate, transcript, text-mode toggle) + What to Expect + CTA on the right.
- `/talk-to-aura` URL redirects to `/contact`.
- No duplicate floating chat bubble on `/contact`.
- No TypeScript errors from the removed import/file.
