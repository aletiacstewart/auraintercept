## Update RolePreviewRow — split into 3 role-specific signup CTAs

Rework `src/components/marketing/RolePreviewRow.tsx` on the `/for-business` page.

### Copy changes
- Section heading: "Try every view, all in one demo" → **"One platform. Three logins."**
- Subheading: replace "One sign-up gets you 3 logins…" with something like **"This is a Live Demo for companies. Sign up your business, then invite your employees and customers to create their own accounts."**
- Remove the footer strip that says "One demo unlocks all 3 logins — admin, technician & customer." and remove the single "Try all 3 views — Free demo" button.
- Remove all "Free demo" wording site-wide within this component.

### New per-role buttons (inside each role card)
Each of the three role blocks gets its own button that routes to the correct signup surface:

| Role card | Button label | Destination |
|---|---|---|
| Owner Dashboard | "Sign up your company" | `/auth?mode=company&tab=signup&tier=command` (carry `industry` when present) |
| Technician App | "Employee sign-in" | `/signin?mode=employee` |
| Customer Portal | "Customer sign-up" | `/customer-auth?tab=signup` |

Notes:
- Employees don't have public signup — they join via a registration code on the sign-in page (per `src/pages/Auth.tsx` header comment). The tech card button therefore points at `/signin?mode=employee` and its microcopy should read "Employees join with a registration code from their company."
- Customers use `/customer-auth` which has a signup tab.

### Component wiring
- Keep the existing `onTryDemo` prop for backwards compatibility (still used by `ForBusiness.tsx`), but wire it only to the Owner card's "Sign up your company" button. Other two buttons use plain `<Link>` (react-router) to their destinations, no prop plumbing needed.
- Preserve `industryId` prop and forward it as a query param on the company-signup link when present.

### Out of scope
- No changes to `Auth.tsx`, `CustomerAuth.tsx`, `SignIn.tsx`, pricing, or other pages.
- No copy changes elsewhere on `/for-business` beyond this component.

### Files
- Edit: `src/components/marketing/RolePreviewRow.tsx`

### Verification
- Load `/for-business` → confirm new heading, no "Free demo" text, three buttons visible under their respective cards, each opens the correct signup surface. Confirm `?industry=...` is forwarded on the Owner button when an industry is selected.
