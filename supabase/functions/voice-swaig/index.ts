import { createClient } from "npm:@supabase/supabase-js@2"; // voice-swaig

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: any = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse SWAIG request body:', err);
    return new Response(JSON.stringify({ response: "Sorry, I encountered an error." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const functionName = body.function || '';
  const rawParsed = body.argument?.parsed;
  const args = Array.isArray(rawParsed) ? (rawParsed[0] || {}) : (rawParsed || {});
  const metaData = body.meta_data || {};
  const companyId = metaData.company_id || '';
  const callLogId = metaData.call_log_id || '';

  console.log(`SWAIG raw argument:`, JSON.stringify(body.argument));
  console.log(`SWAIG function: ${functionName} companyId=${companyId} callLogId=${callLogId} args=${JSON.stringify(args)}`);

  if (!companyId) {
    return swaigResponse("Sorry, I'm having a configuration issue. Please try calling back.");
  }

  try {
    switch (functionName) {
      case 'check_availability':
        return await handleCheckAvailability(supabase, companyId, args);

      case 'book_appointment':
        return await handleBookAppointment(supabase, companyId, callLogId, args);

      case 'get_services':
        return await handleGetServices(supabase, companyId);

      case 'transfer_call':
        return await handleTransferCall(supabase, companyId);

      default:
        console.log(`Unknown SWAIG function: ${functionName}`);
        return swaigResponse("I'm not sure how to help with that. Could you tell me what service you're looking for?");
    }
  } catch (error) {
    console.error(`SWAIG function error (${functionName}):`, error);
    return swaigResponse("Sorry, I had trouble processing that. Could you try again?");
  }
});

function swaigResponse(response: string, action?: any[]): Response {
  const body: any = { response };
  if (action) body.action = action;
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// === CHECK AVAILABILITY ===
async function handleCheckAvailability(
  supabase: any, companyId: string, args: any
): Promise<Response> {
  const serviceType = args.service_type || '';
  const preferredDate = args.preferred_date || '';

  // Get company services to validate
  const { data: company } = await supabase
    .from('companies')
    .select('name, service_categories')
    .eq('id', companyId)
    .single();

  // Get employees with technician assignments for this company
  const { data: assignments } = await supabase
    .from('employee_job_assignments')
    .select('employee_id')
    .eq('company_id', companyId)
    .eq('job_type', 'technician');

  if (!assignments || assignments.length === 0) {
    return swaigResponse("I'm sorry, we don't have any team members available right now. Would you like me to have a team member reach out to you?");
  }

  const employeeIds = assignments.map((a: any) => a.employee_id);

  // Get employee availability
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name, availability_json')
    .in('id', employeeIds);

  if (!employees || employees.length === 0) {
    return swaigResponse("I'm sorry, no one is available right now. Would you like to leave your information?");
  }

  // Determine which day to check
  let targetDate = preferredDate;
  if (!targetDate) {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    targetDate = tomorrow.toISOString().split('T')[0];
  }

  // Parse date to get day of week
  const [year, month, day] = targetDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dateObj.getDay()];

  // Check existing appointments for that date
  const dayStart = `${targetDate}T00:00:00`;
  const dayEnd = `${targetDate}T23:59:59`;

  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('datetime, duration_minutes, employee_id')
    .eq('company_id', companyId)
    .gte('datetime', dayStart)
    .lte('datetime', dayEnd)
    .in('status', ['pending', 'confirmed', 'in-progress', 'scheduled']);

  // Find available slots
  const availableSlots: string[] = [];

  for (const emp of employees) {
    const availability = emp.availability_json || {};
    const daySlots = availability[dayName];

    if (!daySlots || !Array.isArray(daySlots) || daySlots.length === 0) continue;

    for (const slot of daySlots) {
      const startHour = parseInt(slot.start?.split(':')[0] || '8', 10);
      const endHour = parseInt(slot.end?.split(':')[0] || '17', 10);

      // Generate hourly slots
      for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const slotDateTime = `${targetDate}T${timeStr}:00`;

        // Check if this slot conflicts with existing appointments
        const hasConflict = (existingAppointments || []).some((apt: any) => {
          if (apt.employee_id !== emp.id) return false;
          const aptTime = new Date(apt.datetime);
          const slotTime = new Date(slotDateTime);
          const aptEnd = new Date(aptTime.getTime() + (apt.duration_minutes || 60) * 60000);
          return slotTime >= aptTime && slotTime < aptEnd;
        });

        if (!hasConflict) {
          const displayHour = hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          availableSlots.push(`${displayHour}:00 ${ampm}`);
        }
      }
    }
  }

  // Deduplicate and limit
  const uniqueSlots = [...new Set(availableSlots)].slice(0, 5);

  if (uniqueSlots.length === 0) {
    // Try to find next available dates
    const suggestions: string[] = [];
    for (let i = 1; i <= 14 && suggestions.length < 3; i++) {
      const checkDate = new Date(year, month - 1, day + i);
      const checkDayName = dayNames[checkDate.getDay()];

      const hasAvailability = employees.some((emp: any) => {
        const avail = emp.availability_json || {};
        const slots = avail[checkDayName];
        return slots && Array.isArray(slots) && slots.length > 0;
      });

      if (hasAvailability) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        suggestions.push(`${dayNames[checkDate.getDay()].charAt(0).toUpperCase() + dayNames[checkDate.getDay()].slice(1)}, ${monthNames[checkDate.getMonth()]} ${checkDate.getDate()}`);
      }
    }

    if (suggestions.length > 0) {
      return swaigResponse(`I'm sorry, we don't have any openings on that date. The next available dates are ${suggestions.join(', ')}. Would any of those work for you?`);
    }

    return swaigResponse("I'm sorry, we don't have any available slots in the next two weeks. I can have a team member reach out to you when something opens up. Would you like that?");
  }

  const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return swaigResponse(`I have openings on ${dateDisplay} at ${uniqueSlots.join(', ')}. Which time works best for you?`);
}

