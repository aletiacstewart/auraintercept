
-- 1. SaaS Platform industry pack (cluster = 'booking')
INSERT INTO public.industry_template_packs (
  industry_id, cluster, label, icon, description,
  job_templates, terminology, kb_seed_documents, is_active
) VALUES (
  'saas_platform',
  'booking',
  'SaaS Platform',
  'Cpu',
  'AI receptionist & operations platform for service businesses.',
  '[
    {"name": "Platform Demo", "duration_minutes": 30, "category": "Sales"},
    {"name": "Onboarding Call", "duration_minutes": 60, "category": "Onboarding"},
    {"name": "Technical Support", "duration_minutes": 30, "category": "Support"},
    {"name": "Billing Question", "duration_minutes": 15, "category": "Billing"},
    {"name": "Integration Setup", "duration_minutes": 60, "category": "Onboarding"},
    {"name": "Custom Quote", "duration_minutes": 30, "category": "Sales"},
    {"name": "Strategy Review", "duration_minutes": 45, "category": "Success"}
  ]'::jsonb,
  '{
    "customer_singular": "company",
    "customer_plural": "companies",
    "appointment_singular": "demo call",
    "appointment_plural": "demo calls",
    "technician_singular": "solutions engineer",
    "technician_plural": "solutions engineers",
    "service_area": "industries served",
    "lead_singular": "prospect",
    "lead_plural": "prospects"
  }'::jsonb,
  '[
    {
      "name": "Aura Intercept Platform Overview",
      "content": "Aura Intercept is an AI receptionist and operations platform built for service businesses. We answer every inbound call, text, and chat 24/7, book appointments, capture leads, dispatch technicians, follow up on quotes, and run your marketing — all powered by 24 specialized AI operatives. Companies onboard in under an hour and start booking jobs the same day.",
      "faqs": [
        {"question": "What is Aura Intercept?", "answer": "Aura Intercept is an AI-powered receptionist and operations platform that answers calls, books appointments, captures leads, dispatches technicians, and runs marketing for service businesses — 24/7, in any industry.", "category": "general"},
        {"question": "How long does onboarding take?", "answer": "Most companies are live in under an hour. Pick your industry, configure your business hours and service catalog, and your AI agents are ready to answer the next call.", "category": "onboarding"}
      ]
    },
    {
      "name": "Pricing & Tiers",
      "content": "Aura Intercept offers four tiers, each with a 90-day free trial (no credit card required):\n\n- Core ($197/mo): AI front desk, lead capture, booking, follow-up, reviews, web presence, marketing — 8 agents.\n- Boost ($497/mo): Adds dispatch, route, ETA, and check-in operatives — 12 agents.\n- Pro ($997/mo): Adds quoting, invoicing, social scheduling, social analytics, campaign automation — 18 agents.\n- Elite ($1,997/mo): All 24 agents including inventory, insights, performance, revenue, and forecasting.\n\nAll voice minutes, SMS, email, and search are bundled — no per-message fees.",
      "faqs": [
        {"question": "Is there a free trial?", "answer": "Yes — every tier includes a 90-day free trial with no credit card required. You only pay if you decide to keep it after day 90.", "category": "billing"},
        {"question": "Can I cancel anytime?", "answer": "Yes. There are no long-term contracts. Cancel from the billing page and your service ends at the end of the current period.", "category": "billing"},
        {"question": "Are there extra fees for SMS, voice, or email?", "answer": "No. All third-party usage (SignalWire voice and SMS, ElevenLabs TTS, Resend email, Tavily search) is bundled into your tier price. No surprise carrier fees.", "category": "billing"}
      ]
    },
    {
      "name": "Integration Guide",
      "content": "Aura Intercept ships with bundled integrations that work out of the box:\n\n- Voice & SMS: SignalWire — your AI agents answer calls and reply to texts on a dedicated business line.\n- Realistic AI voice: ElevenLabs — natural-sounding voice for every greeting and conversation.\n- Email: Resend — appointment confirmations, reminders, follow-ups, and review requests.\n- Web search: Tavily — your AI agents can look up local context, competitor info, and answer industry questions.\n- Optional: Google Calendar two-way sync, Stripe billing, social media OAuth (Facebook, Instagram, LinkedIn).\n\nNo separate accounts or API keys required for the bundled stack.",
      "faqs": [
        {"question": "Do I need a SignalWire or ElevenLabs account?", "answer": "No. Voice, SMS, AI voice, email, and search are all bundled in your tier. You only need your own account for optional integrations like Google Calendar or social media OAuth.", "category": "integrations"},
        {"question": "Can I white-label the platform?", "answer": "Elite tier includes white-label customer portal, custom domain, and brandable email/SMS templates.", "category": "general"},
        {"question": "Who owns my data?", "answer": "You do. Aura Intercept never sells, shares, or trains models on your customer data. You can export everything at any time.", "category": "general"}
      ]
    }
  ]'::jsonb,
  true
)
ON CONFLICT (industry_id) DO UPDATE SET
  label = EXCLUDED.label,
  cluster = EXCLUDED.cluster,
  description = EXCLUDED.description,
  job_templates = EXCLUDED.job_templates,
  terminology = EXCLUDED.terminology,
  kb_seed_documents = EXCLUDED.kb_seed_documents,
  is_active = true,
  updated_at = now();

