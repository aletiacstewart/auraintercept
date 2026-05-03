
ALTER TABLE public.industry_template_packs
  ADD COLUMN IF NOT EXISTS service_catalog jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS service_type_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_intake_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS inventory_taxonomy jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quote_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS invoice_template jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS intake_schema_overrides jsonb NULL;

DROP FUNCTION IF EXISTS public.get_public_industry_pack(uuid);

CREATE FUNCTION public.get_public_industry_pack(p_company_id uuid)
RETURNS TABLE(
  industry_id text,
  label text,
  job_templates jsonb,
  form_schemas jsonb,
  terminology jsonb,
  service_catalog jsonb,
  service_type_options jsonb,
  appointment_rules jsonb,
  customer_intake_schema jsonb,
  inventory_taxonomy jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT itp.industry_id, itp.label, itp.job_templates, itp.form_schemas, itp.terminology,
         itp.service_catalog, itp.service_type_options, itp.appointment_rules,
         itp.customer_intake_schema, itp.inventory_taxonomy
  FROM public.companies c
  JOIN public.industry_template_packs itp
    ON itp.industry_id = c.industry_vertical AND itp.is_active = true
  WHERE c.id = p_company_id LIMIT 1;
$$;

-- DENTAL
UPDATE public.industry_template_packs SET
  label='Dental Practice', icon='Tooth',
  description='Dental offices: cleanings, exams, restorative, hygiene recall.',
  terminology=jsonb_build_object('customer_singular','Patient','customer_plural','Patients','job_singular','Appointment','job_plural','Appointments','employee_singular','Provider','employee_plural','Providers','service_singular','Procedure','service_plural','Procedures'),
  appointment_rules=jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',60,'business_hours',jsonb_build_object('start','08:00','end','17:00','interval_minutes',30),'reminder_channels',jsonb_build_array('sms','email','call'),'lead_time_minutes',60,'buffer_minutes',10,'recurring_supported',true,'default_service_type','In-Office'),
  service_type_options=jsonb_build_array('In-Office','Tele-dentistry Consult','Emergency'),
  service_catalog=jsonb_build_array(
    jsonb_build_object('name','New Patient Exam','category','Exam','default_duration_minutes',60,'default_service_type','In-Office'),
    jsonb_build_object('name','Routine Cleaning','category','Hygiene','default_duration_minutes',45,'default_service_type','In-Office'),
    jsonb_build_object('name','Deep Cleaning (SRP)','category','Hygiene','default_duration_minutes',90,'default_service_type','In-Office'),
    jsonb_build_object('name','Filling','category','Restorative','default_duration_minutes',45,'default_service_type','In-Office'),
    jsonb_build_object('name','Crown Prep','category','Restorative','default_duration_minutes',90,'default_service_type','In-Office'),
    jsonb_build_object('name','Crown Seat','category','Restorative','default_duration_minutes',60,'default_service_type','In-Office'),
    jsonb_build_object('name','Extraction','category','Surgical','default_duration_minutes',45,'default_service_type','In-Office'),
    jsonb_build_object('name','Whitening','category','Cosmetic','default_duration_minutes',60,'default_service_type','In-Office'),
    jsonb_build_object('name','Emergency Visit','category','Urgent','default_duration_minutes',45,'default_service_type','Emergency')
  ),
  customer_intake_schema=jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','date_of_birth','label','Date of Birth','type','date','required',true),
    jsonb_build_object('key','insurance_carrier','label','Dental Insurance Carrier','type','text','required',false),
    jsonb_build_object('key','member_id','label','Member ID','type','text','required',false),
    jsonb_build_object('key','last_visit','label','Last Dental Visit','type','date','required',false),
    jsonb_build_object('key','chief_complaint','label','Reason for Visit','type','textarea','required',false)
  )),
  inventory_taxonomy=jsonb_build_object('label','Operatory Supplies','categories',jsonb_build_array('Anesthetics','Burs & Disposables','Impression Materials','Restorative','PPE','Sterilization','Office Supplies'),'units',jsonb_build_array('box','case','each','pack')),
  console_visibility=jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  job_templates=jsonb_build_array(
    jsonb_build_object('id','dental_exam','name','New Patient Exam','duration_minutes',60),
    jsonb_build_object('id','dental_cleaning','name','Routine Cleaning','duration_minutes',45),
    jsonb_build_object('id','dental_crown','name','Crown','duration_minutes',90)
  ),
  kb_seed_documents=jsonb_build_array(
    jsonb_build_object('name','Pre-Appointment Instructions','content','Please arrive 15 minutes early to complete intake. Bring insurance card and photo ID.','faqs',jsonb_build_array(
      jsonb_build_object('question','Do you accept my insurance?','answer','We accept most PPO plans. Please call to verify your specific carrier and plan.','category','insurance'),
      jsonb_build_object('question','How often should I get a cleaning?','answer','Most patients benefit from a cleaning every 6 months.','category','hygiene')
    )),
    jsonb_build_object('name','HIPAA Notice','content','We protect patient health information per HIPAA. Records requests must be submitted in writing.')
  )
