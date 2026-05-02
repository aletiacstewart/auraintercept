
ALTER TABLE public.industry_template_packs
  ADD COLUMN IF NOT EXISTS console_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.industry_template_packs
SET console_visibility = jsonb_build_object(
  'field_ops','full','dispatch_map',true,'truck_inventory',true,'emergency_queue',true,
  'permit_tracker',true,'site_survey',false,'bay_scheduler',false,'route_map',false,
  'receptionist',false,'reservation_table',false,'showings_calendar',false,'chair_grid',false)
WHERE industry_id IN ('hvac','plumbing','electrical','appliance_repair','handyman','security_systems','construction');

UPDATE public.industry_template_packs
SET console_visibility = jsonb_build_object(
  'field_ops','route_mode','dispatch_map',true,'truck_inventory',false,'emergency_queue',false,
  'permit_tracker',false,'site_survey',false,'bay_scheduler',false,'route_map',true,
  'receptionist',false,'reservation_table',false,'showings_calendar',false,'chair_grid',false)
WHERE industry_id IN ('landscape','pest_control','pool_spa');

UPDATE public.industry_template_packs
SET console_visibility = jsonb_build_object(
  'field_ops','full','dispatch_map',true,'truck_inventory',false,'emergency_queue',false,
  'permit_tracker',true,'site_survey',true,'bay_scheduler',false,'route_map',false,
  'receptionist',false,'reservation_table',false,'showings_calendar',false,'chair_grid',false)
WHERE industry_id IN ('roofing','solar','fencing');

UPDATE public.industry_template_packs
SET console_visibility = jsonb_build_object(
  'field_ops','full','dispatch_map',false,'truck_inventory',true,'emergency_queue',true,
  'permit_tracker',false,'site_survey',false,'bay_scheduler',true,'route_map',false,
  'receptionist',false,'reservation_table',false,'showings_calendar',false,'chair_grid',false)
WHERE industry_id = 'auto_care';

UPDATE public.industry_template_packs
SET console_visibility = jsonb_build_object(
  'field_ops','booking_mode','dispatch_map',false,'truck_inventory',false,'emergency_queue',false,
  'permit_tracker',false,'site_survey',false,'bay_scheduler',false,'route_map',false,
  'receptionist',true,'reservation_table',false,'showings_calendar',false,'chair_grid',false)
WHERE industry_id IN ('beauty_wellness','restaurants','real_estate','personal_assistant');

UPDATE public.industry_template_packs
SET console_visibility = console_visibility || '{"reservation_table":true}'::jsonb
WHERE industry_id = 'restaurants';

UPDATE public.industry_template_packs
SET console_visibility = console_visibility || '{"showings_calendar":true}'::jsonb
WHERE industry_id = 'real_estate';

UPDATE public.industry_template_packs
SET console_visibility = console_visibility || '{"chair_grid":true}'::jsonb
WHERE industry_id = 'beauty_wellness';
