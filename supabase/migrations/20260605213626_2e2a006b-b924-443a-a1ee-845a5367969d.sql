CREATE TABLE IF NOT EXISTS public.ui_translations (
  text_hash TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  source_lang TEXT NOT NULL DEFAULT 'en',
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (text_hash, target_lang)
);

GRANT SELECT ON public.ui_translations TO anon, authenticated;
GRANT ALL ON public.ui_translations TO service_role;

ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ui_translations public read"
  ON public.ui_translations FOR SELECT
  USING (true);

CREATE POLICY "ui_translations service write"
  ON public.ui_translations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS ui_translations_lang_idx ON public.ui_translations(target_lang);