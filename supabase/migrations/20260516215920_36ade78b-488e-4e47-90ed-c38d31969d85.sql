ALTER TABLE public.industry_template_packs
  DROP CONSTRAINT IF EXISTS industry_template_packs_cluster_check;

ALTER TABLE public.industry_template_packs
  ADD CONSTRAINT industry_template_packs_cluster_check
  CHECK (cluster IN ('trades','outdoor','repair','booking','home_health'));