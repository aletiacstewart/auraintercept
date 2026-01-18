import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, company_id, ...params } = await req.json();
    
    console.log(`[Voice Booking Agent] Action: ${action}, Company: ${company_id}`);
    console.log(`[Voice Booking Agent] Params:`, JSON.stringify(params));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let result;

    switch (action) {
      case 'get_services':
        result = await getServices(supabase, company_id);
        break;
      case 'get_available_dates':
        result = await getAvailableDates(supabase, company_id, params);
        break;
      case 'get_available_times':
        result = await getAvailableTimes(supabase, company_id, params);
        break;
      case 'book_appointment':
        result = await bookAppointmentWithAccountCreation(supabase, company_id, params);
        break;
      case 'validate_customer_info':
        result = await validateCustomerInfo(params);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[Voice Booking Agent] Result:`, JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Voice Booking Agent] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Get all active services for the company
async function getServices(supabase: any, companyId: string) {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[Voice Booking Agent] Error fetching services:', error);
    return { success: false, error: 'Failed to fetch services' };
  }

  const serviceList = services.map((s: any) => 
    `${s.name} (${s.duration_minutes} minutes${s.price ? `, $${s.price}` : ''})`
  ).join(', ');

  return { 
    success: true, 
    services,
    message: `Available services are: ${serviceList}`
  };
}

// Get available dates for the next 2 weeks
async function getAvailableDates(supabase: any, companyId: string, params: any) {
  // Support both service_name and service_type for compatibility
  const serviceName = params.service_name || params.service_type || params.serviceType;

  if (!serviceName) {
    return { success: false, error: 'Please specify which service you need.' };
  }

  // Get service details
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companyId)
    .ilike('name', `%${serviceName}%`)
    .eq('is_active', true)
    .single();

  if (!service) {
    return { success: false, error: `Service "${serviceName}" not found. Please ask which service they need.` };
  }

  // Get business hours
  const { data: businessHours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('company_id', companyId);

  // Get holiday closures
  const today = new Date();
  const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  const { data: closures } = await supabase
    .from('holiday_closures')
    .select('closure_date')
    .eq('company_id', companyId)
    .gte('closure_date', today.toISOString().split('T')[0])
    .lte('closure_date', twoWeeksLater.toISOString().split('T')[0]);

  const closedDates = new Set((closures || []).map((c: any) => c.closure_date));

  const availableDates: string[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Check if business is open on this day
    const hours = businessHours?.find((h: any) => h.day_of_week === dayOfWeek);
    if (hours && !hours.is_closed && !closedDates.has(dateStr)) {
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      availableDates.push(formattedDate);
    }
  }

  return { 
    success: true, 
    available_dates: availableDates.slice(0, 5), // Return first 5 available dates
    service: service.name,
    message: `For ${service.name}, we have availability on: ${availableDates.slice(0, 5).join(', ')}`
  };
}

// Get available time slots for a specific date
async function getAvailableTimes(supabase: any, companyId: string, params: any) {
  // Support both service_name and service_type for compatibility
  const serviceName = params.service_name || params.service_type || params.serviceType;
  const { date } = params;

  // Parse the date - handle various formats
  let parsedDate: Date;
  try {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      // Try parsing natural language dates
      const today = new Date();
      const lowerDate = date.toLowerCase();
      
      if (lowerDate.includes('today')) {
        parsedDate = today;
      } else if (lowerDate.includes('tomorrow')) {
        parsedDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // Try to extract date from natural language
        parsedDate = new Date(date);
      }
    }
  } catch {
    return { success: false, error: 'Could not understand the date. Please specify a valid date.' };
  }

  const dateStr = parsedDate.toISOString().split('T')[0];
  const dayOfWeek = parsedDate.getDay();

  // Get service
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companyId)
    .ilike('name', `%${serviceName}%`)
    .eq('is_active', true)
    .single();

  if (!service) {
    return { success: false, error: `Service "${serviceName}" not found.` };
  }

  // Get business hours
  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('company_id', companyId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!hours || hours.is_closed) {
    return { success: true, available_times: [], message: 'We are closed on that day. Please choose another date.' };
  }

  // Get available employees
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, availability_json')
    .eq('company_id', companyId);

  // Get time off for this date
  const { data: timeOff } = await supabase
    .from('employee_time_off')
    .select('employee_id')
    .eq('company_id', companyId)
    .eq('time_off_date', dateStr);

  const employeesOnTimeOff = new Set((timeOff || []).map((t: any) => t.employee_id));

  // Get existing appointments
  const startOfDay = `${dateStr}T00:00:00`;
  const endOfDay = `${dateStr}T23:59:59`;
  
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companyId)
    .gte('datetime', startOfDay)
    .lte('datetime', endOfDay)
    .neq('status', 'cancelled');

  // Calculate available slots
  const availableSlots: { time: string; employee_id: string; employee_name: string }[] = [];
  const serviceDuration = service.duration_minutes;

  for (const employee of employees || []) {
    if (employeesOnTimeOff.has(employee.id)) continue;

    const availability = employee.availability_json?.[dayName] || [];
    
    for (const slot of availability) {
      if (!slot.start || !slot.end) continue;

      let currentTime = new Date(`${dateStr}T${slot.start}:00`);
      const endTime = new Date(`${dateStr}T${slot.end}:00`);

      while (currentTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
        // Check for conflicts
        const hasConflict = (existingAppointments || []).some((apt: any) => {
          if (apt.employee_id !== employee.id) return false;
          const aptStart = new Date(apt.datetime).getTime();
          const aptEnd = aptStart + apt.duration_minutes * 60000;
          const slotStart = currentTime.getTime();
          const slotEnd = slotStart + serviceDuration * 60000;
          return !(slotEnd <= aptStart || slotStart >= aptEnd);
        });

        if (!hasConflict) {
          const timeStr = currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
          availableSlots.push({
            time: timeStr,
            employee_id: employee.id,
            employee_name: employee.full_name,
          });
        }

        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }
    }
  }

  // Sort by time
  availableSlots.sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`);
    const timeB = new Date(`2000-01-01 ${b.time}`);
    return timeA.getTime() - timeB.getTime();
  });

  // Get unique times
  const uniqueTimes = [...new Set(availableSlots.map(s => s.time))].slice(0, 6);

  const formattedDate = parsedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return { 
    success: true, 
    available_times: uniqueTimes,
    available_slots: availableSlots.slice(0, 10),
    date: formattedDate,
    date_iso: dateStr,
    service: service.name,
    message: uniqueTimes.length > 0 
      ? `On ${formattedDate}, we have availability at: ${uniqueTimes.join(', ')}`
      : `Sorry, no availability on ${formattedDate}. Please choose another date.`
  };
}

