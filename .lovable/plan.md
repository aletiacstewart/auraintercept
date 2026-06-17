## Goal
When a visitor uses the **Message Aura** floating chat on the public marketing site (homepage, Smart Website, Company Blog), Aura can play the uploaded `AI_Main.mp4` walkthrough video inline in the chat — either automatically when the visitor asks for more info, or anytime via a persistent "Watch demo" button.

Scope: public marketing chat only (FloatingChatWidget → LandingAIChat). No changes to in-app Aura, customer portal, voice agent, edge functions, or pricing.

## Changes

### 1. Upload the video to the CDN
- Run `lovable-assets create --file /mnt/user-uploads/AI_Main.mp4 --filename aura-walkthrough.mp4 > src/assets/aura-walkthrough.mp4.asset.json`
- Pointer is imported in code; binary stays out of the repo.

### 2. Extend chat message model (`src/components/landing/LandingAIChat.tsx`)
- Add an optional `videoUrl?: string` field to the local `Message` type so an assistant bubble can carry a video.
- Add a helper `appendDemoVideoMessage()` that pushes an assistant message:
  - `content`: "Here's a quick 60-second walkthrough of how Aura works. Want me to answer any specific questions after?"
  - `videoUrl`: the CDN URL from the asset pointer.

### 3. Persistent "Watch demo" button
- In the chat header (next to "Message Aura"), add a small ghost button with a Play icon labeled **"Watch demo"**.
- Clicking it calls `appendDemoVideoMessage()` (no LLM call, instant). Disabled while a video bubble is already the most recent assistant message to avoid spamming.

### 4. Auto-detect intent on user input
- In `handleSubmit`, before calling `streamChat`, run a lightweight regex against the trimmed user input:
  - Pattern (case-insensitive): `/(watch|show|see|play).*(demo|video|walkthrough)|more info(rmation)?|tell me more|how does (it|aura) work|can i see|show me/`
- If matched AND the last assistant message does not already contain a video, call `appendDemoVideoMessage()` first, then still send the user's message to the LLM so Aura also replies in text.

### 5. Render inline video bubble
- In the messages map, when `message.videoUrl` is present, render the text paragraph followed by a `<video>` element:
  - `src={message.videoUrl}` `controls` `playsInline` `muted` `autoPlay` `preload="metadata"`
  - Styled inside the existing white assistant bubble: `w-full rounded-md mt-2 max-h-[260px] bg-black`
  - Wrapped at `max-w-[85%]` like other bubbles, with rounded corners and shadow.
- Falls back gracefully (controls visible) if autoplay-muted is blocked.

### 6. No other surfaces touched
- `AuraAvatarChat`, voice chat, edge functions, system prompts, in-app Aura, customer portal — unchanged.

## Technical notes
- Asset URL accessed via `import auraWalkthrough from '@/assets/aura-walkthrough.mp4.asset.json'` then `auraWalkthrough.url`.
- Autoplay uses `muted` to satisfy browser autoplay policies; user can unmute via native controls.
- Intent regex is intentionally narrow to avoid surprise video popups; the explicit button covers the rest.
- No new dependencies, no DB migrations, no edge function changes.

## Verification
- Open homepage → click floating Aura button → header shows "Watch demo" → click plays video inline, muted, with controls.
- Type "show me a demo" or "tell me more" → video bubble appears, then Aura's text reply streams in below.
- Type a normal question (e.g. "what's pricing?") → no video, just text reply.
- Reload, repeat in the Smart Website and Company Blog floating widgets (same component) — works identically.
