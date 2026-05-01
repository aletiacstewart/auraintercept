
-- Industry template packs: data-driven per-vertical configuration
CREATE TABLE public.industry_template_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id text NOT NULL UNIQUE,
  cluster text NOT NULL CHECK (cluster IN ('trades', 'outdoor', 'repair', 'booking')),
  label text NOT NULL,
  icon text,
  description text,
  -- Configuration payloads (all JSON for forward-compat)
  dashboard_widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  job_templates jsonb NOT NULL DEFAULT '[]'::jsonb,
  appointment_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  agent_prompt_deltas jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_operatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  min_tier_per_extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  form_schemas jsonb NOT NULL DEFAULT '{}'::jsonb,
  checklist_library jsonb NOT NULL DEFAULT '[]'::jsonb,
  kb_seed_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  terminology jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_itp_cluster ON public.industry_template_packs(cluster) WHERE is_active = true;
CREATE INDEX idx_itp_industry ON public.industry_template_packs(industry_id) WHERE is_active = true;

ALTER TABLE public.industry_template_packs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active packs (configuration data, not sensitive)
CREATE POLICY "Authenticated users can read active industry packs"
ON public.industry_template_packs
FOR SELECT
TO authenticated
USING (is_active = true);

-- Only platform admins can write
CREATE POLICY "Platform admins manage industry packs"
ON public.industry_template_packs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Public read for unauthenticated signup flow (needed to render selector cards)
CREATE POLICY "Public can read active industry packs"
ON public.industry_template_packs
FOR SELECT
TO anon
USING (is_active = true);

-- Updated-at trigger
CREATE TRIGGER set_industry_template_packs_updated_at
BEFORE UPDATE ON public.industry_template_packs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper RPC: resolve a company's pack with safe defaults
CREATE OR REPLACE FUNCTION public.get_company_industry_pack(p_company_id uuid)
RETURNS public.industry_template_packs
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT itp.*
  FROM public.companies c
  LEFT JOIN public.industry_template_packs itp
    ON itp.industry_id = c.industry_vertical
   AND itp.is_active = true
  WHERE c.id = p_company_id
  LIMIT 1;
$$;
