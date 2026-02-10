

# Fix: Use `params.static_greeting` for Custom Greeting

## The Problem

We put the greeting in `prompt.first_message`, but that is **not a valid SignalWire SWML field**. SignalWire silently ignores it and generates its own generic greeting from the LLM.

The correct SWML parameter is `params.static_greeting` -- documented at [developer.signalwire.com/swml/methods/ai/params](https://developer.signalwire.com/swml/methods/ai/params/).

## The Fix

In `supabase/functions/voice-handler/index.ts`, move the greeting from `prompt.first_message` to `params.static_greeting`:

**Remove** from the `prompt` object (line 153):
```
first_message: greeting,
```

**Add** to the `params` object (around line 161):
```
static_greeting: greeting,
```

The resulting SWML `ai` block will look like:

```text
ai:
  prompt:
    text: <system prompt>
    temperature: 0.7
  params:
    static_greeting: "Hello! I'm Aura, your AI Intercept Agent..."
    end_of_speech_timeout: 3000
    attention_timeout: 25000
    ...
```

## What This Changes

| Before | After |
|--------|-------|
| Generic "Hello, how can I help you" | Your custom Aura greeting from the database |
| `prompt.first_message` (ignored by SignalWire) | `params.static_greeting` (official SWML parameter) |

## No Other Changes

Single field move. Everything else (prompt, services, voice fallback, SWAIG tools) stays the same.

