DO $$
DECLARE
  demo_company_ids uuid[];
  demo_user_ids uuid[];
BEGIN
  -- Collect demo company IDs (by slug pattern + name pattern)
  SELECT array_agg(id) INTO demo_company_ids
  FROM public.companies
  WHERE slug LIKE 'demo-%' OR name ILIKE 'Demo %';

  -- Collect demo user IDs
  SELECT array_agg(id) INTO demo_user_ids
  FROM auth.users
  WHERE email LIKE '%@demo.com';

  RAISE NOTICE 'Demo companies: %, Demo users: %',
    coalesce(array_length(demo_company_ids, 1), 0),
    coalesce(array_length(demo_user_ids, 1), 0);

  IF demo_company_ids IS NULL THEN demo_company_ids := ARRAY[]::uuid[]; END IF;
  IF demo_user_ids IS NULL THEN demo_user_ids := ARRAY[]::uuid[]; END IF;

  -- ============ Delete dependent rows tied to demo companies ============
  DELETE FROM public.appointment_access_logs WHERE appointment_id IN (
    SELECT id FROM public.appointments WHERE company_id = ANY(demo_company_ids)
  );
  DELETE FROM public.calendar_event_mappings WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.calendar_sync_jobs WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.campaign_recipients WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.crm_entity_mappings WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.crm_field_mappings WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.crm_sync_logs WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.crm_connections WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.cross_company_access_logs WHERE attempted_company_id = ANY(demo_company_ids) OR authorized_company_id = ANY(demo_company_ids);
  DELETE FROM public.ai_agent_logs WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.ai_agent_events WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.ai_agent_context WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.ai_agent_configs WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.agent_performance_metrics WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.call_logs WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.appointments WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.business_hours WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.company_ai_content_profiles WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.company_role_agent_access WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.company_role_permissions WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.content_engine_history WHERE company_id = ANY(demo_company_ids);
  DELETE FROM public.cost_estimates WHERE company_id = ANY(demo_company_ids);

  -- Catch-all: any other table with a company_id column referencing demo companies.
  -- Iterate dynamically to avoid missing tables.
  DECLARE
    rec record;
  BEGIN
    FOR rec IN
      SELECT c.table_schema, c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.column_name = 'company_id'
        AND c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    LOOP
      EXECUTE format('DELETE FROM %I.%I WHERE company_id = ANY($1)', rec.table_schema, rec.table_name)
        USING demo_company_ids;
    END LOOP;
  END;

  -- ============ Delete rows tied to demo users ============
  DELETE FROM public.customer_company_associations WHERE customer_user_id = ANY(demo_user_ids);
  DELETE FROM public.employee_job_assignments WHERE employee_id = ANY(demo_user_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY(demo_user_ids);

  -- Catch-all for any table with user_id referencing demo users
  DECLARE
    rec record;
  BEGIN
    FOR rec IN
      SELECT c.table_schema, c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.column_name = 'user_id'
        AND c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
    LOOP
      EXECUTE format('DELETE FROM %I.%I WHERE user_id = ANY($1)', rec.table_schema, rec.table_name)
        USING demo_user_ids;
    END LOOP;
  END;

  DELETE FROM public.profiles WHERE id = ANY(demo_user_ids);

  -- ============ Delete the demo companies ============
  DELETE FROM public.companies WHERE id = ANY(demo_company_ids);

  -- ============ Delete the auth users ============
  DELETE FROM auth.users WHERE id = ANY(demo_user_ids);
END $$;