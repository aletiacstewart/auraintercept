UPDATE public.industry_template_packs
SET extra_operatives = '["style_consultant","loyalty_coach","review_responder","calendar_optimizer"]'::jsonb,
    min_tier_per_extra = '{}'::jsonb
WHERE industry_id = 'salon';