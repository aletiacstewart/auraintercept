-- Create Demo Flow Company (Personal Assistant - using 'free' tier)
INSERT INTO public.companies (
  id, name, slug, email, phone, address, subscription_tier,
  service_area_cities, service_categories, brand_tone, created_at, updated_at
) VALUES (
  'b7d8e9f0-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
  'Demo Flow Company',
  'demo-flow',
  'companyflow@demo.com',
  '+15125551006',
  '600 Flow Street, Austin, TX 78701',
  'free',
  ARRAY['Austin'],
  ARRAY['Personal Assistant', 'Scheduling', 'Task Management'],
  'balanced',
  NOW(),
  NOW()
);

-- Create Demo Core Company (Real Estate - using 'core' tier)
INSERT INTO public.companies (
  id, name, slug, email, phone, address, subscription_tier,
  service_area_cities, service_categories, brand_tone, created_at, updated_at
) VALUES (
  'c8e9f0a1-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
  'Demo Core Company',
  'demo-core',
  'companycore@demo.com',
  '+15125551007',
  '700 Core Avenue, Austin, TX 78701',
  'core',
  ARRAY['Austin'],
  ARRAY['Real Estate', 'Home Sales', 'Rentals'],
  'balanced',
  NOW(),
  NOW()
);

-- Update existing companies with business-specific info
-- Demo Solo Company - HVAC
UPDATE public.companies SET
  service_area_cities = ARRAY['Austin'],
  service_categories = ARRAY['HVAC', 'AC Repair', 'AC Service', 'AC Installation'],
  brand_tone = 'balanced',
  address = COALESCE(address, '100 Solo Street, Austin, TX 78701')
WHERE slug = 'demo-solo';

-- Demo Multi Company - Plumbing
UPDATE public.companies SET
  service_area_cities = ARRAY['Austin'],
  service_categories = ARRAY['Plumbing', 'Leak Repair', 'Fixture Installation', 'Plumbing Services'],
  brand_tone = 'balanced',
  address = COALESCE(address, '200 Multi Avenue, Austin, TX 78701')
WHERE slug = 'demo-multi';

-- Demo Command Company - Electrical
UPDATE public.companies SET
  service_area_cities = ARRAY['Austin'],
  service_categories = ARRAY['Electrical', 'Electrical Repair', 'Electrical Service', 'Fixture Installation'],
  brand_tone = 'balanced',
  address = COALESCE(address, '300 Command Blvd, Austin, TX 78701')
WHERE slug = 'demo-cmd';

-- Demo Halo Company - Nail & Hair Salon
UPDATE public.companies SET
  service_area_cities = ARRAY['Austin'],
  service_categories = ARRAY['Salon', 'Nails', 'Haircuts', 'Styling'],
  brand_tone = 'balanced',
  address = COALESCE(address, '400 Halo Lane, Austin, TX 78701')
WHERE slug = 'demo-halo';

-- Demo Express Company - Restaurant
UPDATE public.companies SET
  service_area_cities = ARRAY['Austin'],
  service_categories = ARRAY['Restaurant', 'Dining', 'Catering', 'Spanish Cuisine'],
  brand_tone = 'balanced',
  address = COALESCE(address, '500 Express Way, Austin, TX 78701')
WHERE slug = 'demo-xprs';