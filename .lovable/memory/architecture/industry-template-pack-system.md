
## Authoring UI (Phase I)

Platform admins edit packs at `/dashboard/admin/industry-packs` (list) and
`/dashboard/admin/industry-packs/:id` (editor). Gated via
`ProtectedRoute requiredRole="platform_admin"`. Existing RLS already
restricts writes to `has_role(auth.uid(), 'platform_admin')` — no new
migration was needed.

Editor tabs: Meta · Terminology · Job templates · Form schemas (with
live `<DynamicIntakeFields>` preview + `show_if` rule builder) · Prompt
deltas · Extra operatives. Save validates against
`packEditableSchema` (zod, mirrors Phase H types) and on success
invalidates `['industry-pack']` so live company sessions hot-swap on
their next refetch — no app reload required.

Import / Export JSON buttons enable cross-environment pack sync.
