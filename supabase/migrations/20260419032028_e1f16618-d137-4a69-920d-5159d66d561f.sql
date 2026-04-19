DO $$
DECLARE
  test_company_ids uuid[];
  test_user_ids uuid[];
  rec record;
BEGIN
  SELECT array_agg(id) INTO test_company_ids
  FROM public.companies
  WHERE slug LIKE 'test-%' OR name ILIKE 'Test %';

  SELECT array_agg(id) INTO test_user_ids
  FROM auth.users
  WHERE email LIKE '%@test.com';

  IF test_company_ids IS NULL THEN test_company_ids := ARRAY[]::uuid[]; END IF;
  IF test_user_ids IS NULL THEN test_user_ids := ARRAY[]::uuid[]; END IF;

  RAISE NOTICE 'Test companies: %, Test users: %',
    coalesce(array_length(test_company_ids, 1), 0),
    coalesce(array_length(test_user_ids, 1), 0);

  -- Catch-all: every public table with a company_id column
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
      USING test_company_ids;
  END LOOP;

  -- Rows tied to test users
  DELETE FROM public.customer_company_associations WHERE customer_user_id = ANY(test_user_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY(test_user_ids);

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
      USING test_user_ids;
  END LOOP;

  DELETE FROM public.profiles WHERE id = ANY(test_user_ids);
  DELETE FROM public.companies WHERE id = ANY(test_company_ids);
  DELETE FROM auth.users WHERE id = ANY(test_user_ids);
END $$;