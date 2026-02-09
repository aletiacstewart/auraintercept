

## Move Save Button to Bottom of All Settings

### Problem
The "Save Settings" and "Reset to Defaults" buttons are currently inside the "AI Agent Behavior" card. The "Call & SMS Scripts" card below it has no save button, which is confusing -- users may not realize the save button above also saves script changes.

### Solution
Remove the save/reset buttons from inside the "AI Agent Behavior" card and place them at the very bottom of the page, after the "Call & SMS Scripts" card and "Voice Cloning" card. This makes it clear that one Save button covers all settings.

### Changes

**File: `src/components/ai/AIAgentSettings.tsx`**

1. Remove the action buttons block (Reset + Save) from inside the "AI Agent Behavior" CardContent (lines 808-834 area)
2. Add the same Save/Reset buttons at the bottom of the component, after the VoiceCloningCard, as a standalone sticky or static footer bar

The resulting layout will be:
```text
[TTS Provider Settings]
[ElevenLabs Voice Settings]
[AI Agent Behavior]          <-- no buttons inside
[Call & SMS Scripts]         <-- no buttons inside
[Voice Cloning]
[Reset to Defaults] [Save Settings]   <-- single bottom bar
```

Only one file is modified: `src/components/ai/AIAgentSettings.tsx`.
