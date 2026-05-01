-- Distribution of values for a single intake field (categorical or numeric)
CREATE OR REPLACE FUNCTION public.intake_field_distribution(
  p_source text,
  p_field text,
  p_since timestamptz DEFAULT NULL
)
RETURNS TABLE(bucket text, count bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
BEGIN
  IF p_source NOT IN ('appointments', 'leads') THEN
    RAISE EXCEPTION 'invalid source: %', p_source;
  END IF;
  IF p_field IS NULL OR length(trim(p_field)) = 0 THEN
    RETURN;
  END IF;

  IF public.has_role(auth.uid(), 'platform_admin'::public.app_role) THEN
    v_company := NULL;
  ELSE
    v_company := public.get_user_company_id(auth.uid());
    IF v_company IS NULL THEN
      RETURN;
    END IF;
  END IF;

  IF p_source = 'appointments' THEN
    RETURN QUERY
      SELECT
        COALESCE(NULLIF(trim(a.intake_data->>p_field), ''), '(blank)') AS bucket,
        count(*)::bigint AS count
      FROM public.appointments a
      WHERE (v_company IS NULL OR a.company_id = v_company)
        AND (p_since IS NULL OR a.created_at >= p_since)
        AND a.intake_data ? p_field
      GROUP BY 1
      ORDER BY 2 DESC, 1
      LIMIT 50;
  ELSE
    RETURN QUERY
      SELECT
        COALESCE(NULLIF(trim(l.intake_data->>p_field), ''), '(blank)') AS bucket,
        count(*)::bigint AS count
      FROM public.leads l
      WHERE (v_company IS NULL OR l.company_id = v_company)
        AND (p_since IS NULL OR l.created_at >= p_since)
        AND l.intake_data ? p_field
      GROUP BY 1
      ORDER BY 2 DESC, 1
      LIMIT 50;
  END IF;
END;
$$;

-- Monthly time series of how often a field has been captured
CREATE OR REPLACE FUNCTION public.intake_field_timeseries(
  p_source text,
  p_field text,
  p_months integer DEFAULT 12
)
RETURNS TABLE(period date, count bigint, distinct_values bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_since timestamptz;
BEGIN
  IF p_source NOT IN ('appointments', 'leads') THEN
    RAISE EXCEPTION 'invalid source: %', p_source;
  END IF;

  IF public.has_role(auth.uid(), 'platform_admin'::public.app_role) THEN
    v_company := NULL;
  ELSE
    v_company := public.get_user_company_id(auth.uid());
    IF v_company IS NULL THEN
      RETURN;
    END IF;
  END IF;

  v_since := date_trunc('month', now()) - (GREATEST(1, LEAST(p_months, 36)) || ' months')::interval;

  IF p_source = 'appointments' THEN
    RETURN QUERY
      SELECT
        date_trunc('month', a.created_at)::date AS period,
        count(*)::bigint AS count,
        count(DISTINCT a.intake_data->>p_field)::bigint AS distinct_values
      FROM public.appointments a
      WHERE (v_company IS NULL OR a.company_id = v_company)
        AND a.created_at >= v_since
        AND a.intake_data ? p_field
        AND NULLIF(trim(a.intake_data->>p_field), '') IS NOT NULL
      GROUP BY 1
      ORDER BY 1;
  ELSE
    RETURN QUERY
      SELECT
        date_trunc('month', l.created_at)::date AS period,
        count(*)::bigint AS count,
        count(DISTINCT l.intake_data->>p_field)::bigint AS distinct_values
      FROM public.leads l
      WHERE (v_company IS NULL OR l.company_id = v_company)
        AND l.created_at >= v_since
        AND l.intake_data ? p_field
        AND NULLIF(trim(l.intake_data->>p_field), '') IS NOT NULL
      GROUP BY 1
      ORDER BY 1;
  END IF;
END;
$$;

-- Completeness: for each intake key seen on records, what percent are filled
CREATE OR REPLACE FUNCTION public.intake_field_completeness(
  p_source text
)
RETURNS TABLE(field text, total bigint, filled bigint, pct numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_total bigint;
BEGIN
  IF p_source NOT IN ('appointments', 'leads') THEN
    RAISE EXCEPTION 'invalid source: %', p_source;
  END IF;

  IF public.has_role(auth.uid(), 'platform_admin'::public.app_role) THEN
    v_company := NULL;
  ELSE
    v_company := public.get_user_company_id(auth.uid());
    IF v_company IS NULL THEN
      RETURN;
    END IF;
  END IF;

  IF p_source = 'appointments' THEN
    SELECT count(*) INTO v_total
    FROM public.appointments a
    WHERE (v_company IS NULL OR a.company_id = v_company);

    IF COALESCE(v_total, 0) = 0 THEN
      RETURN;
    END IF;

    RETURN QUERY
      WITH expanded AS (
        SELECT kv.key AS field,
               NULLIF(trim(kv.value), '') IS NOT NULL AS is_filled
        FROM public.appointments a
        CROSS JOIN LATERAL jsonb_each_text(COALESCE(a.intake_data, '{}'::jsonb)) AS kv
        WHERE (v_company IS NULL OR a.company_id = v_company)
      )
      SELECT
        e.field,
        v_total AS total,
        sum(CASE WHEN e.is_filled THEN 1 ELSE 0 END)::bigint AS filled,
        ROUND((sum(CASE WHEN e.is_filled THEN 1 ELSE 0 END)::numeric / v_total::numeric) * 100, 1) AS pct
      FROM expanded e
      GROUP BY e.field
      ORDER BY pct ASC, e.field;
  ELSE
    SELECT count(*) INTO v_total
    FROM public.leads l
    WHERE (v_company IS NULL OR l.company_id = v_company);

    IF COALESCE(v_total, 0) = 0 THEN
      RETURN;
    END IF;

    RETURN QUERY
      WITH expanded AS (
        SELECT kv.key AS field,
               NULLIF(trim(kv.value), '') IS NOT NULL AS is_filled
        FROM public.leads l
        CROSS JOIN LATERAL jsonb_each_text(COALESCE(l.intake_data, '{}'::jsonb)) AS kv
        WHERE (v_company IS NULL OR l.company_id = v_company)
      )
      SELECT
        e.field,
        v_total AS total,
        sum(CASE WHEN e.is_filled THEN 1 ELSE 0 END)::bigint AS filled,
        ROUND((sum(CASE WHEN e.is_filled THEN 1 ELSE 0 END)::numeric / v_total::numeric) * 100, 1) AS pct
      FROM expanded e
      GROUP BY e.field
      ORDER BY pct ASC, e.field;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.intake_field_distribution(text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intake_field_timeseries(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intake_field_completeness(text) TO authenticated;