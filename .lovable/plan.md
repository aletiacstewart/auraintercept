
## Goal

Give every company two new lead-management capabilities, available to all industries:

1. **Connect a CRM** — generic webhook/API option plus first-class setup for HubSpot, Salesforce, Zoho CRM, and Pipedrive, with two-way sync (push new Aura leads + pull existing CRM contacts and keep them in sync).
2. **Bulk Lead Upload** — admins upload old leads as CSV, Excel (.xlsx/.xls), PDF, or Word (.docx). The Leads AI agent parses, normalizes, and either auto-adds (with dedupe) or routes to a review queue, depending on a per-company toggle.

Per-customer 3rd-party policy still applies: customer connects their own CRM account/API key; Aura never resells.

---

## Phase 1 — Data model

New tables (migration, with grants + RLS scoped to `company_id`):

- `crm_connections` — `company_id`, `provider` (`hubspot|salesforce|zoho|pipedrive|generic`), `status`, `auth_type` (`oauth|api_key|webhook`), `credentials_ref` (encrypted JSON / secret name), `sync_direction` (`two_way` default), `last_sync_at`, `last_error`, `external_account_label`, `settings` (jsonb: field mappings, default pipeline, owner).
- `crm_sync_log` — `connection_id`, `direction` (`in|out`), `entity` (`lead|contact`), `external_id`, `lead_id`, `status`, `error`, `payload_summary`.
- `lead_import_jobs` — `company_id`, `uploaded_by`, `source_filename`, `mime_type`, `storage_path`, `mode` (`auto|review`), `status` (`uploaded|parsing|ready_for_review|importing|completed|failed`), `total_rows`, `imported_count`, `duplicate_count`, `error_count`, `parser_notes`.
- `lead_import_rows` — `job_id`, `row_index`, `raw` (jsonb), `normalized` (jsonb: name/email/phone/address/source/notes/tags), `dedupe_match_lead_id`, `decision` (`pending|approved|rejected|imported|duplicate`), `error`.
- `companies.lead_import_mode` (`auto|review`, default `review`) — admin toggle.

Storage bucket: `lead-imports` (private), RLS so a company only sees its own files.

Existing `leads` table gains optional `external_crm_id` + `external_crm_provider` (nullable) for sync correlation.

---

## Phase 2 — Edge functions

- `crm-oauth-start` / `crm-oauth-callback` — per-provider OAuth handshakes (HubSpot, Salesforce via gateway; Zoho/Pipedrive via per-customer API key form when OAuth isn't wired).
- `crm-sync-leads` — scheduled + on-demand; pushes new/updated Aura leads → CRM and pulls recent CRM contacts → Aura `leads` (dedupe by email/phone, then `external_crm_id`).
- `crm-test-connection` — validates credentials, returns account label + pipelines.
- `lead-import-parse` — invoked after upload. Routes by mime type:
  - CSV → `csv-parse`
  - XLSX/XLS → `xlsx` (SheetJS) in function
  - PDF → text extraction via existing PDF utility, then LLM normalization
  - DOCX → `unzipit` + `xml` text extract, then LLM normalization
  Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with a strict JSON schema (name/email/phone/address/source/notes/tags) to normalize rows. Writes `lead_import_rows`.
- `lead-import-commit` — for `auto` mode runs immediately after parse; for `review` mode runs when admin clicks Approve. Inserts into `leads`, marks duplicates, triggers CRM push if a connection exists.

All functions follow project standards (CORS, zod validation, `verify_jwt=false` with internal auth where applicable, `200 OK` on sub failures).

---

## Phase 3 — UI

New page **Settings → Integrations → CRM** (`/dashboard/integrations/crm`):

- Card per provider: HubSpot, Salesforce, Zoho CRM, Pipedrive, Generic (Webhook + API Key). Each card shows status, last sync, "Connect / Disconnect / Test / Sync now" buttons.
- Each card opens a side sheet with:
  - Provider-specific step-by-step setup instructions (where to get API key, OAuth scopes, what URL to paste).
  - 3rd-party cost/billing disclosure block (reuse `ThirdPartyCostDisclosureDialog` pattern).
  - Field-mapping editor (Aura field ↔ CRM field) with smart defaults.
  - Sync direction selector (defaults to two-way).
- Generic CRM card shows: inbound webhook URL (Aura → your CRM) + outbound endpoint config (your CRM → Aura via signed webhook) + sample payload.

New page **Leads → Import** (`/dashboard/leads/import`) — also reachable from Leads empty state:

- Dropzone accepting `.csv .xlsx .xls .pdf .docx` (max 20 MB).
- Per-upload toggle: "Auto-add & dedupe" vs "Review before import" (defaults from company setting).
- Progress states: Uploading → Parsing (Leads AI) → Ready / Imported.
- Review table (only in review mode): per-row editable fields, duplicate badge with link to existing lead, bulk approve / reject.
- History tab listing past import jobs with counts.

Admin toggle for default import mode lives in **Settings → Leads**.

---

## Phase 4 — Leads AI agent wiring

- Extend `leads` operative prompt with import + CRM context: "When an import job finishes you may be asked to summarize, deduplicate, or enrich rows."
- Add quick-action: from any console, "Import old leads" routes to `/dashboard/leads/import`.
- Add quick-action: "Connect CRM" routes to CRM settings.

---

## Phase 5 — Memory + docs

- Update `mem://integrations/3rd-party-requirements-standard` to add CRM providers (customer-owned account, separate billing) and new feature memory `mem://features/leads/crm-and-bulk-import-v1` describing providers, sync model, and import flow.

---

## Out of scope

- Real-time webhooks from every CRM (initial release uses 5-min cron pull + on-demand sync).
- Marketplace-grade OAuth apps for Zoho/Pipedrive — those start as per-customer API key; HubSpot/Salesforce use existing gateway connectors.
- Email/calendar sync from CRMs (leads/contacts only).

---

## Technical notes

```text
upload (UI) ──► storage bucket: lead-imports
                       │
                       ▼
              lead-import-parse (edge fn)
              ├─ csv / xlsx → direct rows
              └─ pdf / docx → text → Lovable AI → rows
                       │
                       ▼
              lead_import_rows  (normalized JSON)
                       │
       mode=auto  ┌────┴────┐  mode=review
                  ▼         ▼
       lead-import-commit   UI review → approve → commit
                  │
                  ▼
              public.leads  ──► crm-sync-leads (push if connected)

CRM pull: cron → crm-sync-leads → upsert into leads (dedupe email/phone, store external_crm_id)
```

Standards followed: GRANTs + RLS in same migration, secrets via `add_secret`/connectors (HubSpot + Salesforce gateways already documented), DOMPurify on any rendered file content, no mock data, 60-day trial copy preserved, no "bundled/overage/absorbed" language anywhere in the CRM or import UI.
