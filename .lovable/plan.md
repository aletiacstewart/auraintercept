## Plan

1. **Deploy the updated demo seeder**
   - Deploy `seed-demo-accounts-v2` so the live backend uses the version that includes `home_health`.

2. **Seed Home Health Care immediately**
   - Invoke the seeder for only `home_health` using its existing targeted seeding support.
   - Expected live records:
     - Company slug: `demo-home-health`
     - `homehealthadmin@demo.com`
     - `homehealthemployee@demo.com`
     - `homehealthcustomer@demo.com`
     - Password: `aidemo*!`

3. **Update the Demo Account Seeder page**
   - Add `Home Health Care` to the Pro tier list on `/dashboard/demo-seeder`.
   - Update stale copy from 18 industries / 54 accounts to 26 industries / 78 accounts.
   - Update the loading label from “Seeding 18 industries…” to “Seeding 26 industries…”.

4. **Verify live state**
   - Query the database to confirm `industry_vertical = 'home_health'` exists in `companies`.
   - Confirm the seeded result returns the three Home Health demo accounts.

## Technical details

- No database schema changes are needed; the `home_health` industry template pack already exists and is active.
- This is a deployment + targeted seed + frontend display correction.