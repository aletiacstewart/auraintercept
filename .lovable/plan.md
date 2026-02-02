
# Rename "Talk to Aura" to "Ask Aura" in Quick Setup

## Overview
Simple text change to align with the platform's naming standards where "Ask Aura" is the internal staff-only voice navigation tool.

---

## Change Required

**File:** `src/pages/Settings.tsx`

**Line 75:** Change `Talk to Aura` → `Ask Aura`

```typescript
// Before
<TabsTrigger value="voice" className="flex items-center gap-1">
  <Mic className="w-3 h-3" />
  Talk to Aura
</TabsTrigger>

// After
<TabsTrigger value="voice" className="flex items-center gap-1">
  <Mic className="w-3 h-3" />
  Ask Aura
</TabsTrigger>
```

---

## Naming Standards Reference
- **Ask Aura** = Internal staff-only voice navigation (this setting)
- **Talk to Aura (Voice)** = Customer-facing speech feature (ElevenLabs/Twilio)
- **Message Aura (Text)** = Customer-facing text chat
