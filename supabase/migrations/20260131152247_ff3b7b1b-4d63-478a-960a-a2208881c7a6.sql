-- Add columns for campaign series support
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS series_order INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_send_date TIMESTAMPTZ;

-- Create index for series lookups
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_series_id ON marketing_campaigns(series_id);

-- Add comment for documentation
COMMENT ON COLUMN marketing_campaigns.series_id IS 'Links campaigns that are part of the same multi-touch series';
COMMENT ON COLUMN marketing_campaigns.series_order IS 'Order of this campaign within the series (1, 2, 3...)';
COMMENT ON COLUMN marketing_campaigns.scheduled_send_date IS 'Scheduled date/time for automated sending';