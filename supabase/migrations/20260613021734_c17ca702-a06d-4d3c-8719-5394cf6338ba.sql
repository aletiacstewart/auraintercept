
-- 1) Dual role for auraintercept@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('5e877645-4201-49f5-9fca-9efe06548ff9', 'platform_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Ownership column
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS managed_by_admin_id uuid;

CREATE INDEX IF NOT EXISTS idx_companies_managed_by_admin
  ON public.companies(managed_by_admin_id);

-- 3) Trigger: assign first platform_admin as owner + fan out notifications + ping edge fn
CREATE OR REPLACE FUNCTION public.handle_company_signup_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_first_admin uuid;
BEGIN
  -- Skip demo seeds
  IF COALESCE(NEW.is_demo, false) = true THEN
    RETURN NEW;
  END IF;

  -- Auto-assign first platform_admin as owner if unset
  IF NEW.managed_by_admin_id IS NULL THEN
    SELECT ur.user_id INTO v_first_admin
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'platform_admin'
    ORDER BY p.created_at ASC NULLS LAST
    LIMIT 1;
    NEW.managed_by_admin_id := v_first_admin;
  END IF;

  -- Fan out in-app notifications to every platform_admin
  FOR v_admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'platform_admin'
  LOOP
    BEGIN
      INSERT INTO public.staff_notifications (
        company_id, recipient_id, recipient_role,
        notification_type, title, message, metadata
      ) VALUES (
        NEW.id,
        v_admin.user_id,
        'platform_admin',
        'new_company_signup',
        'New signup: ' || COALESCE(NEW.name, 'Unnamed'),
        'Tier ' || COALESCE(NEW.subscription_tier,'?') ||
          ' · Industry ' || COALESCE(NEW.industry_vertical,'?'),
        jsonb_build_object(
          'company_id', NEW.id,
          'name', NEW.name,
          'tier', NEW.subscription_tier,
          'industry', NEW.industry_vertical,
          'trial_ends_at', NEW.trial_ends_at
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'staff_notifications insert failed for admin %: %', v_admin.user_id, SQLERRM;
    END;
  END LOOP;

  -- Fire-and-forget HTTP call to email edge function
  BEGIN
    PERFORM net.http_post(
      url := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/notify-platform-on-signup',
      body := jsonb_build_object('company_id', NEW.id),
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify-platform-on-signup ping failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_signup_notify ON public.companies;
CREATE TRIGGER trg_company_signup_notify
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_company_signup_notify();

-- Allow the trigger insert to satisfy RLS for system-side inserts: relax staff_notifications insert policy
-- to also accept rows where recipient_role = 'platform_admin' (system-fanned notifications).
DROP POLICY IF EXISTS "Company members can insert notifications" ON public.staff_notifications;
CREATE POLICY "Company members or system can insert notifications"
  ON public.staff_notifications
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())
    OR recipient_role = 'platform_admin'
  );