WHERE industry_id='dental';

-- CHIROPRACTIC
UPDATE public.industry_template_packs SET
  label='Chiropractic', icon='Activity',
  description='Chiropractic clinics: adjustments, evaluations, therapy.',
  terminology=jsonb_build_object('customer_singular','Patient','customer_plural','Patients','job_singular','Appointment','job_plural','Appointments','employee_singular','Chiropractor','employee_plural','Chiropractors','service_singular','Treatment','service_plural','Treatments'),
  appointment_rules=jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',30,'business_hours',jsonb_build_object('start','08:00','end','18:00','interval_minutes',15),'reminder_channels',jsonb_build_array('sms','email'),'lead_time_minutes',30,'buffer_minutes',5,'recurring_supported',true,'default_service_type','In-Office'),
  service_type_options=jsonb_build_array('In-Office','Telehealth Consult'),
  service_catalog=jsonb_build_array(
    jsonb_build_object('name','New Patient Evaluation','category','Evaluation','default_duration_minutes',60,'default_service_type','In-Office'),
    jsonb_build_object('name','Adjustment','category','Treatment','default_duration_minutes',20,'default_service_type','In-Office'),
    jsonb_build_object('name','Adjustment + Therapy','category','Treatment','default_duration_minutes',45,'default_service_type','In-Office'),
    jsonb_build_object('name','Massage Therapy','category','Therapy','default_duration_minutes',60,'default_service_type','In-Office'),
    jsonb_build_object('name','Re-Examination','category','Evaluation','default_duration_minutes',30,'default_service_type','In-Office')
  ),
  customer_intake_schema=jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','date_of_birth','label','Date of Birth','type','date','required',true),
    jsonb_build_object('key','pain_area','label','Primary Pain Area','type','text','required',false),
    jsonb_build_object('key','pain_scale','label','Pain Level (0-10)','type','number','required',false),
    jsonb_build_object('key','insurance_carrier','label','Insurance Carrier','type','text','required',false),
    jsonb_build_object('key','referring_provider','label','Referring Provider','type','text','required',false)
  )),
  inventory_taxonomy=jsonb_build_object('label','Clinic Supplies','categories',jsonb_build_array('Therapy Supplies','Supports & Braces','PPE','Office Supplies'),'units',jsonb_build_array('box','case','each')),
  console_visibility=jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  job_templates=jsonb_build_array(jsonb_build_object('id','chiro_eval','name','New Patient Eval','duration_minutes',60),jsonb_build_object('id','chiro_adj','name','Adjustment','duration_minutes',20)),
  kb_seed_documents=jsonb_build_array(
    jsonb_build_object('name','First Visit Guide','content','Wear loose comfortable clothing. Plan for 60 minutes for your evaluation.','faqs',jsonb_build_array(jsonb_build_object('question','How many visits will I need?','answer','Most treatment plans range 6-12 visits. Your provider will recommend a personalized plan after evaluation.','category','treatment'))),
    jsonb_build_object('name','HIPAA Notice','content','We protect patient health information per HIPAA.')
  )
