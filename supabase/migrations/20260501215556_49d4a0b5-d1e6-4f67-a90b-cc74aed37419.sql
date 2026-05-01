-- ========================================
-- Phase E migration
-- 1. Auto-seed knowledge docs/FAQs from industry pack
-- 2. GIN indexes on intake_data
-- 3. SECURITY DEFINER search RPCs scoped to caller's company
-- ========================================

-- ---------- 1. KB seeding trigger ----------

CREATE OR REPLACE FUNCTION public.seed_industry_pack_kb_for_company(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack public.industry_template_packs%ROWTYPE;
  v_doc jsonb;
  v_faq jsonb;
  v_name text;
  v_content text;
  v_q text;
  v_a text;
  v_cat text;
BEGIN
  SELECT itp.*
    INTO v_pack
  FROM public.companies c
  JOIN public.industry_template_packs itp
    ON itp.industry_id = c.industry_vertical
   AND itp.is_active = true
  WHERE c.id = p_company_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Seed knowledge_documents from kb_seed_documents JSON array
  IF v_pack.kb_seed_documents IS NOT NULL
     AND jsonb_typeof(v_pack.kb_seed_documents) = 'array' THEN
    FOR v_doc IN SELECT * FROM jsonb_array_elements(v_pack.kb_seed_documents) LOOP
      v_name    := COALESCE(v_doc->>'name', v_doc->>'title', 'Industry Reference');
      v_content := COALESCE(v_doc->>'content', v_doc->>'body', '');

      -- Skip if a doc with this name already exists for the company
      IF NOT EXISTS (
        SELECT 1 FROM public.knowledge_documents kd
        WHERE kd.company_id = p_company_id AND kd.name = v_name
      ) THEN
        INSERT INTO public.knowledge_documents (
          company_id, name, file_path, file_type, content_text
        ) VALUES (
          p_company_id,
          v_name,
          'industry-pack://' || v_pack.industry_id || '/' || v_name,
          'text',
          v_content
        );
      END IF;

      -- If the doc carries an inline FAQ list, seed those too
      IF v_doc ? 'faqs' AND jsonb_typeof(v_doc->'faqs') = 'array' THEN
        FOR v_faq IN SELECT * FROM jsonb_array_elements(v_doc->'faqs') LOOP
          v_q   := v_faq->>'question';
          v_a   := v_faq->>'answer';
          v_cat := COALESCE(v_faq->>'category', v_pack.industry_id);
          IF v_q IS NOT NULL AND v_a IS NOT NULL
             AND NOT EXISTS (
               SELECT 1 FROM public.faqs f
               WHERE f.company_id = p_company_id AND f.question = v_q
             ) THEN
            INSERT INTO public.faqs (company_id, question, answer, category)
            VALUES (p_company_id, v_q, v_a, v_cat);
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_seed_industry_pack_kb()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.industry_vertical IS NOT NULL
     AND NEW.industry_vertical IS DISTINCT FROM OLD.industry_vertical THEN
    PERFORM public.seed_industry_pack_kb_for_company(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_industry_pack_kb_on_industry_change ON public.companies;
CREATE TRIGGER seed_industry_pack_kb_on_industry_change
AFTER INSERT OR UPDATE OF industry_vertical ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.trg_seed_industry_pack_kb();

-- ---------- 2. GIN indexes for intake_data search ----------

CREATE INDEX IF NOT EXISTS appointments_intake_data_gin_idx
  ON public.appointments USING gin (intake_data jsonb_path_ops);

CREATE INDEX IF NOT EXISTS leads_intake_data_gin_idx
  ON public.leads USING gin (intake_data jsonb_path_ops);

-- ---------- 3. Search RPCs (scoped to caller's company) ----------

CREATE OR REPLACE FUNCTION public.search_intake_data(
  p_query text,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  customer_name text,
  service_type text,
  datetime timestamptz,
  status text,
  intake_data jsonb,
  match_field text,
  match_value text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_q text;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := lower(trim(p_query));

  IF public.has_role(auth.uid(), 'platform_admin'::public.app_role) THEN
    v_company := NULL; -- platform admins: no scope (still narrowed by other tables)
  ELSE
    v_company := public.get_user_company_id(auth.uid());
    IF v_company IS NULL THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  WITH expanded AS (
    SELECT
      a.id,
      a.customer_name,
      a.service_type,
      a.datetime,
      a.status,
      a.intake_data,
      kv.key   AS match_field,
      kv.value::text AS match_value
    FROM public.appointments a
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(a.intake_data, '{}'::jsonb)) AS kv
    WHERE (v_company IS NULL OR a.company_id = v_company)
      AND a.intake_data IS NOT NULL
      AND a.intake_data <> '{}'::jsonb
  )
  SELECT *
  FROM expanded e
  WHERE lower(e.match_value) LIKE '%' || v_q || '%'
     OR lower(e.match_field) LIKE '%' || v_q || '%'
  ORDER BY e.datetime DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 100));
END;
$$;

CREATE OR REPLACE FUNCTION public.search_lead_intake_data(
  p_query text,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  name text,
  service_interest text,
  created_at timestamptz,
  status text,
  intake_data jsonb,
  match_field text,
  match_value text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_q text;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  v_q := lower(trim(p_query));

  IF public.has_role(auth.uid(), 'platform_admin'::public.app_role) THEN
    v_company := NULL;
  ELSE
    v_company := public.get_user_company_id(auth.uid());
    IF v_company IS NULL THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  WITH expanded AS (
    SELECT
      l.id,
      l.name,
      l.service_interest,
      l.created_at,
      l.status,
      l.intake_data,
      kv.key   AS match_field,
      kv.value::text AS match_value
    FROM public.leads l
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(l.intake_data, '{}'::jsonb)) AS kv
    WHERE (v_company IS NULL OR l.company_id = v_company)
      AND l.intake_data IS NOT NULL
      AND l.intake_data <> '{}'::jsonb
  )
  SELECT *
  FROM expanded e
  WHERE lower(e.match_value) LIKE '%' || v_q || '%'
     OR lower(e.match_field) LIKE '%' || v_q || '%'
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 100));
END;
$$;
