## Problem

In the floating "Message Aura" widget, the top section (Aura avatar, "Talk to Aura" button, phone CTA, "Message Aura" header, demo video bubble) consumes the full 720px panel height. The parent wrapper uses `overflow-y-auto`, so the inner `LandingAIChat` (message list + composer) gets pushed below the visible area and the user has to scroll the whole panel just to see the input.

## Fix (single file: `src/components/landing/FloatingChatWidget.tsx`)

1. Remove `overflow-y-auto` from the inner column wrapper and convert it to a strict flex column (`flex-1 min-h-0 flex flex-col`) so the chat region claims real height instead of overflowing.
2. Wrap the top "AuraAvatarChat + Call Aura's Mobile" block in a `shrink-0` container so it stays a fixed-height header.
3. Give the `LandingAIChat` wrapper `flex-1 min-h-0` so its internal `ScrollArea` (messages) actually has room to render and scroll inside the panel.
4. Make the avatar header more compact in this embedded context: pass a `compact` prop to `AuraAvatarChat` (inline variant) that reduces the avatar size and removes the large vertical padding so it doesn't dominate the panel. If adding a prop is out of scope, instead constrain the header block with `max-h-[280px] overflow-hidden` and shrink the avatar via CSS class override.
5. Keep the bottom "Report Issue" footer as `shrink-0` (already is, just confirm).

No business logic, no changes to LandingAIChat, AuraAvatarChat internals (other than honoring the new `compact` flag if we add it), or any other surface.

## Verification

- Open homepage → click the floating Aura button.
- Confirm the message list, composer input, mic, and send button are visible without scrolling the panel.
- Send a message → reply streams inside a scrollable message area, header stays fixed, composer stays pinned at the bottom.
- Click "Watch demo" → video appears inside the scrollable message area, not pushing the input off-screen.
- Resize viewport down to ~700px tall → panel respects `max-h-[85vh]`, chat remains usable.