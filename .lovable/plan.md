## Final Patient/Medical Terminology Scrub

After the prior healthcare deep-clean, a targeted search turned up only a handful of remaining hits in `src/` and `supabase/functions/`. The historical migrations and `src/integrations/supabase/types.ts` (auto-generated) are excluded — they cannot/should not be edited.

### Changes

1. **`src/pages/DispatchFieldOpsInstall.tsx`** (line 17)
   - Comment reads `// e.g. Patient Schedule, Shop Queue, Chair Schedule`.
   - Update to: `// e.g. Service Schedule, Shop Queue, Chair Schedule`.

2. **`src/components/settings/AuraIntelligenceSettings.tsx`**
   - Line 312: `Be patient when collecting customer information` → `Take your time when collecting customer information`.
   - Line 371: `Be conversational, patient, and natural` → `Be conversational, calm, and natural`.

3. **`src/components/integrations/ElevenLabsSetupGuide.tsx`**
   - Line 107 (script copy): `Be conversational, patient, and natural` → `Be conversational, calm, and natural`.

4. **`supabase/functions/voice-handler/index.ts`** (line 68)
   - `Be patient. Let the caller finish speaking…` → `Stay calm. Let the caller finish speaking…`.

### Intentional exceptions (NOT changed) — flagging so you can confirm

These are **literal ElevenLabs dashboard option values** that the user must select in the third-party UI. Renaming them would make our setup instructions wrong:

- `ElevenLabsVoiceSetupGuide.tsx` line 176 — `set Eagerness to Patient and Spelling patience to Auto`.
- `ElevenLabsSetupGuide.tsx` lines 236, 310 — same ElevenLabs `Eagerness: Patient` setting and `Spelling patience` field name.

Also keeping the standard legal phrase `professional, legal, medical, financial, or business advice` in `TermsOfService.tsx` — this is boilerplate liability language, not a feature reference.

### Out of scope

- `src/integrations/supabase/types.ts` — auto-generated; the `healthcare_compliance` column will disappear on its own once that field is dropped from the DB (separate migration if you want it).
- Old migration files under `supabase/migrations/` — historical record; the active healthcare data was already deleted by the newer migration.

### Confirm

Reply **go** to apply, or tell me if you also want the ElevenLabs vendor-setting references rewritten (knowing it will mismatch their dashboard UI).
