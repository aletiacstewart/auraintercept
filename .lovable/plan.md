Plan: Close Remaining Mock-to-Live Gaps in Core Product

1. Customer Segments Persistence
   - Create `customer_segments` table in public schema with RLS (company_id, name, criteria JSONB, created_by, timestamps).
   - Add GRANTs for authenticated/service_role.
   - Wire `CustomerSegmentsForm` to read/write real segments via Supabase instead of `MOCK_SEGMENTS` local state.
   - Keep the existing live preview count logic (queries appointments/invoices for matching criteria).
   - Wire "Send Email Campaign" and "Send SMS Campaign" buttons to actual campaign creation flow (or campaign-draft state) rather than toast-only.

2. Social Content Engine — Publishing Pipeline Check
   - Audit `ContentEngineConsole` and social operatives to confirm whether generated posts currently stop at "draft" or can actually publish via connected OAuth accounts.
   - If publishing is still mock/demo-only, wire the "Publish" action to the social adapter edge function that handles Meta/LinkedIn/Google Business posting.
   - Ensure published posts are logged to a `social_posts` table with timestamp, platform, and status.

3. Final Sweep for Core-Facing Mock Data
   - Run a targeted search for any remaining hardcoded fallback data in non-demo, non-admin-gated user paths.
   - Replace or guard anything found with real queries or empty states.

4. Verification
   - All existing 69 tests continue to pass.
   - Build succeeds with zero new TypeScript errors.
   - Spot-check Customer Segments CRUD and Social publishing flows in preview.

Scope: This plan does NOT add new features or redesign UI. It only hardens existing surfaces so every core product path is backed by live database data.