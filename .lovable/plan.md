
# Comprehensive Demo Data Seeding Plan

## Overview

This plan covers creating 2 new demo companies with users and seeding comprehensive demo data for all 7 companies across the platform.

---

## Phase 1: Create New Demo Companies and Users

### New Companies to Create

| Company | Tier | Business Type | Location |
|---------|------|---------------|----------|
| Demo Flow Company | flow | Personal Assistant | Austin, TX |
| Demo Core Company | core | Real Estate Agent | Austin, TX |

### New Users to Create

| Email | Role | Company |
|-------|------|---------|
| companyflow@demo.com | company_admin | Demo Flow Company |
| employeeflow@demo.com | employee | Demo Flow Company |
| customerflow@demo.com | customer | Demo Flow Company |
| companycore@demo.com | company_admin | Demo Core Company |
| employeecore@demo.com | employee | Demo Core Company |
| customercore@demo.com | customer | Demo Core Company |

**Password for all**: `aidemo*!`

### Implementation

1. **Update `create-demo-accounts` edge function** to include Flow and Core companies
2. **Create new companies via database migration** with appropriate subscription tiers
3. **Update `DemoAccounts.tsx`** to include Flow and Core in the credentials table

---

## Phase 2: Company Profile Updates

Update the 5 existing companies with business-specific information:

| Company | Business | Service Area | Services | Brand Tone |
|---------|----------|--------------|----------|------------|
| Demo Solo | HVAC | Austin, TX | AC Repair, AC Service, AC Installation | Balanced |
| Demo Multi | Plumbing | Austin, TX | Leaks, Fixture Installation, Plumbing Repairs | Balanced |
| Demo Command | Electrical | Austin, TX | Electrical Repair, Service, Fixture & Meter Installation | Balanced |
| Demo Halo | Nail & Hair Salon | Austin, TX | Nails, Haircuts, Styles | Balanced |
| Demo Express | Restaurant | Austin, TX | Local Food, Spanish & American Dishes | Balanced |
| Demo Flow | Personal Assistant | Austin, TX | Personal/Work Schedules, Task Management | Balanced |
| Demo Core | Real Estate | Austin, TX | Home Sales, Rentals, Real Estate Services | Balanced |

---

## Phase 3: Demo Data Categories

### For Each Company, Seed:

#### 1. AI Content Profiles (`company_ai_content_profiles`)
- Business description, industry, tone
- Target audience, keywords, USPs
- Content topics, avoid keywords

#### 2. Services (`services`)
- 4-6 services per company with descriptions, pricing, duration

#### 3. FAQs (`faqs`)
- 5-8 industry-specific FAQs per company

#### 4. Business Hours (`business_hours`)
- Standard M-F 8AM-6PM (adjust for restaurant/salon)

#### 5. Appointments (`appointments`)
- 5-10 appointments across past/future dates
- Mix of scheduled, completed, cancelled statuses

#### 6. Leads (`leads`)
- 3-5 leads per company with varied priorities and sources

#### 7. Marketing Campaigns (`marketing_campaigns`)
- Promotional campaign
- Seasonal campaign
- Follow-up campaign

#### 8. Social Media Content (`scheduled_social_posts`)
- Facebook post
- Instagram post
- LinkedIn post (for professional services)

#### 9. Blog Posts (`scheduled_blog_posts`)
- 2-3 industry-relevant blog posts

#### 10. Smart Website (`smart_websites`)
- Hero content, about section
- Contact info, services display settings

#### 11. Customer Profiles (`customer_profiles`)
- 3-5 customer records per company

---

## Phase 4: Industry-Specific Data Templates

### HVAC (Solo Company)
```text
Services: AC Repair, AC Service, AC Installation, Heating Repair, System Maintenance
FAQs: "How often should I service my AC?", "What's the average AC installation cost?", etc.
Social: Energy efficiency tips, seasonal maintenance reminders
Blog: "5 Signs Your AC Needs Repair", "Summer Energy Savings Guide"
```

### Plumbing (Multi Company)
```text
Services: Leak Detection, Fixture Installation, Drain Cleaning, Water Heater Repair, Emergency Plumbing
FAQs: "What causes low water pressure?", "How do I prevent frozen pipes?"
Social: Water conservation tips, DIY vs professional advice
Blog: "Common Plumbing Emergencies", "When to Replace Your Water Heater"
```

