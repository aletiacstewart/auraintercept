

# Fix: Add First Message (Greeting) to SWML Document

## The Bug

In `voice-handler/index.ts` line 117, the greeting is loaded from the database:
```typescript
const greeting = company?.ai_voice_greeting || `Thank you for calling ${companyName}. How can I help you today?`;
```

But it is **never passed** into the SWML document built on lines 143-270. The `ai` block has no `first_message` property, so SignalWire defaults to a generic "Hello, how can I help you."

## The Fix

Add the greeting as `prompt.first_message` inside the `ai` block of the SWML document (around line 151):

```typescript
ai: {
  prompt: {
    text: systemPrompt,
    temperature: 0.7,
    first_message: greeting,   // <-- ADD THIS
  },
  ...
}
```

This single addition will make the AI agent answer with your custom Aura Intercept greeting instead of the generic one.

## No Other Changes Needed

- The prompt (with services, phone rules, booking flow) is already loading correctly
- The Rachel voice fallback is working
- The SWAIG argument parsing is fixed
- This is just the missing greeting line
