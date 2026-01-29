
# Fix: Update Post-Call Webhook Location in Setup Guide

## Problem

The current setup guide (Step 7) shows the wrong location for configuring the post-call webhook:

**Current (Incorrect)**:
> Agent Settings → Advanced Settings → Post-call webhook URL

**Correct Location**:
> ElevenLabs Dashboard → Agents → Settings (workspace-level settings)

The post-call webhook is a **workspace-wide setting** that applies to all agents, not a per-agent setting in the Advanced tab.

---

## What Changed in ElevenLabs

According to the official documentation at `elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks`:

> "Post-call webhooks can be enabled for **all agents in your workspace** through the Agents Platform settings page."

Direct link: https://elevenlabs.io/app/agents/settings

---

## Fix Required

### File: `src/components/integrations/ElevenLabsSetupGuide.tsx`

**Update lines 544-547** to show the correct location:

| Before | After |
|--------|-------|
| Agent Settings → Advanced Settings → Post-call webhook URL | ElevenLabs Dashboard → Agents → **Settings** (workspace settings) |

### Additional Improvements

1. **Add direct link**: Include a clickable link to `https://elevenlabs.io/app/agents/settings`
2. **Clarify scope**: Note that this is a workspace-wide setting affecting all agents
3. **Add webhook type**: Specify to select "Transcription webhook" (`post_call_transcription`)

---

## Updated Content for Step 7

The location section will be updated to:

```
Location in ElevenLabs:
ElevenLabs Dashboard → Agents → Settings (gear icon)
→ Post-call Webhooks section

Select webhook type: post_call_transcription

Note: This is a workspace-level setting that applies to all your agents.
```

---

## Summary

| Change | Lines | Description |
|--------|-------|-------------|
| Fix location path | 544-547 | Update to workspace settings path |
| Add Settings link | New | Link to `elevenlabs.io/app/agents/settings` |
| Add webhook type | New | Specify `post_call_transcription` |
| Add scope note | New | Clarify this affects all agents |