WHERE industry_id='chiropractic';

-- MEDICAL OFFICE
UPDATE public.industry_template_packs SET
  label='Medical Office', icon='Stethoscope',
  description='Primary care and specialty medical offices.',
  terminology=jsonb_build_object('customer_singular','Patient','customer_plural','Patients','job_singular','Appointment','job_plural','Appointments','employee_singular','Provider','employee_plural','Providers','service_singular','Visit','service_plural','Visits'),
  appointment_rules=jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',20,'business_hours',jsonb_build_object('start','08:00','end','17:00','interval_minutes',15),'reminder_channels',jsonb_build_array('sms','email','call'),'lead_time_minutes',60,'buffer_minutes',5,'recurring_supported',true,'default_service_type','In-Office'),
  service_type_options=jsonb_build_array('In-Office','Telehealth','Annual Wellness'),
  service_catalog=jsonb_build_array(
    jsonb_build_object('name','New Patient Visit','category','Established Care','default_duration_minutes',45,'default_service_type','In-Office'),
    jsonb_build_object('name','Follow-up Visit','category','Follow-up','default_duration_minutes',20,'default_service_type','In-Office'),
    jsonb_build_object('name','Annual Wellness Exam','category','Preventive','default_duration_minutes',45,'default_service_type','Annual Wellness'),
    jsonb_build_object('name','Telehealth Visit','category','Virtual','default_duration_minutes',20,'default_service_type','Telehealth'),
    jsonb_build_object('name','Sick Visit','category','Acute','default_duration_minutes',20,'default_service_type','In-Office')
  ),
  customer_intake_schema=jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','date_of_birth','label','Date of Birth','type','date','required',true),
    jsonb_build_object('key','insurance_carrier','label','Insurance Carrier','type','text','required',false),
    jsonb_build_object('key','member_id','label','Member ID','type','text','required',false),
    jsonb_build_object('key','primary_concern','label','Reason for Visit','type','textarea','required',false),
    jsonb_build_object('key','preferred_pharmacy','label','Preferred Pharmacy','type','text','required',false)
  )),
  inventory_taxonomy=jsonb_build_object('label','Clinic Supplies','categories',jsonb_build_array('Exam Room Supplies','PPE','Lab Collection','Vaccines (refrigerated)','Office Supplies'),'units',jsonb_build_array('box','case','each','vial')),
  console_visibility=jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  job_templates=jsonb_build_array(jsonb_build_object('id','med_new_patient','name','New Patient Visit','duration_minutes',45),jsonb_build_object('id','med_followup','name','Follow-up','duration_minutes',20)),
  kb_seed_documents=jsonb_build_array(
    jsonb_build_object('name','Visit Preparation','content','Bring photo ID, insurance card, and a list of current medications.','faqs',jsonb_build_array(jsonb_build_object('question','Do you offer telehealth?','answer','Yes — telehealth is available for many follow-up and consultation visit types. Ask when booking.','category','telehealth'))),
    jsonb_build_object('name','HIPAA Notice','content','We protect patient health information per HIPAA.')
  )
WHERE industry_id='medical_office';

