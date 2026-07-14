// Client re-export of the canonical Aura Intercept sales persona.
//
// The actual prompt text (and its pricing lines, which are derived from
// `supabase/functions/_shared/launch-pricing.ts`) lives in
// `supabase/functions/_shared/aura-intercept-sales-prompt.ts` so that Message
// Aura (edge) and Talk to Aura (ElevenLabs paste via admin button) always
// quote identical numbers.
//
// DO NOT duplicate prompt content or pricing here — edit the shared file.
export {
  AURA_INTERCEPT_TEXT_PROMPT,
  AURA_INTERCEPT_VOICE_PROMPT,
} from '../../supabase/functions/_shared/aura-intercept-sales-prompt';