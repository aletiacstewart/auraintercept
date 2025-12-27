-- Add new CRM providers to the enum
ALTER TYPE crm_provider ADD VALUE IF NOT EXISTS 'zoho';
ALTER TYPE crm_provider ADD VALUE IF NOT EXISTS 'pipedrive';
ALTER TYPE crm_provider ADD VALUE IF NOT EXISTS 'webhook';