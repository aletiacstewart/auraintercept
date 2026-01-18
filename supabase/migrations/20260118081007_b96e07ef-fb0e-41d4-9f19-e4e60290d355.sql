-- Add night mode columns to smart_websites table (if not exists)
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS enable_night_mode boolean DEFAULT false;
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS night_header text;
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS night_subheadline text;
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS night_start_hour integer DEFAULT 18;
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS night_end_hour integer DEFAULT 6;
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS emergency_cta_text text;
ALTER TABLE smart_websites ADD COLUMN IF NOT EXISTS emergency_cta_url text;