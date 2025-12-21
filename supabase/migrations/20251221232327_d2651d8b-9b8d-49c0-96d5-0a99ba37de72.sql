-- Drop and recreate the trigger function to handle customers without email
CREATE OR REPLACE FUNCTION public.upsert_customer_profile_from_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If customer has email, use email as primary identifier
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
    INSERT INTO public.customer_profiles (
      company_id,
      email,
      phone,
      name,
      address,
      sms_opt_out,
      email_opt_out,
      call_opt_out
    ) VALUES (
      NEW.company_id,
      NEW.customer_email,
      NEW.customer_phone,
      NEW.customer_name,
      NEW.customer_address,
      NEW.sms_opt_out,
      NEW.email_opt_out,
      NEW.call_opt_out
    )
    ON CONFLICT (company_id, email) DO UPDATE SET
      phone = COALESCE(EXCLUDED.phone, customer_profiles.phone),
      name = COALESCE(EXCLUDED.name, customer_profiles.name),
      address = COALESCE(EXCLUDED.address, customer_profiles.address),
      updated_at = now();
  -- If no email but has phone, use phone as identifier
  ELSIF NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
    -- Check if a profile with this phone already exists for this company
    IF NOT EXISTS (
      SELECT 1 FROM public.customer_profiles 
      WHERE company_id = NEW.company_id AND phone = NEW.customer_phone
    ) THEN
      -- Generate a placeholder email using phone
      INSERT INTO public.customer_profiles (
        company_id,
        email,
        phone,
        name,
        address,
        sms_opt_out,
        email_opt_out,
        call_opt_out
      ) VALUES (
        NEW.company_id,
        NEW.customer_phone || '@phone.placeholder',
        NEW.customer_phone,
        NEW.customer_name,
        NEW.customer_address,
        NEW.sms_opt_out,
        NEW.email_opt_out,
        NEW.call_opt_out
      );
    ELSE
      -- Update existing phone-based profile
      UPDATE public.customer_profiles 
      SET 
        name = COALESCE(NEW.customer_name, name),
        address = COALESCE(NEW.customer_address, address),
        updated_at = now()
      WHERE company_id = NEW.company_id AND phone = NEW.customer_phone;
    END IF;
  -- If customer has a name but no email or phone, still create a profile
  ELSIF NEW.customer_name IS NOT NULL AND NEW.customer_name != '' THEN
    INSERT INTO public.customer_profiles (
      company_id,
      email,
      phone,
      name,
      address,
      sms_opt_out,
      email_opt_out,
      call_opt_out
    ) VALUES (
      NEW.company_id,
      'customer-' || NEW.id || '@noemail.placeholder',
      NEW.customer_phone,
      NEW.customer_name,
      NEW.customer_address,
      NEW.sms_opt_out,
      NEW.email_opt_out,
      NEW.call_opt_out
    );
  END IF;
  
  RETURN NEW;
END;
$$;