

## Smart Links in Voice Chat (ElevenLabs + Browser Voice)

### Problem
Currently, the AI agents in voice chat have no tool to look up and share smart links. The `getSmartLinkForIntent` function exists in the backend but is only triggered passively through the `contextual_sharing` protocol mode (keyword detection). The AI cannot proactively fetch and share a link when a customer asks for one, or as a fallback when scheduling is unavailable.

### Solution
Add a `get_smart_link` tool to the triage and booking agents so they can actively fetch and share relevant smart links. Update the voice chat frontends to render links as clickable elements. Update agent prompts to use this tool when:
1. A customer explicitly asks for a link (e.g., "Can you send me your booking link?")
2. The company doesn't have scheduling/services configured, so the AI offers a smart link instead of the booking flow

### Changes

**1. Backend: `supabase/functions/ai-agent-chat/index.ts`**

- **Add `get_smart_link` tool definition** to both the `triage` and `booking` entries in `AGENT_TOOLS`:
  ```
  name: 'get_smart_link'
  description: 'Look up a smart link for the company by category (booking, payment, review, quote, menu, website, etc). Use when customer asks for a link or when scheduling is not available.'
  parameters: { category: string (required), search_term: string (optional) }
  ```

- **Add tool execution** in `executeAgentTool` that calls the existing `getSmartLinkForIntent()` function and returns the link URL, name, and description.

- **Update triage prompt** (~line 98-185): Add instruction:
  - "If no services are configured for online booking, use the `get_smart_link` tool with category 'booking' to offer the customer a direct scheduling link instead."
  - "When a customer asks to 'send me a link' or 'share the booking page', use `get_smart_link` with the relevant category."

- **Update booking prompt** (~line 187+): Add similar fallback instruction for when services list is empty.

- **Update `contextual_sharing` prompt** (~line 3358-3370): Remove the misleading instruction about "scheduling link for booking" that causes hallucination, and instead reference the new tool.

**2. Frontend: Transcript Link Rendering**

- **`src/components/ai/AIAgentConsole.tsx`** (~line 1036): Update the transcript message bubble to detect URLs in the AI response text and render them as clickable `<a>` tags (target="_blank"). This ensures links the AI shares are tappable in the text transcript area.

**3. ElevenLabs Voice**
- No changes needed to `VoiceChat.tsx` client tools -- the `get_smart_link` tool is server-side (called by the LLM via the edge function), not a client tool. The AI will verbally tell the customer the link and it will appear in the transcript.

**4. Browser Voice**
- No changes needed to `useBrowserVoiceChat.ts` -- it already routes through `ai-agent-chat`, so it gets the same tool access automatically.

### Expected Behavior

| Scenario | Before | After |
|----------|--------|-------|
| Customer asks "send me your booking link" | AI hallucinates or ignores | AI calls `get_smart_link(category: 'booking')`, shares the URL |
| No services configured, customer wants to book | AI says "no services available, call us" | AI fetches booking smart link as fallback and shares it |
| Customer asks for payment/review link | Only works if contextual_sharing keyword triggers | AI proactively uses `get_smart_link` tool |

### Technical Details

- The `get_smart_link` tool reuses the existing `getSmartLinkForIntent()` function -- no new database queries needed
- Links in voice mode are spoken aloud ("Here's our booking page: ...") and appear in the transcript as clickable text
- The tool returns a structured response: `{ found: true, url, name, description }` or `{ found: false, message }` so the AI can respond gracefully if no link is configured

