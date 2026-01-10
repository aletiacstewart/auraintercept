-- Add must_change_password flag to profiles for first-login password change requirement
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Add registration_code to companies table (will generate unique codes after)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS registration_code text;

-- Create function to generate registration code for new companies
CREATE OR REPLACE FUNCTION public.generate_company_registration_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8 character code
    new_code := '';
    FOR i IN 1..8 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE registration_code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      NEW.registration_code := new_code;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate registration code on company insert
DROP TRIGGER IF EXISTS generate_company_reg_code ON public.companies;
CREATE TRIGGER generate_company_reg_code
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  WHEN (NEW.registration_code IS NULL)
  EXECUTE FUNCTION public.generate_company_registration_code();