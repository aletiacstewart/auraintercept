
CREATE TABLE IF NOT EXISTS public._edge_anon_key (
  id smallint PRIMARY KEY DEFAULT 1,
  anon_key text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT ALL ON public._edge_anon_key TO service_role;

ALTER TABLE public._edge_anon_key ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role only" ON public._edge_anon_key;
CREATE POLICY "service role only"
  ON public._edge_anon_key
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Seed current anon key (public value, safe in migration; future rotations = single UPDATE).
INSERT INTO public._edge_anon_key (id, anon_key)
VALUES (1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.trigger_employee_welcome_on_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_anon text;
  v_url text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/send-company-welcome';
BEGIN
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'employee') THEN
    RETURN NEW;
  END IF;

  SELECT anon_key INTO v_anon FROM public._edge_anon_key WHERE id = 1;
  IF v_anon IS NULL THEN
    RAISE WARNING 'trigger_employee_welcome_on_profile: _edge_anon_key not configured';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer '||v_anon,
        'apikey', v_anon
      ),
      body := jsonb_build_object(
        'kind','employee',
        'user_id', NEW.id,
        'company_id', NEW.company_id,
        'email', NEW.email,
        'name', NEW.full_name
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'employee_welcome failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_kb_refresh()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_anon text;
  v_url text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/generate-knowledge-base';
  v_company uuid := COALESCE(NEW.company_id, OLD.company_id);
BEGIN
  IF v_company IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT anon_key INTO v_anon FROM public._edge_anon_key WHERE id = 1;
  IF v_anon IS NULL THEN
    RAISE WARNING 'trigger_kb_refresh: _edge_anon_key not configured';
    RETURN COALESCE(NEW, OLD);
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer '||v_anon,
        'apikey', v_anon
      ),
      body := jsonb_build_object('company_id', v_company, 'source', 'auto_refresh')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'kb_refresh failed: %', SQLERRM;
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$;