### Electrical (Command Company)
```text
Services: Electrical Repair, Panel Upgrades, Lighting Installation, Outlet/Switch Repair, Safety Inspections
FAQs: "How often should I get an electrical inspection?", "What causes circuit breaker trips?"
Social: Electrical safety tips, energy efficiency upgrades
Blog: "Signs You Need Panel Upgrade", "LED Lighting Benefits"
```

### Salon (Halo Company)
```text
Services: Manicure, Pedicure, Haircut, Hair Coloring, Styling, Nail Art
FAQs: "How long does a manicure last?", "What's the difference between gel and acrylic?"
Social: Trending styles, seasonal nail designs, before/after transformations
Blog: "2024 Hair Color Trends", "Nail Care Tips"
```

### Restaurant (Express Company)
```text
Services: Dine-In, Takeout, Catering, Private Events
FAQs: "Do you accommodate dietary restrictions?", "How far in advance for catering?"
Social: Daily specials, new menu items, customer photos
Blog: "Our Story", "Authentic Spanish Recipes"
```

### Personal Assistant (Flow Company)
```text
Services: Calendar Management, Task Scheduling, Appointment Setting, Reminder Services
FAQs: "How do I sync my calendar?", "Can you manage multiple schedules?"
Social: Productivity tips, time management advice
Blog: "Work-Life Balance Guide", "Digital Organization Tips"
```

### Real Estate (Core Company)
```text
Services: Home Buying, Home Selling, Rental Assistance, Market Analysis
FAQs: "What's the first step in buying a home?", "How do you price a home?"
Social: New listings, market updates, home buying tips
Blog: "Austin Real Estate Market Update", "First-Time Buyer Guide"
```

---

## Phase 5: Implementation Files

### Files to Modify

| File | Purpose |
|------|---------|
| `supabase/functions/create-demo-accounts/index.ts` | Add Flow/Core companies and users |
| `src/pages/DemoAccounts.tsx` | Add Flow/Core credentials display |

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/seed-demo-data/index.ts` | Edge function to seed all demo data |

### Database Operations

1. **Insert 2 new companies** (Flow and Core)
2. **Update existing companies** with business-specific metadata
3. **Insert demo data** for all 7 companies across all tables

---

## Phase 6: Edge Function Design

The `seed-demo-data` edge function will:

1. Accept company ID or "all" parameter
2. Clear existing demo data (optional flag)
3. Insert industry-specific data based on company type
4. Return summary of seeded records

### Function Signature
```typescript
POST /seed-demo-data
Body: {
  companyId?: string,  // specific company or omit for all
  clearExisting?: boolean,  // remove existing data first
  categories?: string[]  // specific categories to seed
}
```

---

## Technical Details

### Company IDs (Existing)
```text
solo: 8fafcec0-4b2a-45a1-8663-f9ccb5afc545
multi: 4f85ed98-0e98-480c-b904-1c33424e26ad
cmd: 298a7275-0a1f-4bd8-a0ae-b692fdbcd3af
halo: 56c0a3a8-a2a1-4689-9c18-d115080a816d
xprs: d4a6c195-c89a-4208-a818-981902af6c51
```

### New Company IDs
Will be generated during migration for Flow and Core companies.

### Data Volume Per Company
- AI Profile: 1 record
- Services: 4-6 records
- FAQs: 5-8 records
- Business Hours: 7 records (one per day)
- Appointments: 5-10 records
- Leads: 3-5 records
- Campaigns: 3 records
- Social Posts: 3 records
- Blog Posts: 2-3 records
- Smart Website: 1 record
- Customer Profiles: 3-5 records

**Total per company**: ~40-55 records
**Total for all 7 companies**: ~280-385 records

---

## Execution Order

1. Create database migration for Flow and Core companies
2. Update `create-demo-accounts` edge function
3. Deploy edge function and create new users
4. Create `seed-demo-data` edge function
5. Deploy and execute seeding for all companies
6. Update `DemoAccounts.tsx` UI
7. Verify all demo dashboards have data
