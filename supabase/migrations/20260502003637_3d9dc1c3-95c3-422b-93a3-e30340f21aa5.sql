-- Phase 6 task 2: Backfill canonical channel keys (voice/sms/chat/dispatch/billing/aura)
-- in industry_template_packs.agent_prompt_deltas. The runtime injector
-- (supabase/functions/_shared/industry-pack.ts) normalizes agent IDs to these
-- canonical keys; without them voice/SMS/chat/dispatch/billing all fall back
-- to a generic prompt. We derive each new key from the existing 'triage'
-- (front-line persona) and 'follow_up' (post-job billing) deltas so prompt
-- quality stays consistent and per-industry.

UPDATE public.industry_template_packs
SET agent_prompt_deltas = agent_prompt_deltas
  || jsonb_build_object(
       'voice',    COALESCE(agent_prompt_deltas->>'voice',    agent_prompt_deltas->>'triage'),
       'sms',      COALESCE(agent_prompt_deltas->>'sms',      agent_prompt_deltas->>'triage'),
       'chat',     COALESCE(agent_prompt_deltas->>'chat',     agent_prompt_deltas->>'triage'),
       'dispatch', COALESCE(agent_prompt_deltas->>'dispatch', agent_prompt_deltas->>'triage'),
       'billing',  COALESCE(agent_prompt_deltas->>'billing',  agent_prompt_deltas->>'follow_up'),
       'aura',     COALESCE(agent_prompt_deltas->>'aura',     agent_prompt_deltas->>'triage')
     )
WHERE agent_prompt_deltas ? 'triage';
