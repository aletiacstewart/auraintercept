

## Fix: Add "Thinking" Audio/Visual Feedback During AI Processing

### Problem
When the AI agent processes tool calls (checking availability, creating appointments, fetching services), there are several seconds of pure silence that makes it feel like the call disconnected.

### Solution (Two-Pronged Approach)

### 1. Prompt-Level Fix (Highest Impact, Zero Risk)
Add a contextual update instruction telling the agent to always verbally acknowledge before processing a tool call. This uses the existing `sendContextualUpdate` method already in VoiceChat.tsx.

**After the date context is sent (line 173-176), add:**
```
"IMPORTANT: Before using any tool, always say a brief filler like 
'Let me check on that for you' or 'One moment while I look that up' 
so the caller knows you're still here. Never go silent."
```

This is the safest and most effective fix -- the AI will naturally fill the silence with a verbal acknowledgment before each tool call.

### 2. Visual "Processing" Indicator (Client-Side Enhancement)
Track when a client tool is actively running and show a distinct visual state on the orb/status text.

- Add an `isProcessingTool` state variable
- Set it to `true` at the start of each `clientTools` handler, `false` when it resolves
- Update the status orb to show an amber/processing color and "Processing your request..." text
- This gives visual confirmation even if the audio filler is brief

### Files Modified
- `src/components/ai/VoiceChat.tsx` -- both changes in one file

### Risk Assessment
- **Prompt injection**: None -- `sendContextualUpdate` is already used and proven stable
- **ElevenLabs SDK**: No API changes, just using existing hooks
- **Voice credits**: Minimal impact -- filler phrases are short (5-10 words)
- **Tool execution**: No change to tool logic, only wrapping with state updates
