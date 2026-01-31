-- Add Tavily API key column to tenant_integrations
ALTER TABLE tenant_integrations 
ADD COLUMN IF NOT EXISTS tavily_api_key TEXT;