-- PHYSICAL THERAPY
UPDATE public.industry_template_packs SET
  label='Physical Therapy', icon='Dumbbell',
  description='Physical therapy and rehabilitation clinics.',
  terminology=jsonb_build_object('customer_singular','Patient','customer_plural','Patients','job_singular','Appointment','job_plural','Appointments','employee_singular','Therapist','employee_plural','Therapists','service_singular','Session','service_plural','Sessions'),
  appointment_rules=jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',45,'business_hours',jsonb_build_object('start','07:00','end','19:00','interval_minutes',30),'reminder_channels',jsonb_build_array('sms','email'),'lead_time_minutes',60,'buffer_minutes',10,'recurring_supported',true,'default_service_type','In-Clinic'),
  service_type_options=jsonb_build_array('In-Clinic','Home Visit','Telehealth'),
  service_catalog=jsonb_build_array(
    jsonb_build_object('name','Initial Evaluation','category','Evaluation','default_duration_minutes',60,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Treatment Session','category','Treatment','default_duration_minutes',45,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Re-Evaluation','category','Evaluation','default_duration_minutes',45,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Manual Therapy','category','Treatment','default_duration_minutes',45,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Home Visit Session','category','Treatment','default_duration_minutes',60,'default_service_type','Home Visit')
  ),
  customer_intake_schema=jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','date_of_birth','label','Date of Birth','type','date','required',true),
    jsonb_build_object('key','injury_area','label','Injury / Pain Area','type','text','required',true),
    jsonb_build_object('key','referring_provider','label','Referring Provider','type','text','required',false),
    jsonb_build_object('key','insurance_carrier','label','Insurance Carrier','type','text','required',false),
    jsonb_build_object('key','goals','label','Treatment Goals','type','textarea','required',false)
  )),
  inventory_taxonomy=jsonb_build_object('label','Clinic Supplies','categories',jsonb_build_array('Therapy Bands','Modalities','Supports & Braces','PPE','Office Supplies'),'units',jsonb_build_array('box','case','each')),
  console_visibility=jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  job_templates=jsonb_build_array(jsonb_build_object('id','pt_eval','name','Initial Evaluation','duration_minutes',60),jsonb_build_object('id','pt_session','name','Treatment Session','duration_minutes',45)),
  kb_seed_documents=jsonb_build_array(
    jsonb_build_object('name','First Session Guide','content','Wear comfortable, athletic clothing. Bring referral and imaging if available.','faqs',jsonb_build_array(jsonb_build_object('question','Do I need a referral?','answer','Most insurance plans cover direct access. Some plans require a physician referral — call to verify.','category','referral'))),
    jsonb_build_object('name','HIPAA Notice','content','We protect patient health information per HIPAA.')
  )
WHERE industry_id='physical_therapy';