// === BOOK APPOINTMENT ===
async function handleBookAppointment(
  supabase: any, companyId: string, callLogId: string, args: any
): Promise<Response> {
  const { customer_name, customer_phone, customer_email, service_type, appointment_date, appointment_time } = args;

  if (!customer_name || !service_type || !appointment_date || !appointment_time) {
    return swaigResponse("I still need a few more details. Could you confirm your name, the service you need, and your preferred date and time?");
  }

  const datetime = `${appointment_date}T${appointment_time}:00`;

  // Find an available employee
  const { data: assignments } = await supabase
    .from('employee_job_assignments')
    .select('employee_id')
    .eq('company_id', companyId)
    .eq('job_type', 'technician');

  let employeeId = null;
  if (assignments && assignments.length > 0) {
    // Simple assignment: pick first available employee
    employeeId = assignments[0].employee_id;
  }

  // Look up service to get correct duration and delivery type
  const { data: serviceRecord } = await supabase
    .from('services')
    .select('id, duration_minutes, delivery_type')
    .eq('company_id', companyId)
    .ilike('name', `%${service_type}%`)
    .eq('is_active', true)
    .maybeSingle();

  const durationMinutes = serviceRecord?.duration_minutes || 60;
  const deliveryType = serviceRecord?.delivery_type || 'in_person_business';

  // Create the appointment
  const { data: appointment, error } = await supabase.from('appointments').insert({
    company_id: companyId,
    customer_name,
    customer_phone: customer_phone || null,
    customer_email: customer_email || null,
    service_type,
    datetime,
    duration_minutes: durationMinutes,
    status: 'pending',
    delivery_type: deliveryType,
    employee_id: employeeId,
    notes: `Booked via phone call${callLogId ? ` (call: ${callLogId})` : ''}`,
  }).select('id').single();

  if (error) {
    console.error('Failed to create appointment:', error);
    return swaigResponse("I'm sorry, I wasn't able to book that appointment. Could you try again or call back in a few minutes?");
  }

  // Create job assignment so it appears in the technician job queue
  if (appointment?.id) {
    const jobData: any = {
      company_id: companyId,
      appointment_id: appointment.id,
      status: 'pending_acceptance',
    };
    if (employeeId) {
      jobData.employee_id = employeeId;
    }
    const { error: jobError } = await supabase
      .from('job_assignments')
      .insert(jobData);
    if (jobError) {
      console.error('Failed to create job assignment:', jobError);
    }
  }

  // Update call log with appointment reference
  if (callLogId) {
    await supabase.from('call_logs').update({
      metadata: { appointment_id: appointment.id },
    }).eq('id', callLogId);
  }

  // Format confirmation
  const dateObj = new Date(`${appointment_date}T${appointment_time}:00`);
  const timeDisplay = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return swaigResponse(`Great news, ${customer_name}! Your ${service_type} appointment is booked for ${dateDisplay} at ${timeDisplay}. You'll receive a confirmation shortly. Is there anything else I can help you with?`);
}

// === GET SERVICES ===
async function handleGetServices(
  supabase: any, companyId: string
): Promise<Response> {
  const { data: services } = await supabase
    .from('services')
    .select('name, description, duration_minutes, price')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (!services || services.length === 0) {
    return swaigResponse("We don't have any services listed at the moment. Can I help you with something else?");
  }

  const serviceDescriptions = services.map((s: any) => {
    let desc = s.name;
    if (s.duration_minutes) desc += `, ${s.duration_minutes} minutes`;
    if (s.description) desc += `. ${s.description}`;
    return desc;
  }).join('. ');

  return swaigResponse(`We offer the following services: ${serviceDescriptions}. Which service are you interested in?`);
}

// === TRANSFER CALL ===
async function handleTransferCall(
  supabase: any, companyId: string
): Promise<Response> {
  // Get the business phone number
  const { data: company } = await supabase
    .from('companies')
    .select('business_phone, phone')
    .eq('id', companyId)
    .single();

  const transferNumber = company?.business_phone || company?.phone;

  if (!transferNumber) {
    return swaigResponse("I'm sorry, I don't have a number to transfer you to right now. Can I take a message and have someone call you back?");
  }

  // Return SWML action to connect the call
  return swaigResponse("Let me transfer you now. One moment please.", [
    {
      transfer: true,
      SWML: {
        version: "1.0.0",
        sections: {
          main: [
            {
              connect: {
                to: transferNumber,
              },
            },
          ],
        },
      },
    },
  ]);
}
