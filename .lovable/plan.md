## Goals

1. Reclaim vertical space in the floating Aura widget so the video + chat aren't cramped — put the avatar on the left and the **Talk to Aura** button on the right, in a compact horizontal header.
2. Auto-open the widget on Home (`/`), Live Demo (`/for-business`), and Free Audit (`/audit`) once per visit and have Aura greet the visitor with an opening question.

## Scope (frontend-only, presentation)

### 1. Compact header layout

`src/components/aura/AuraAvatarChat.tsx`
- Add a new variant `'compact'` (or `compactHeader` prop) that renders horizontally: avatar ~72 px on the left, name + status + **Talk to Aura** stacked on the right, no captions block, no big padding.
- Keep `'inline'`, `'hero'`, `'floating'` untouched.

`src/components/landing/FloatingChatWidget.tsx`
- Replace the header block (`max-h-[44vh] overflow-y-auto` + full inline avatar) with `<AuraAvatarChat variant="compact" />`.
- Move the **Call Aura's Mobile 484‑737‑2424** pill and the **Watch demo** button into a single thin row directly under the compact header.
- Remove the inner header scroll container; let the LandingAIChat / video region take all remaining height.
- Bump the panel height (`h-[720px] max-h-[85vh]` → `h-[640px] max-h-[88vh]`) and width (`w-[400px]` → `w-[420px]`) so the chat input + transcript sit fully visible on a 720 px viewport without inner scroll.

### 2. Auto-open + greeting on Home / Live Demo / Free Audit

`src/components/landing/FloatingChatWidget.tsx`
- Add two new optional props: `autoOpenAfterMs?: number` and `autoOpenStorageKey?: string`.
- When `autoOpenAfterMs` is set: after that delay, if `sessionStorage[autoOpenStorageKey]` is not set, call `handleOpen()` and set the key. One-shot per browser session per page key.
- When auto-opened, seed `LandingAIChat` with an initial Aura greeting message (e.g. "Hi, I'm Aura — what brought you to Aura Intercept today? Happy to answer any questions."). Add a new optional `initialGreeting?: string` prop on `LandingAIChat` and prepend it to the message list on mount when the chat is empty.

Page wiring:
- `src/pages/Index.tsx` (home): `<FloatingChatWidget autoOpenAfterMs={6000} autoOpenStorageKey="aura_autoopen_home" />`
- `src/pages/ForBusiness.tsx` (live demo): same with key `aura_autoopen_livedemo`.
- `src/pages/OpportunityAudit.tsx` (free audit): same with key `aura_autoopen_audit`. If the page doesn't currently mount `FloatingChatWidget`, add it.

## Out of scope

- No changes to voice/ElevenLabs logic, no edge-function changes, no DB migrations.
- No changes to `SmartWebsite.tsx` / `PublicFooter.tsx` widget instances (no auto-open there).
- No changes to console/dashboard code from prior turns.

## Verification

- View Home, `/for-business`, `/audit` in preview at 1280×800: widget auto-opens once after ~6 s, greeting message appears, header is compact horizontal, chat input + transcript visible without inner scroll.
- Reload the same page in the same tab → widget does **not** auto-open again (sessionStorage gate).
