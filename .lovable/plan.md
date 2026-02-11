

## Two Features: AI Image Generation for Content & Voice Chat Filler Responses

---

### Feature 1: AI-Generated Images for Social Media Posts and Content Engine

**Current State:** The Social Media batch wizard (`SocialBatchWizard`) and the Content Engine (`MultiChannelGenerator`) generate text-only content. The `generate-social-variations` edge function already accepts an `includeImage` parameter but never generates an actual image. No image generation infrastructure exists.

**Solution:** Use Lovable AI's image generation capability (`google/gemini-2.5-flash-image`) to generate a topic-relevant image alongside the content. This will be implemented as:

1. **New edge function: `generate-content-image`**
   - Accepts `topic`, `companyId`, and optional `style` (e.g., "professional", "social media graphic")
   - Calls the Lovable AI gateway with the image generation model (`google/gemini-2.5-flash-image`) using `modalities: ["image", "text"]`
   - Receives base64 image data, uploads it to a Supabase storage bucket (`content-images`)
   - Returns the public URL of the generated image

2. **Create storage bucket: `content-images`**
   - Public bucket for generated content images
   - RLS policies allowing authenticated users to upload/read

3. **Update `MultiChannelGenerator.tsx` (Content Engine)**
   - Add a "Generate Image" toggle/checkbox alongside channel selection
   - When enabled, call `generate-content-image` in parallel with content generation
   - Display the generated image in the results area with a download button
   - When saving to social posts or blog drafts, include the image URL

4. **Update `SocialBatchWizard.tsx` (Social Media Posts)**
   - Add a "Generate AI Image" toggle per topic or as a global setting
   - During batch generation, call `generate-content-image` for each topic that has image generation enabled
   - Display generated images in the review step (Step 3)
   - Save image URLs alongside the scheduled posts in `scheduled_social_posts`

5. **Database:** Add `image_url` column to `scheduled_social_posts` table if not already present

---

### Feature 2: Voice Chat Filler Responses During Silence

**Current State:** The phone AI (SignalWire SWML via `voice-handler`) already has filler words configured:
- `speech_fillers: ["um", "uh"]`
- `function_fillers: ["one moment", "let me check on that", "just a moment"]`
- Per-tool fillers like "Let me check our availability for you"

The web voice chat (`VoiceChat.tsx`) connects directly to ElevenLabs via `agentId` with `connectionType: "webrtc"`. It does NOT use the token flow or pass overrides. Per the project memory, client-side overrides cause immediate disconnects, so overrides cannot be used.

**The silence problem:** When the ElevenLabs agent calls client tools (via `voice-booking-agent`), there are multiple database queries (employee assignments, profiles, appointments, services) which take time. During this time, the agent is silent because ElevenLabs has no filler configuration.

**Solution:** Since we can't inject fillers via client-side overrides (they cause disconnects per project memory), we need a two-part approach:

**Part A: Speed up tool responses in `voice-booking-agent/index.ts`**
- Parallelize database queries where possible (e.g., fetch services and technician assignments simultaneously)
- Add response caching for services list (rarely changes)

**Part B: Add acknowledgment text to tool responses**
- Modify each tool response in `voice-booking-agent` to include a conversational preamble that the ElevenLabs agent will naturally speak before presenting the data
- For `get_services`: Prefix with "Here's what I found for you..."
- For `check_availability`: Prefix with "Great, let me share what's available..."
- For `create_appointment`: Prefix with "Wonderful, I've got that booked for you..."

**Part C: Add `clientTools` with immediate filler responses in `VoiceChat.tsx`**
- Instead of relying on ElevenLabs' server-side tool calls hitting `voice-booking-agent`, intercept tool calls client-side using the `clientTools` option in `useConversation`
- Each client tool immediately returns a brief "thinking" acknowledgment while the actual API call runs
- This way the agent has something to say immediately

**Implementation approach for Part C:**
- Register `clientTools` in `useConversation` for `get_services`, `check_availability`, and `create_appointment`
- Each client tool calls the `voice-booking-agent` edge function
- The tool response includes natural filler language so the agent speaks immediately

---

### Implementation Steps

1. Create `content-images` storage bucket via migration
2. Add `image_url` column to `scheduled_social_posts` if missing
3. Create `generate-content-image` edge function
4. Update `MultiChannelGenerator.tsx` with image generation toggle and display
5. Update `SocialBatchWizard.tsx` with image generation per topic
6. Update `VoiceChat.tsx` to use `clientTools` with filler responses instead of server-side tool calls
7. Optimize `voice-booking-agent` query parallelization
8. Deploy updated edge functions

### Technical Notes

- Image generation uses `google/gemini-2.5-flash-image` via Lovable AI gateway -- no external API key needed
- Generated images are uploaded to storage to avoid passing large base64 strings around
- The voice chat filler approach works within ElevenLabs SDK constraints (no client-side overrides, no token flow needed)
- The phone AI (SignalWire) already has proper fillers configured and does not need changes

