

# Update ElevenLabs Setup Guides to Match New Dashboard UI

## Problem

The ElevenLabs dashboard has updated its "Turn-taking" settings panel to a new "Conversational behavior" section with different controls. Our setup guides reference outdated terminology like "End of Speech Detection slider" and "Interruption Sensitivity" which no longer exist in the dashboard, causing confusion for users trying to configure their agents.

## New Settings (from screenshots)

The updated ElevenLabs dashboard now has:

| Old Setting | New Setting | Recommended Value |
|---|---|---|
| End of Speech Detection (slider) | **Eagerness** (dropdown) | **Patient** |
| Interruption Sensitivity | Replaced by Eagerness | N/A |
| (new) | **Spelling patience** | **Auto** |
| (new) | **Speculative turn** | **Off** |
| (new) | **Take turn after silence** | **20 seconds** |
| (new) | **End conversation after silence** | **20 seconds** |
| (new) | **Soft timeout** | **8 seconds** with message |
| (new) | **LLM cascade timeout** | **15 seconds** |

## Changes

### 1. `src/components/integrations/ElevenLabsSetupGuide.tsx`

**Step 2.5 "Configure Conversation Timing"** -- Replace the three current settings cards (End of Speech Detection, Interruption Sensitivity, Response Speed) with the new settings:

- Update the location reference from "Voice tab -> Turn-taking section" to "Agent Settings -> Conversational behavior"
- Replace "Setting 1: End of Speech Detection = 4000ms" with "Setting 1: Eagerness = Patient"
- Replace "Setting 2: Interruption Sensitivity = Low" with "Setting 2: Spelling patience = Auto"
- Add "Setting 3: Take turn after silence = 20 seconds"
- Add "Setting 4: End conversation after silence = 20 seconds"
- Add "Setting 5 (Optional): Soft timeout = 8 seconds" with the recommended message
- Update the troubleshooting alert text to reference "Eagerness" instead of "End of Speech Detection"

### 2. `src/components/integrations/ElevenLabsVoiceSetupGuide.tsx`

**Step 4 "Create Conversational Agent"** -- Update the critical timing settings warning:

- Replace "End of Speech Detection to 4000ms and Interruption Sensitivity to Low" with "Eagerness to Patient and Spelling patience to Auto"

### 3. `src/components/settings/AuraIntelligenceSettings.tsx`

No prompt content changes needed -- the system prompt instructions ("WAIT for their complete answer") remain valid regardless of dashboard UI changes. However, if there are references to specific dashboard setting names in comments, those will be updated.

## What stays the same

- All system prompt text (AGENT_PROMPT and generateElevenLabsPrompt) -- these are about agent behavior, not dashboard settings
- Tool configurations and webhook URLs
- No database changes
- No new dependencies