-- OPTOMETRY
UPDATE public.industry_template_packs SET
  label='Optometry', icon='Eye',
  description='Optometry: eye exams, contact lens fittings, eyewear.',
  terminology=jsonb_build_object('customer_singular','Patient','customer_plural','Patients','job_singular','Appointment','job_plural','Appointments','employee_singular','Optometrist','employee_plural','Optometrists','service_singular','Exam','service_plural','Exams'),
  appointment_rules=jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',30,'business_hours',jsonb_build_object('start','09:00','end','18:00','interval_minutes',30),'reminder_channels',jsonb_build_array('sms','email','call'),'lead_time_minutes',60,'buffer_minutes',5,'recurring_supported',true,'default_service_type','In-Office'),
  service_type_options=jsonb_build_array('In-Office','Contact Lens Fitting','Eyewear Pickup'),
  service_catalog=jsonb_build_array(
    jsonb_build_object('name','Comprehensive Eye Exam','category','Exam','default_duration_minutes',45,'default_service_type','In-Office'),
    jsonb_build_object('name','Contact Lens Exam','category','Exam','default_duration_minutes',45,'default_service_type','Contact Lens Fitting'),
    jsonb_build_object('name','Contact Lens Follow-up','category','Follow-up','default_duration_minutes',15,'default_service_type','Contact Lens Fitting'),
    jsonb_build_object('name','Eyewear Fitting/Pickup','category','Eyewear','default_duration_minutes',20,'default_service_type','Eyewear Pickup'),
    jsonb_build_object('name','Diabetic Eye Exam','category','Exam','default_duration_minutes',45,'default_service_type','In-Office')
  ),
  customer_intake_schema=jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','date_of_birth','label','Date of Birth','type','date','required',true),
    jsonb_build_object('key','vision_insurance','label','Vision Insurance','type','text','required',false),
    jsonb_build_object('key','medical_insurance','label','Medical Insurance','type','text','required',false),
    jsonb_build_object('key','last_exam_date','label','Last Eye Exam','type','date','required',false),
    jsonb_build_object('key','contact_wearer','label','Currently wears contacts?','type','boolean','required',false)
  )),
  inventory_taxonomy=jsonb_build_object('label','Optical Inventory','categories',jsonb_build_array('Frames','Contact Lenses','Solutions','Office Supplies'),'units',jsonb_build_array('pair','box','case','each')),
  console_visibility=jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  job_templates=jsonb_build_array(jsonb_build_object('id','opt_exam','name','Eye Exam','duration_minutes',45),jsonb_build_object('id','opt_cl','name','Contact Lens Fitting','duration_minutes',45)),
  kb_seed_documents=jsonb_build_array(
    jsonb_build_object('name','Exam Day Tips','content','Bring current glasses/contacts and your insurance information. Plan for ~1 hour.','faqs',jsonb_build_array(jsonb_build_object('question','How often should I get an eye exam?','answer','Most adults benefit from an exam every 1-2 years; annually if you wear contacts or have a medical condition.','category','exam'))),
    jsonb_build_object('name','HIPAA Notice','content','We protect patient health information per HIPAA.')
  )
WHERE industry_id='optometry';

-- VETERINARY
UPDATE public.industry_template_packs SET
  label='Veterinary', icon='PawPrint',
  description='Veterinary clinics: wellness, sick visits, surgery, dental.',
  terminology=jsonb_build_object('customer_singular','Pet Parent','customer_plural','Pet Parents','job_singular','Appointment','job_plural','Appointments','employee_singular','Veterinarian','employee_plural','Veterinarians','service_singular','Visit','service_plural','Visits'),
  appointment_rules=jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',30,'business_hours',jsonb_build_object('start','08:00','end','18:00','interval_minutes',30),'reminder_channels',jsonb_build_array('sms','email','call'),'lead_time_minutes',60,'buffer_minutes',10,'recurring_supported',true,'default_service_type','In-Clinic'),
  service_type_options=jsonb_build_array('In-Clinic','House Call','Telehealth'),
  service_catalog=jsonb_build_array(
    jsonb_build_object('name','Wellness Exam','category','Wellness','default_duration_minutes',30,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Vaccination Visit','category','Wellness','default_duration_minutes',20,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Sick Visit','category','Acute','default_duration_minutes',30,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Dental Cleaning (anesthesia)','category','Surgical','default_duration_minutes',120,'default_service_type','In-Clinic'),
    jsonb_build_object('name','Spay/Neuter','category','Surgical','default_duration_minutes',120,'default_service_type','In-Clinic'),
    jsonb_build_object('name','House Call Visit','category','Wellness','default_duration_minutes',45,'default_service_type','House Call')
  ),
  customer_intake_schema=jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','pets','label','Pets (name, species, breed, age)','type','json','required',true),
    jsonb_build_object('key','primary_concern','label','Reason for Visit','type','textarea','required',false),
    jsonb_build_object('key','preferred_pharmacy','label','Preferred Pet Pharmacy','type','text','required',false)
  )),
  inventory_taxonomy=jsonb_build_object('label','Clinic Supplies','categories',jsonb_build_array('Vaccines (refrigerated)','Pharmacy','Surgical Supplies','PPE','Food/Diet','Office Supplies'),'units',jsonb_build_array('box','case','each','vial','bag')),
  console_visibility=jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  job_templates=jsonb_build_array(jsonb_build_object('id','vet_wellness','name','Wellness Exam','duration_minutes',30),jsonb_build_object('id','vet_dental','name','Dental Cleaning','duration_minutes',120)),
  kb_seed_documents=jsonb_build_array(
    jsonb_build_object('name','First Visit Guide','content','Please bring vaccination records and any prior medical history.','faqs',jsonb_build_array(
      jsonb_build_object('question','Do you offer house calls?','answer','Yes — house calls are available within our service area for an additional fee.','category','house_call'),
      jsonb_build_object('question','Do you take walk-ins?','answer','We prioritize scheduled appointments. Urgent cases — call ahead and we will fit you in.','category','urgent')
    )),
    jsonb_build_object('name','Boarding & Grooming','content','Boarding/grooming services are NOT offered at this clinic.')
  )