// Validate customer info format
async function validateCustomerInfo(params: any) {
  const { name, phone, email, address, issue } = params;
  const errors: string[] = [];

  if (!name || name.trim().length < 2) {
    errors.push('Please provide your full name');
  }

  if (!phone) {
    errors.push('Please provide a phone number');
  } else {
    // Basic phone validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.push('Please provide a valid phone number with area code');
    }
  }

  if (!email) {
    errors.push('Please provide an email address');
  } else if (!email.includes('@') || !email.includes('.')) {
    errors.push('Please provide a valid email address');
  }

  if (!address || address.trim().length < 5) {
    errors.push('Please provide your service address');
  }

  if (!issue || issue.trim().length < 3) {
    errors.push('Please describe the issue you are experiencing');
  }

  if (errors.length > 0) {
    return { 
      success: false, 
      valid: false,
      missing: errors,
      message: `I still need: ${errors.join(', ')}`
    };
  }

  return { 
    success: true, 
    valid: true,
    customer_info: { name, phone, email, address, issue },
    message: 'All customer information collected successfully'
  };
}

// Find existing customer by email, phone, or address
async function findExistingCustomer(supabase: any, companyId: string, email: string, phone: string, address: string) {
  // First try to find by email (most reliable identifier)
  if (email) {
    const { data: byEmail } = await supabase
      .from('customer_profiles')
      .select('id, name, email, phone, address, portal_token')
      .eq('company_id', companyId)
      .eq('email', email)
      .maybeSingle();
    
    if (byEmail) {
      console.log('[Voice Booking Agent] Found existing customer by email:', byEmail.id);
      return { profile: byEmail, matchedBy: 'email' };
    }
  }

  // Try to find by phone number (normalize phone for comparison)
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const { data: allProfiles } = await supabase
      .from('customer_profiles')
      .select('id, name, email, phone, address, portal_token')
      .eq('company_id', companyId)
      .not('phone', 'is', null);
    
    if (allProfiles) {
      const matchByPhone = allProfiles.find((p: any) => 
        p.phone && p.phone.replace(/\D/g, '') === cleanPhone
      );
      if (matchByPhone) {
        console.log('[Voice Booking Agent] Found existing customer by phone:', matchByPhone.id);
        return { profile: matchByPhone, matchedBy: 'phone' };
      }
    }
  }

  // Try to find by address (partial match)
  if (address && address.length > 10) {
    const addressParts = address.toLowerCase().split(/[\s,]+/).filter(p => p.length > 3);
    const { data: allProfiles } = await supabase
      .from('customer_profiles')
      .select('id, name, email, phone, address, portal_token')
      .eq('company_id', companyId)
      .not('address', 'is', null);
    
    if (allProfiles) {
      const matchByAddress = allProfiles.find((p: any) => {
        if (!p.address) return false;
        const profileAddress = p.address.toLowerCase();
        // Match if at least 3 address parts are found
        const matchCount = addressParts.filter(part => profileAddress.includes(part)).length;
        return matchCount >= 3;
      });
      if (matchByAddress) {
        console.log('[Voice Booking Agent] Found existing customer by address:', matchByAddress.id);
        return { profile: matchByAddress, matchedBy: 'address' };
      }
    }
  }

  return null;
}

