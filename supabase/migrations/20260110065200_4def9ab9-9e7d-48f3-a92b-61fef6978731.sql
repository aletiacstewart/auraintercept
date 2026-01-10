-- Generate unique registration codes for existing companies
DO $$
DECLARE
  company_rec RECORD;
  new_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code_exists boolean;
BEGIN
  FOR company_rec IN SELECT id FROM public.companies WHERE registration_code IS NULL LOOP
    LOOP
      new_code := '';
      FOR i IN 1..8 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      
      SELECT EXISTS(SELECT 1 FROM public.companies WHERE registration_code = new_code) INTO code_exists;
      
      IF NOT code_exists THEN
        UPDATE public.companies SET registration_code = new_code WHERE id = company_rec.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Now add unique constraint
ALTER TABLE public.companies 
ADD CONSTRAINT companies_registration_code_unique UNIQUE (registration_code);