## Goal
Add a PDF / CSV / Excel / Word upload button directly to the Add New Lead form so users can bulk-import without leaving the form.

## Approach
The bulk-import infrastructure already exists at `/dashboard/leads/import` (`LeadsImport.tsx`) — it uploads to the `lead-imports` storage bucket, creates a `lead_import_jobs` row, and invokes the `lead-import-parse` edge function. We'll reuse it.

## Changes
**`src/components/marketing/forms/LeadForm.tsx`**
- Add a compact "Bulk upload (PDF, CSV, Excel, Word)" section near the top of the form (above the Name field), separated by a divider.
- Hidden `<input type="file" accept=".csv,.xlsx,.xls,.pdf,.docx">` triggered by an outline `Button` with `Upload` icon.
- A small toggle (Switch) for "Auto-add & dedupe" vs "Review before import" (defaults to Review).
- 20MB client-side size check matching the existing bucket policy.
- On file selection:
  1. Upload to `lead-imports` bucket at `${companyId}/${Date.now()}-${name}`.
  2. Insert `lead_import_jobs` row (mode = auto|review).
  3. Invoke `lead-import-parse` edge function.
  4. Toast success and offer a "Review imported rows" link to `/dashboard/leads/import?job=<id>` (or just `/dashboard/leads/import`).
- Loading spinner state while uploading.
- Invalidate the `leads` query on success.

**`src/pages/LeadsImport.tsx`** (small)
- Read `?job=<id>` from the URL on mount and set it as `activeJob` + auto-switch to the Review tab — so the deep link from the form lands users directly on the parsed rows.

## Out of scope
- No changes to the edge function, bucket, schema, or the existing `/dashboard/leads/import` page beyond the deep-link handling.
- No new dependencies.
- Single-lead manual entry flow is unchanged.