// Find existing user account by email
async function findExistingUserAccount(supabase: any, email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle();
  
  if (profile) {
    // Check if they have customer role
    const { data: role } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', profile.id)
      .eq('role', 'customer')
      .maybeSingle();
    
    return { user: profile, hasCustomerRole: !!role };
  }
  
  return null;
}

// Book appointment with full customer account creation and notifications
async function bookAppointmentWithAccountCreation(supabase: any, companyId: string, params: any) {
  // Support both snake_case and camelCase for compatibility with different integrations
  const serviceName = params.service_name || params.service_type || params.serviceType;
  const date = params.date;
  const time = params.time;
  const customerName = params.customer_name || params.customerName;
  const customerEmail = params.customer_email || params.customerEmail;
  const customerPhone = params.customer_phone || params.customerPhone;
  const customerAddress = params.customer_address || params.customerAddress;
  const issueDescription = params.issue_description || params.notes || params.issueDescription;
  
  // Customer notification preferences (opt-in means they WANT notifications)
  const smsOptIn = params.sms_opt_in ?? params.smsOptIn;
  const emailOptIn = params.email_opt_in ?? params.emailOptIn;
  const callOptIn = params.call_opt_in ?? params.callOptIn;

  console.log('[Voice Booking Agent] Booking appointment with params:', {
    serviceName, date, time, customerName, customerEmail, customerPhone, customerAddress, issueDescription,
    smsOptIn, emailOptIn, callOptIn
  });

  // Validate all required fields
  if (!customerName || !customerPhone) {
    return { 
      success: false, 
      error: 'Missing customer information. Need at least: name and phone.' 
    };
  }

  // ===== STEP 1: Check for existing customer =====
  const existingCustomer = await findExistingCustomer(supabase, companyId, customerEmail, customerPhone, customerAddress);
  let customerProfileId: string | null = existingCustomer?.profile?.id || null;
  let customerToken = existingCustomer?.profile?.portal_token || crypto.randomUUID();
  let isReturningCustomer = !!existingCustomer;
  
  console.log('[Voice Booking Agent] Customer lookup result:', {
    isReturningCustomer,
    matchedBy: existingCustomer?.matchedBy,
    customerProfileId
  });

  // ===== STEP 2: Check for existing user account =====
  const existingUser = await findExistingUserAccount(supabase, customerEmail);
  let customerUserId: string | null = existingUser?.user?.id || null;
  let newAccountCreated = false;
  let tempPassword: string | null = null;

  console.log('[Voice Booking Agent] User account lookup:', {
    hasExistingUser: !!existingUser,
    hasCustomerRole: existingUser?.hasCustomerRole
  });

  // Get service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companyId)
    .ilike('name', `%${serviceName}%`)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    console.error('[Voice Booking Agent] Service not found:', serviceError);
    return { success: false, error: `Service "${serviceName}" not found` };
  }

  // Parse date and time
  let appointmentDateTime: Date;
  try {
    // Handle various date formats
    const dateStr = date.includes('T') ? date.split('T')[0] : date;
    const timeStr = time.replace(/\s*(AM|PM)/i, ' $1');
    appointmentDateTime = new Date(`${dateStr} ${timeStr}`);
    
    if (isNaN(appointmentDateTime.getTime())) {
      throw new Error('Invalid date/time');
    }
  } catch {
    return { success: false, error: 'Could not parse the date and time. Please confirm the appointment details.' };
  }

  // Get available slot with employee
  const dateIso = appointmentDateTime.toISOString().split('T')[0];
  const availabilityResult = await getAvailableTimes(supabase, companyId, {
    service_type: serviceName,
    date: dateIso
  });

  if (!availabilityResult.success || !availabilityResult.available_slots?.length) {
    return { success: false, error: 'No availability found for that time. Please choose another time.' };
  }

  // Find matching slot
  const requestedTime = appointmentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const matchingSlot = availabilityResult.available_slots.find((s: any) => 
    s.time.toLowerCase().replace(/\s+/g, '') === requestedTime.toLowerCase().replace(/\s+/g, '')
  );

  const assignedEmployeeId = matchingSlot?.employee_id || availabilityResult.available_slots[0]?.employee_id;
  const assignedEmployeeName = matchingSlot?.employee_name || availabilityResult.available_slots[0]?.employee_name;

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('name, default_sms_enabled, default_email_enabled, default_call_enabled')
    .eq('id', companyId)
    .single();

  // Use customer preferences if provided, otherwise fall back to company defaults
  // opt_out is the inverse of opt_in (true means don't send, false means do send)
  const smsOptOut = smsOptIn !== undefined ? !smsOptIn : !(company?.default_sms_enabled ?? true);
  const emailOptOut = emailOptIn !== undefined ? !emailOptIn : !(company?.default_email_enabled ?? true);
  const callOptOut = callOptIn !== undefined ? !callOptIn : !(company?.default_call_enabled ?? true);

  // ===== STEP 3: Create the appointment =====
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      company_id: companyId,
      employee_id: assignedEmployeeId,
      service_type: service.name,
      datetime: appointmentDateTime.toISOString(),
      duration_minutes: service.duration_minutes,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      customer_token: customerToken,
      notes: issueDescription || null,
      status: 'scheduled',
      sms_opt_out: smsOptOut,
      email_opt_out: emailOptOut,
      call_opt_out: callOptOut,
    })
    .select()
    .single();

  if (appointmentError) {
    console.error('[Voice Booking Agent] Appointment creation error:', appointmentError);
    return { success: false, error: 'Failed to book appointment. Please try again.' };
  }

  console.log('[Voice Booking Agent] Appointment created:', appointment.id);

  // ===== STEP 4: Create or update customer profile =====
  if (!customerProfileId) {
    // Create new customer profile
    const { data: newProfile } = await supabase
      .from('customer_profiles')
      .insert({
        company_id: companyId,
        email: customerEmail,
        phone: customerPhone,
        name: customerName,
        address: customerAddress,
        portal_token: customerToken,
      })
      .select('id')
      .single();
    
    customerProfileId = newProfile?.id;
    console.log('[Voice Booking Agent] Created new customer profile:', customerProfileId);
  } else {
    // Update existing profile with latest info
    await supabase
      .from('customer_profiles')
      .update({
        phone: customerPhone,
        name: customerName,
        address: customerAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerProfileId);
    
    console.log('[Voice Booking Agent] Updated existing customer profile:', customerProfileId);
  }

  // ===== STEP 5: Handle user account =====
  if (!existingUser && customerEmail) {
    // Create new customer user account
    tempPassword = generateTemporaryPassword();
    try {
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: customerName }
      });

      if (createError) {
        console.error('[Voice Booking Agent] Error creating user:', createError);
      } else {
        customerUserId = userData.user.id;
        newAccountCreated = true;

        // Assign customer role
        await supabase
          .from('user_roles')
          .insert({ user_id: customerUserId, role: 'customer' });

        // Create company association
        await supabase
          .from('customer_company_associations')
          .insert({
            customer_user_id: customerUserId,
            company_id: companyId,
            customer_profile_id: customerProfileId,
          });
        
        console.log('[Voice Booking Agent] Created new user account:', customerUserId);
      }
    } catch (e) {
      console.error('[Voice Booking Agent] Error in account creation:', e);
    }
  } else if (existingUser) {
    customerUserId = existingUser.user.id;
    
    // Ensure they have customer role
    if (!existingUser.hasCustomerRole) {
      await supabase
        .from('user_roles')
        .insert({ user_id: customerUserId, role: 'customer' });
    }

    // Ensure company association exists
    const { data: existingAssoc } = await supabase
      .from('customer_company_associations')
      .select('id')
      .eq('customer_user_id', customerUserId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!existingAssoc) {
      await supabase
        .from('customer_company_associations')
        .insert({
          customer_user_id: customerUserId,
          company_id: companyId,
          customer_profile_id: customerProfileId,
        });
    } else {
      // Update last interaction
      await supabase
        .from('customer_company_associations')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('id', existingAssoc.id);
    }
    
    console.log('[Voice Booking Agent] Using existing user account:', customerUserId);
  }

  // Get integrations for notifications
  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select('resend_api_key, twilio_account_sid, twilio_auth_token, twilio_phone_number')
    .eq('company_id', companyId)
    .maybeSingle();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const appointmentDateFormatted = appointmentDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const appointmentTimeFormatted = appointmentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Send customer confirmation email with account details
  if (integrations?.resend_api_key && customerEmail) {
    try {
      const resend = new Resend(integrations.resend_api_key);
      const companyName = company?.name || 'Our Business';

      let accountSection = '';
      if (newAccountCreated) {
        accountSection = `
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0369a1;">Your Customer Portal Account</h3>
            <p>We've created an account for you to manage your appointments:</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p style="color: #6b7280; font-size: 12px;">Please change your password after logging in.</p>
            <a href="${supabaseUrl?.replace('supabase.co', 'lovable.app')}/customer-auth" 
               style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
              Login to Portal
            </a>
          </div>
        `;
      }

      await resend.emails.send({
        from: `${companyName} <onboarding@resend.dev>`,
        to: [customerEmail],
        subject: `Appointment Confirmed - ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0ea5e9;">Appointment Confirmed!</h1>
            <p>Hi ${customerName},</p>
            <p>Your appointment has been successfully scheduled.</p>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Appointment Details</h3>
              <p><strong>Service:</strong> ${service.name}</p>
              <p><strong>Date:</strong> ${appointmentDateFormatted}</p>
              <p><strong>Time:</strong> ${appointmentTimeFormatted}</p>
              <p><strong>Technician:</strong> ${assignedEmployeeName || 'To be assigned'}</p>
              <p><strong>Address:</strong> ${customerAddress || 'Not provided'}</p>
              ${issueDescription ? `<p><strong>Issue:</strong> ${issueDescription}</p>` : ''}
            </div>
            
            ${accountSection}
            
            <p>If you need to reschedule or cancel, please contact us or use your customer portal.</p>
            <p>Thank you for choosing ${companyName}!</p>
          </div>
        `,
      });
      console.log('[Voice Booking Agent] Customer confirmation email sent');
    } catch (e) {
      console.error('[Voice Booking Agent] Error sending customer email:', e);
    }
  }

  // Send employee notification
  if (assignedEmployeeId) {
    const { data: employee } = await supabase
      .from('profiles')
      .select('email, phone_number, full_name, sms_notifications_enabled, email_notifications_enabled')
      .eq('id', assignedEmployeeId)
      .single();

    if (employee) {
      // Send employee email
      if (integrations?.resend_api_key && employee.email && employee.email_notifications_enabled !== false) {
        try {
          const resend = new Resend(integrations.resend_api_key);
          const companyName = company?.name || 'Our Business';

          await resend.emails.send({
            from: `${companyName} <onboarding@resend.dev>`,
            to: [employee.email],
            subject: `New Job Assignment - ${service.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #0ea5e9;">New Job Assignment</h1>
                <p>Hi ${employee.full_name},</p>
                <p>You have been assigned a new job.</p>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Job Details</h3>
                  <p><strong>Service:</strong> ${service.name}</p>
                  <p><strong>Date:</strong> ${appointmentDateFormatted}</p>
                  <p><strong>Time:</strong> ${appointmentTimeFormatted}</p>
                  <p><strong>Customer:</strong> ${customerName}</p>
                  <p><strong>Phone:</strong> ${customerPhone}</p>
                  <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
                  <p><strong>Address:</strong> ${customerAddress || 'Not provided'}</p>
                  ${issueDescription ? `<p><strong>Issue:</strong> ${issueDescription}</p>` : ''}
                </div>
                
                <p>Please log into your dashboard to accept this job.</p>
              </div>
            `,
          });
          console.log('[Voice Booking Agent] Employee email sent');
        } catch (e) {
          console.error('[Voice Booking Agent] Error sending employee email:', e);
        }
      }

      // Send employee SMS
      if (integrations?.twilio_account_sid && employee.phone_number && employee.sms_notifications_enabled !== false) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integrations.twilio_account_sid}/Messages.json`;
          const credentials = btoa(`${integrations.twilio_account_sid}:${integrations.twilio_auth_token}`);

          const formData = new URLSearchParams();
          formData.append('To', employee.phone_number);
          formData.append('From', integrations.twilio_phone_number);
          formData.append('Body', `NEW JOB: ${service.name} for ${customerName} on ${appointmentDateFormatted} at ${appointmentTimeFormatted}. Address: ${customerAddress || 'Not provided'}. Check your dashboard to accept.`);

          await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });
          console.log('[Voice Booking Agent] Employee SMS sent');
        } catch (e) {
          console.error('[Voice Booking Agent] Error sending employee SMS:', e);
        }
      }
    }
  }

  const customerMessage = isReturningCustomer 
    ? `Welcome back ${customerName}! I found your existing account.`
    : newAccountCreated 
      ? `A customer account has been created with login details sent via email.`
      : '';

  return { 
    success: true, 
    appointment_id: appointment.id,
    service: service.name,
    date: appointmentDateFormatted,
    time: appointmentTimeFormatted,
    technician: assignedEmployeeName,
    is_returning_customer: isReturningCustomer,
    customer_account_created: newAccountCreated,
    message: `${isReturningCustomer ? 'Welcome back! ' : ''}Appointment booked for ${customerName} on ${appointmentDateFormatted} at ${appointmentTimeFormatted} for ${service.name}. ${assignedEmployeeName ? `${assignedEmployeeName} will be your technician.` : ''} ${customerEmail ? `A confirmation email has been sent to ${customerEmail}.` : ''} ${customerMessage}`
  };
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