-- 2. Promote the company row
UPDATE public.companies
SET
  subscription_tier = 'command',
  industry_vertical = 'saas_platform',
  primary_color = '#0EA5E9',
  secondary_color = '#A78BFA',
  is_demo = false,
  public_app_url = 'https://auraintercept.ai',
  contact_email = 'ai@auraintercept.ai',
  email = 'ai@auraintercept.ai',
  ai_voice_greeting = 'Thanks for calling Aura Intercept, the AI receptionist platform for service businesses. I can answer questions about pricing, book a live demo, or connect you with our team. How can I help today?',
  ai_agent_prompt  = 'You are the AI receptionist for Aura Intercept, an AI receptionist and operations platform for service businesses (HVAC, plumbing, roofing, real estate, restaurants, and 13+ other verticals). Your job is to answer questions about the platform, pricing (Core $197, Boost $497, Pro $997, Elite $1997, all with 90-day free trial, no credit card required), book demo calls, capture leads, and route technical questions to support. Be warm, concise, and confident. Always offer to book a 30-minute demo if the prospect is exploring. Never promise features that don''t exist.',
  updated_at = now()
WHERE id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';

-- 3. Reset workspace data
DELETE FROM public.appointments WHERE company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';
DELETE FROM public.leads        WHERE company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';
DELETE FROM public.services     WHERE company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';

-- 4. Seed SaaS-specific services
INSERT INTO public.services (company_id, name, description, duration_minutes, category, is_active, sort_order, delivery_type) VALUES
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Platform Demo',     'Live 30-minute walkthrough of Aura Intercept tailored to your industry.', 30, 'Sales',      true, 1, 'virtual'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Onboarding Call',   '60-minute guided setup of your tenant, AI agents, and integrations.',     60, 'Onboarding', true, 2, 'virtual'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Technical Support', '30-minute support session for active customers.',                         30, 'Support',    true, 3, 'virtual'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Integration Setup', 'Hands-on configuration of Google Calendar, Stripe, social, or telephony.', 60, 'Onboarding', true, 4, 'virtual'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Custom Quote',      '30-minute scoping call for multi-tenant or custom-tier needs.',           30, 'Sales',      true, 5, 'virtual'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Strategy Review',   '45-minute quarterly business review for Pro and Elite customers.',        45, 'Success',    true, 6, 'virtual'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 'Billing Question',  '15-minute call to resolve billing, plan, or invoice questions.',          15, 'Billing',    true, 7, 'virtual');

-- 5. Reset business hours (Mon–Fri 9–18)
DELETE FROM public.business_hours WHERE company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';
INSERT INTO public.business_hours (company_id, day_of_week, open_time, close_time, is_closed, hour_type) VALUES
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 0, '09:00', '18:00', true,  'office'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 1, '09:00', '18:00', false, 'office'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 2, '09:00', '18:00', false, 'office'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 3, '09:00', '18:00', false, 'office'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 4, '09:00', '18:00', false, 'office'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 5, '09:00', '18:00', false, 'office'),
  ('04c57cbe-358e-4036-a3ad-b777a55f5be0', 6, '09:00', '18:00', true,  'office');

-- 6. Refresh smart website
UPDATE public.smart_websites
SET
  is_published        = true,
  hero_headline       = 'AI receptionist for service businesses — booked solid, 24/7',
  hero_subheadline    = 'Answer every call, text, and chat with 24 specialized AI operatives. Book demos, capture leads, dispatch technicians, and run marketing — all on autopilot.',
  cta_button_text     = 'Book a 30-minute demo',
  cta_button_url      = 'https://auraintercept.ai/book/aura-intercept',
  show_services       = true,
  show_hours          = true,
  show_contact        = true,
  show_chat_widget    = true,
  show_voice_widget   = true,
  show_about_section  = true,
  show_booking_widget = true,
  booking_widget_mode = 'inline',
  about_header        = 'One platform. Every channel. Every industry.',
  about_subheader     = 'From HVAC to real estate — your AI team is ready in under an hour.',
  about_paragraph     = 'Aura Intercept replaces missed calls, late follow-ups, and after-hours voicemail with a 24/7 AI receptionist team trained on your industry. Voice, SMS, email, web chat, and search are all bundled into one transparent monthly price. 90-day free trial, no credit card.',
  contact_name        = 'Aura Intercept',
  contact_title       = 'AI Receptionist & Operations Platform',
  contact_email       = 'ai@auraintercept.ai',
  show_console_appointments = true,
  show_console_quotes       = true,
  show_console_billing      = true,
  show_console_feedback     = true,
  updated_at = now()
WHERE company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';

-- 7. Ensure platform TTS for tenant integrations
UPDATE public.tenant_integrations
SET use_platform_tts = true,
    updated_at = now()
WHERE company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';

-- 8. Seed industry pack KB explicitly (trigger may not re-fire on no-op update)
SELECT public.seed_industry_pack_kb_for_company('04c57cbe-358e-4036-a3ad-b777a55f5be0');