WHERE industry_id='veterinary';

-- Add 3 missing booking packs
INSERT INTO public.industry_template_packs (
  industry_id, cluster, label, icon, description,
  terminology, appointment_rules, service_type_options, service_catalog,
  customer_intake_schema, inventory_taxonomy, console_visibility,
  job_templates, kb_seed_documents
) VALUES
('salon','booking','Salon & Spa','Scissors','Hair, nails, spa, and beauty services.',
  jsonb_build_object('customer_singular','Guest','customer_plural','Guests','job_singular','Appointment','job_plural','Appointments','employee_singular','Stylist','employee_plural','Stylists','service_singular','Service','service_plural','Services'),
  jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',60,'business_hours',jsonb_build_object('start','09:00','end','20:00','interval_minutes',15),'reminder_channels',jsonb_build_array('sms','email'),'lead_time_minutes',60,'buffer_minutes',10,'recurring_supported',true,'default_service_type','In-Salon'),
  jsonb_build_array('In-Salon','Mobile/On-Location','Bridal'),
  jsonb_build_array(
    jsonb_build_object('name','Haircut','category','Hair','default_duration_minutes',45,'default_service_type','In-Salon'),
    jsonb_build_object('name','Color','category','Hair','default_duration_minutes',120,'default_service_type','In-Salon'),
    jsonb_build_object('name','Highlights','category','Hair','default_duration_minutes',150,'default_service_type','In-Salon'),
    jsonb_build_object('name','Blowout','category','Hair','default_duration_minutes',45,'default_service_type','In-Salon'),
    jsonb_build_object('name','Manicure','category','Nails','default_duration_minutes',45,'default_service_type','In-Salon'),
    jsonb_build_object('name','Pedicure','category','Nails','default_duration_minutes',60,'default_service_type','In-Salon'),
    jsonb_build_object('name','Facial','category','Spa','default_duration_minutes',60,'default_service_type','In-Salon'),
    jsonb_build_object('name','Massage','category','Spa','default_duration_minutes',60,'default_service_type','In-Salon'),
    jsonb_build_object('name','Bridal Package','category','Special','default_duration_minutes',180,'default_service_type','Bridal')
  ),
  jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','preferred_stylist','label','Preferred Stylist','type','text','required',false),
    jsonb_build_object('key','allergies','label','Allergies / Sensitivities','type','text','required',false),
    jsonb_build_object('key','referral_source','label','How did you hear about us?','type','text','required',false)
  )),
  jsonb_build_object('label','Retail & Back Bar','categories',jsonb_build_array('Color & Lightener','Shampoo & Conditioner','Styling Products','Nail Products','Retail','Tools & Supplies'),'units',jsonb_build_array('bottle','tube','each','case')),
  jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  jsonb_build_array(jsonb_build_object('id','salon_cut','name','Haircut','duration_minutes',45)),
  jsonb_build_array(jsonb_build_object('name','Booking Policies','content','24-hour cancellation policy. Late arrivals over 15 minutes may need to reschedule.'))
),
('fitness','booking','Fitness Studio','Dumbbell','Personal training, classes, memberships.',
  jsonb_build_object('customer_singular','Member','customer_plural','Members','job_singular','Session','job_plural','Sessions','employee_singular','Trainer','employee_plural','Trainers','service_singular','Class','service_plural','Classes'),
  jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',60,'business_hours',jsonb_build_object('start','05:00','end','22:00','interval_minutes',30),'reminder_channels',jsonb_build_array('sms','email'),'lead_time_minutes',30,'buffer_minutes',5,'recurring_supported',true,'default_service_type','In-Studio'),
  jsonb_build_array('In-Studio','Virtual','Outdoor'),
  jsonb_build_array(
    jsonb_build_object('name','Personal Training (1-on-1)','category','Training','default_duration_minutes',60,'default_service_type','In-Studio'),
    jsonb_build_object('name','Small Group Training','category','Training','default_duration_minutes',60,'default_service_type','In-Studio'),
    jsonb_build_object('name','Group Class','category','Class','default_duration_minutes',45,'default_service_type','In-Studio'),
    jsonb_build_object('name','Yoga','category','Class','default_duration_minutes',60,'default_service_type','In-Studio'),
    jsonb_build_object('name','Free Intro Session','category','Onboarding','default_duration_minutes',45,'default_service_type','In-Studio'),
    jsonb_build_object('name','Virtual Coaching','category','Training','default_duration_minutes',45,'default_service_type','Virtual')
  ),
  jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','date_of_birth','label','Date of Birth','type','date','required',true),
    jsonb_build_object('key','membership_tier','label','Membership Tier','type','text','required',false),
    jsonb_build_object('key','goals','label','Fitness Goals','type','textarea','required',false),
    jsonb_build_object('key','injuries','label','Injuries / Conditions','type','textarea','required',false),
    jsonb_build_object('key','emergency_contact','label','Emergency Contact','type','text','required',false)
  )),
  jsonb_build_object('label','Studio Inventory','categories',jsonb_build_array('Equipment','Apparel','Supplements','Cleaning','Office Supplies'),'units',jsonb_build_array('each','case','bottle')),
  jsonb_build_object('field_ops',false,'inventory',true,'business_management',true),
  jsonb_build_array(jsonb_build_object('id','fit_pt','name','Personal Training','duration_minutes',60)),
  jsonb_build_array(jsonb_build_object('name','Studio Policies','content','Please arrive 10 minutes early. Cancellations require 12 hours notice.'))
),
('professional','booking','Professional Services','Briefcase','Consulting, legal, accounting, coaching.',
  jsonb_build_object('customer_singular','Client','customer_plural','Clients','job_singular','Meeting','job_plural','Meetings','employee_singular','Consultant','employee_plural','Consultants','service_singular','Engagement','service_plural','Engagements'),
  jsonb_build_object('address_required',false,'allow_appointments',true,'default_duration_minutes',45,'business_hours',jsonb_build_object('start','08:00','end','18:00','interval_minutes',30),'reminder_channels',jsonb_build_array('email','sms'),'lead_time_minutes',60,'buffer_minutes',15,'recurring_supported',true,'default_service_type','Virtual'),
  jsonb_build_array('Virtual','In-Office','On-Site'),
  jsonb_build_array(
    jsonb_build_object('name','Discovery Call','category','Consultation','default_duration_minutes',30,'default_service_type','Virtual'),
    jsonb_build_object('name','Strategy Session','category','Consultation','default_duration_minutes',60,'default_service_type','Virtual'),
    jsonb_build_object('name','Coaching Session','category','Coaching','default_duration_minutes',60,'default_service_type','Virtual'),
    jsonb_build_object('name','Document Review','category','Service','default_duration_minutes',45,'default_service_type','Virtual'),
    jsonb_build_object('name','On-Site Consult','category','Consultation','default_duration_minutes',90,'default_service_type','On-Site')
  ),
  jsonb_build_object('fields',jsonb_build_array(
    jsonb_build_object('key','company','label','Company / Organization','type','text','required',false),
    jsonb_build_object('key','role','label','Role / Title','type','text','required',false),
    jsonb_build_object('key','engagement_type','label','Type of Engagement','type','text','required',false),
    jsonb_build_object('key','timeline','label','Project Timeline','type','text','required',false)
  )),
  jsonb_build_object('label','Office Supplies','categories',jsonb_build_array('Office Supplies','Subscriptions','Marketing Materials'),'units',jsonb_build_array('each','case','license')),
  jsonb_build_object('field_ops',false,'inventory',false,'business_management',true),
  jsonb_build_array(jsonb_build_object('id','prof_discovery','name','Discovery Call','duration_minutes',30)),
  jsonb_build_array(jsonb_build_object('name','Engagement Process','content','We start every engagement with a discovery call to ensure fit, then propose a scoped plan.'))
)
ON CONFLICT (industry_id) DO UPDATE SET
  service_catalog=EXCLUDED.service_catalog,
  service_type_options=EXCLUDED.service_type_options,
  customer_intake_schema=EXCLUDED.customer_intake_schema,
  inventory_taxonomy=EXCLUDED.inventory_taxonomy,
  appointment_rules=EXCLUDED.appointment_rules,
  terminology=EXCLUDED.terminology,
  console_visibility=EXCLUDED.console_visibility,
  updated_at=now();

