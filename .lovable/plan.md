## Add 6 Healthcare Demo Accounts (18 users)

Add the 6 new healthcare verticals to the demo seeder so each gets the standard 3-account set (admin / employee / customer) with password `aidemo*!`.

### Verticals & tier mapping (curated to showcase appointment-centric console)

| Industry | Tier | Why |
|---|---|---|
| `dental` | Boost | Recall-heavy SMS/voice |
| `chiropractic` | Core | Light booking workflow |
| `medical_office` | Pro | Insurance verification email + analytics |
| `veterinary` | Boost | Recall + pet-as-JSON intake |
| `physical_therapy` | Core | Recurring appointments |
| `optometry` | Core | Annual exam recall |

### Demo accounts created (18 total)

```
dentaladmin@demo.com / dentalemployee@demo.com / dentalcustomer@demo.com
chiropracticadmin@demo.com / chiropracticemployee@demo.com / chiropracticcustomer@demo.com
medicalofficeadmin@demo.com / medicalofficeemployee@demo.com / medicalofficecustomer@demo.com
veterinaryadmin@demo.com / veterinaryemployee@demo.com / veterinarycustomer@demo.com
physicaltherapyadmin@demo.com / physicaltherapyemployee@demo.com / physicaltherapycustomer@demo.com
optometryadmin@demo.com / optometryemployee@demo.com / optometrycustomer@demo.com
```
All passwords: `aidemo*!`

### Implementation

1. **Migration** — insert 6 minimal rows into `industry_template_packs` (id, label, is_active, terminology) so the KB trigger has a target. No EHR/Rx/medical-records content — appointments + insurance email only.

2. **Edit `supabase/functions/seed-demo-accounts-v2/index.ts`** — append 6 `industry(...)` entries to the `INDUSTRIES` array with healthcare-appropriate services, blogs, campaigns, and `inventory: null` (service-only verticals). Explicit scope notes in blog/campaign copy: appointments + insurance verification only, no records/meds/clinical advice.

3. **Update memory** — bump `mem://platform-operations/demo-account-registry` to v5: 24 industries × 3 accounts = **72 demo accounts**, healthcare tier mapping listed.

4. **Reseed** — user signs in as platform admin and clicks **Seed All Demo Accounts** at `/dashboard/demo-seeder`. Idempotent — existing 54 accounts stay, 18 new ones get added.

### Out of scope (enforced in copy)
No medical records, EHR/PMS sync, prescriptions, lab results, or clinical advice in any demo data — matches the existing healthcare scope guardrails.