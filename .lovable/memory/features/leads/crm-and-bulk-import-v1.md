---
name: CRM Sync & Bulk Lead Import v1
description: CRM connection providers (HubSpot, Salesforce, Zoho, Pipedrive, Generic webhook) with two-way lead sync, plus bulk lead upload (CSV/XLSX/PDF/DOCX) parsed by Leads AI with auto-add or review-queue modes.
type: feature
---
CRM providers: hubspot, salesforce, zoho, pipedrive, generic (webhook). Stored in `crm_connections` (one row per company+provider). Customer brings their own CRM account + credentials; CRM vendor bills customer directly, Aura never resells.

Sync edge fn `crm-sync-leads` supports `push|pull|two_way`. Push iterates `leads` where `external_crm_id IS NULL`. Pull dedupes by external_id → email → phone. Activity recorded in `crm_sync_log`.

Bulk import: file uploaded to `lead-imports` storage bucket (private, scoped by company_id folder). `lead-import-parse` extracts rows (CSV/XLSX direct; PDF/DOCX via Lovable AI gemini-2.5-flash with JSON response_format). Writes `lead_import_rows`. Mode `auto` triggers `lead-import-commit` immediately; mode `review` waits for admin approval. After commit, `crm-sync-leads push` is auto-triggered.

Routes: `/dashboard/integrations/crm`, `/dashboard/leads/import`. Entry points: Integrations index card row, Leads page header buttons.

Accepted file types: .csv, .xlsx, .xls, .pdf, .docx (20 MB max).