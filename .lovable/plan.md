## Goal

Eliminate every leftover reference to the 6 healthcare verticals (`dental`, `chiropractic`, `medical_office`, `veterinary`, `physical_therapy`, `optometry`) — plus aliases like `medical`, `vet`, `chiro`, etc. — across libs, dropdowns, consoles, dashboards, marketing copy, and documentation generators. Database packs/companies were already cleared in a prior pass; this pass cleans the remaining code paths.

## Scope

Confirmed clean (already removed in prior pass): `industry_template_packs`, demo companies, BusinessTypeSelector, useMultiAgentChat HIPAA logic, HealthcareIntegrationsConsole, Index/PrivacyPolicy/TermsOfService healthcare blocks, seed-demo-accounts-v2, _shared/industry-pack.

Files still containing healthcare entries to clean:

### Industry config libs (remove all 6 healthcare cases + healthcare cluster/base helpers)
1. `src/lib/industryAgentMap.ts` — delete `healthcareBase()` helper and the 6 dental/chiropractic/medical_office/physical_therapy/optometry/veterinary entries in `INDUSTRY_OVERRIDES`. Remove `Stethoscope` and `HeartPulse` imports if unused after.
2. `src/lib/industryRolePreview.ts` — drop `healthcare` from `Cluster` union, remove `healthcare` block in `CLUSTERS`, remove healthcare entries from `INDUSTRY_TO_CLUSTER`, remove `veterinary`/`dental`/`optometry` overrides in `INDUSTRY_OVERRIDES`.
3. `src/lib/industryIdAliases.ts` — delete healthcare alias block (lines 31–46) and the 6 healthcare IDs from `CANONICAL_INDUSTRY_IDS`.
4. `src/lib/industryCapabilities.ts` — drop the 6 healthcare IDs from the in-office set; remove healthcare comments.
5. `src/lib/agentStyles.ts` — delete the 6 healthcare rows in agent style map.
6. `src/lib/industryVoiceGreetings.ts` — delete the 6 healthcare greeting entries.
7. `src/lib/industryFastStartQuestions.ts` — delete the 6 healthcare question blocks.
8. `src/lib/industryHelpPrompts.ts` — remove `HEALTHCARE_*` constants and the 6 healthcare entries.
9. `src/lib/industryHelpContent.ts` — remove `HEALTHCARE_BASE`, `VETERINARY_OVERRIDE`, and the 6 keys.
10. `src/lib/industryMarketingPlaybooks.ts` — delete the 6 healthcare playbooks.
11. `src/lib/industryMarketingContent.ts` — delete the 6 healthcare `make()` blocks (the “Healthcare & Wellness” section).
12. `src/lib/industryTemplates.ts` — delete the 6 healthcare template blocks.
13. `src/lib/industryAnalyticsPresets.ts` — drop any healthcare presets if present (verify by reading).
14. `src/lib/documentationConfig.ts` — remove the “Healthcare verticals” line listing Dental/Chiropractic/etc.

### Components / pages
15. `src/components/knowledge/AIContentProfileManager.tsx` — remove the "Health & Medical" group (Medical Practice, Dental Practice, Chiropractic, Physical Therapy, Veterinary Services).
16. `src/components/documentation/IndustryMarketingKitPDF.tsx` — remove the 6 healthcare color entries + comment.
17. `src/components/integrations/RecommendedPlanCalculator.tsx` — change `'Medical, legal, or senior-focused businesses'` to remove "Medical" (use `'Legal or senior-focused businesses'`).

### Intentionally NOT changing (false positives — generic English word "patient", legal "medical/legal/financial advice" disclaimer, etc.)
- `supabase/functions/voice-handler/index.ts` ("Be patient")
- `src/components/settings/AuraIntelligenceSettings.tsx` ("be patient when collecting")
- `src/components/integrations/ElevenLabsSetupGuide.tsx`, `ElevenLabsVoiceSetupGuide.tsx` (ElevenLabs `Patient` eagerness setting — vendor terminology)
- `src/pages/TermsOfService.tsx` (legal/medical/financial advice disclaimer — standard legal language)
- `src/pages/PrivacyPolicy.tsx` (no healthcare hits, just substring match)
- `src/components/tutorial/TutorialStep.tsx` ("Intercept all clicks")
- `src/pages/DispatchFieldOpsInstall.tsx` (generic comment example mentioning "Patient Schedule" — will rewrite comment to drop it)
- `src/integrations/supabase/types.ts` (auto-generated)
- Migration files (historical, immutable record)

### Database
No additional migrations needed — packs and demo companies were already deleted, and zero healthcare rows remain (verified).

## Verification

After edits, run `rg -in "medical_office|dental|veterinar|chiropract|optometr|physical_therapy|hipaa|healthcare" src/ --glob '!types.ts'` and expect zero hits except the legal disclaimer in TermsOfService.tsx and vendor "Patient" eagerness label in ElevenLabs guides.

Reply **go** to execute.