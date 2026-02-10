

# Fix: Shorten Greeting + Unify Config for Easy Onboarding

## What's Actually Happening

Both phone and web **already use ElevenLabs**. The phone path correctly generates audio with the Jessica voice via ElevenLabs TTS. The problem is that your company's `ai_voice_greeting` in the database is still a 241-character monologue:

> "Hello! I'm Aura, your AI Intercept Agent. Before we dive in, could you please provide your name and a piece of contact info -- like an email or phone number -- just in case our connection drops? Perfect, thanks. Now, how can I assist you today?"

This entire block plays as one audio file before the system starts listening. It asks for everything at once and even says "Perfect, thanks" before the caller has spoken.

## The Fix (Two Parts)

### Part 1: Shorten the database greeting

Update your company's `ai_voice_greeting` to a short, simple greeting:

> "Hello! I'm Aura, your AI Intercept Agent. How can I help you today?"

The sequential data collection (name, phone, email) is already handled by the AI model in follow-up turns -- it should not be in the greeting.

### Part 2: Add a code safeguard to prevent future long greetings

Update `handleIncoming()` in the voice-handler so that if any company's greeting exceeds 150 characters, it automatically gets replaced with a short default. This protects against the same problem when onboarding new companies.

## Technical Details

### Database change
- Update `companies.ai_voice_greeting` for company `04c57cbe-358e-4036-a3ad-b777a55f5be0` to: `"Hello! I'm Aura, your AI Intercept Agent. How can I help you today?"`

### Code change: `supabase/functions/voice-handler/index.ts`
- In `handleIncoming()` (lines 165-166), after reading the greeting, add a length check:
  - If the greeting exceeds 150 characters, replace it with a short default
- This is a small safeguard (3-4 lines of code)

### What you should also do (manual step)
- In your ElevenLabs dashboard, update the "First message" field to match the short greeting. This keeps the web voice agent consistent with the phone experience.

## Why This Matters for Onboarding

When a new company signs up, the system already reads their ElevenLabs API key and voice ID from `tenant_integrations`. The greeting comes from `companies.ai_voice_greeting`. With the length safeguard in place, even if someone pastes a long greeting, the phone system will automatically shorten it. This means onboarding is simple: just add the API key, voice ID, and a short greeting -- both web and phone will work with ElevenLabs automatically.
