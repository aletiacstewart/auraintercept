## Goal
Make the new Home Health demos actually appear as LIVE in `/super-switcher`:
- Physical Therapy
- Occupational Therapy
- Hospice Care

## Findings
- The Home Health industry template packs exist and are active.
- `/super-switcher` is correctly reading active packs and demo companies.
- The new demo auth users and demo companies do not exist yet in the live backend.
- Recent seeder logs show boot activity only, with no evidence that the updated Home Health seed blocks executed.

## Plan
1. **Deploy the updated demo seeder**
   - Deploy `seed-demo-accounts-v2` so the live backend is running the current 21-industry code, not the older 18-industry version.

2. **Run the seeder from the backend tool**
   - Invoke `seed-demo-accounts-v2` directly as the current platform-admin session.
   - Capture the response and verify the result includes the three Home Health industries.

3. **Validate database records**
   - Confirm these demo companies now exist with `is_demo = true`:
     - `physical_therapy`
     - `occupational_therapy`
     - `hospice`
   - Confirm the 9 demo users exist:
     - `physicaltherapyadmin@demo.com`, `physicaltherapyemployee@demo.com`, `physicaltherapycustomer@demo.com`
     - `occupationaltherapyadmin@demo.com`, `occupationaltherapyemployee@demo.com`, `occupationaltherapycustomer@demo.com`
     - `hospiceadmin@demo.com`, `hospiceemployee@demo.com`, `hospicecustomer@demo.com`

4. **If invocation still fails**
   - Read the specific seeder error from function logs.
   - Patch only the failing seeder logic, redeploy, rerun, and revalidate.

5. **Switcher confirmation**
   - Verify `/super-switcher` can now mark the three cards as LIVE because it matches `industry_template_packs.industry_id` to `companies.industry_vertical`.