## Goal

The landing page currently renders two floating launchers in the bottom-right corner:

- `FloatingChatWidget` (MessageCircle bubble) → opens the "Message Aura" text chat (`LandingAIChat`).
- `AuraAvatarFloating` (Sparkles bubble) → opens the "Talk to Aura" voice avatar (`AuraAvatarChat`).

Collapse these into a **single Sparkles bubble** that opens **one panel** containing both surfaces — the avatar (so users can still tap "Talk to Aura" to start a live voice call) and the text chat below it.

## Changes

### 1. `src/components/landing/FloatingChatWidget.tsx`
- Swap the bubble icon from `MessageCircle` to `Sparkles` (lucide-react). Keep the existing cyan gradient, size, pulse animation, and X-when-open behavior.
- In the open panel (non-multi-agent path, i.e. the public landing), render the `AuraAvatarChat` (variant `inline`, no internal close button) above the existing `LandingAIChat`. Wrap them in a scrollable column so the panel stays within its `h-[620px]` envelope:
  ```
  ┌─ Panel ──────────────────┐
  │ Close X                   │
  │ [ AuraAvatarChat inline ] │  ← avatar + Talk to Aura button
  │ ─────────────────────────│
  │ [ LandingAIChat ]         │  ← Message Aura header + chat
  │ Report Issue footer       │
  └──────────────────────────┘
  ```
- Slightly increase panel height (e.g. `h-[720px]`, capped with `max-h-[85vh]`) so the avatar + chat fit without internal clipping on the landing page. Keep `w-[400px]`.
- Multi-agent path (`useMultiAgent && (companyId || companySlug)`) is unchanged — it still renders `UnifiedCustomerConsole` only, since that path is for embedded company widgets where the avatar isn't part of the experience.

### 2. `src/pages/Index.tsx`
- Remove the `AuraAvatarFloating` import and its `<AuraAvatarFloating />` render at line 1214. The merged `FloatingChatWidget` covers both surfaces.

### 3. `src/components/aura/AuraAvatarFloating.tsx`
- Leave the file in place (other pages may still use it later); just stop rendering it on the landing. No edits needed unless a follow-up asks to delete it.

## Out of scope

- No changes to `AuraAvatarChat` internals, the `send-walkthrough-demo` flow, `LandingAIChat`, or any dashboard/console embeds of the avatar.
- No changes to the multi-agent embedded customer widget path.
- No copy changes to "Message Aura" / "Talk to Aura" headings inside the panel.

## Verification

- Landing page bottom-right shows exactly one bubble with the Sparkles icon.
- Clicking it opens one panel with the Aura avatar on top (Talk to Aura button works) and the Message Aura text chat below.
- Clicking X or the bubble again closes the panel.
- No regressions on dashboard pages that still use `AuraAvatarChat` directly.