-- Restaurants: disable appointments
UPDATE public.industry_template_packs
SET appointment_rules = appointment_rules || jsonb_build_object('allow_appointments',false,'address_required',false),
    console_visibility = console_visibility || jsonb_build_object('field_ops',false)
WHERE industry_id='restaurants';

-- Backfill business_hours / reminder_channels / allow_appointments
UPDATE public.industry_template_packs
SET appointment_rules = appointment_rules || jsonb_build_object('business_hours',jsonb_build_object('start','08:00','end','18:00','interval_minutes',30))
WHERE NOT (appointment_rules ? 'business_hours');

UPDATE public.industry_template_packs
SET appointment_rules = appointment_rules || jsonb_build_object('reminder_channels',jsonb_build_array('sms','email'))
WHERE NOT (appointment_rules ? 'reminder_channels');

UPDATE public.industry_template_packs
SET appointment_rules = appointment_rules || jsonb_build_object('allow_appointments',true)
WHERE NOT (appointment_rules ? 'allow_appointments') AND industry_id <> 'restaurants';

-- seed_company_starter_data
CREATE OR REPLACE FUNCTION public.seed_company_starter_data(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_pack public.industry_template_packs%ROWTYPE;
  v_svc jsonb;
  v_existing int;
BEGIN
  SELECT itp.* INTO v_pack
  FROM public.companies c
  JOIN public.industry_template_packs itp
    ON itp.industry_id = c.industry_vertical AND itp.is_active = true
  WHERE c.id = p_company_id LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT count(*) INTO v_existing FROM public.services WHERE company_id = p_company_id;

  IF v_existing = 0
     AND v_pack.service_catalog IS NOT NULL
     AND jsonb_typeof(v_pack.service_catalog) = 'array' THEN
    FOR v_svc IN SELECT * FROM jsonb_array_elements(v_pack.service_catalog) LOOP
      INSERT INTO public.services (company_id, name, category, duration_minutes, service_type, is_active)
      VALUES (
        p_company_id,
        v_svc->>'name',
        COALESCE(v_svc->>'category','General'),
        COALESCE((v_svc->>'default_duration_minutes')::int, 60),
        COALESCE(v_svc->>'default_service_type','Standard'),
        false
      );
    END LOOP;
  END IF;

  PERFORM public.seed_industry_pack_kb_for_company(p_company_id);
END;
$$;
