
-- Remove healthcare verticals: industry packs, demo companies, demo auth users.

-- 1. Delete the 6 healthcare industry template packs.
DELETE FROM public.industry_template_packs
WHERE industry_id IN (
  'medical_office','dental','veterinary','chiropractic','optometry','physical_therapy'
);

-- 2. Delete the 6 healthcare demo companies (FKs cascade across child tables).
DELETE FROM public.companies
WHERE industry_vertical IN (
  'medical_office','dental','veterinary','chiropractic','optometry','physical_therapy'
);

-- 3. Delete the 18 healthcare demo auth users.
DELETE FROM auth.users
WHERE email IN (
  'medicalofficeadmin@demo.com','medicalofficeemployee@demo.com','medicalofficecustomer@demo.com',
  'dentaladmin@demo.com','dentalemployee@demo.com','dentalcustomer@demo.com',
  'veterinaryadmin@demo.com','veterinaryemployee@demo.com','veterinarycustomer@demo.com',
  'chiropracticadmin@demo.com','chiropracticemployee@demo.com','chiropracticcustomer@demo.com',
  'optometryadmin@demo.com','optometryemployee@demo.com','optometrycustomer@demo.com',
  'physicaltherapyadmin@demo.com','physicaltherapyemployee@demo.com','physicaltherapycustomer@demo.com'
);
