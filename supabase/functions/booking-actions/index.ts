import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let result;

    switch (action) {
      case 'check_availability':
        result = await checkAvailability(supabase, company_id, params);
        break;
      case 'book_appointment':
        result = await bookAppointment(supabase, company_id, params);
        break;
      case 'get_business_hours':
        result = await getBusinessHours(supabase, company_id, params.day_of_week);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Booking action error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function checkAvailability(supabase: any, companyId: string, params: any) {
  const { service_name, date, employee_id } = params;

  // Get service details
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companyId)
    .ilike('name', `%${service_name}%`)
    .eq('is_active', true)
    .single();

  if (!service) {
    return { success: false, error: 'Service not found', available_slots: [] };
  }

  // Get business hours for the day
  const dayOfWeek = new Date(date).getDay();
  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('company_id', companyId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!hours || hours.is_closed) {
    return { success: true, available_slots: [], message: 'Business is closed on this day' };
  }

  // Get employees with availability for this day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  let employeesQuery = supabase
    .from('profiles')
    .select('id, full_name, availability_json')
    .eq('company_id', companyId);

  if (employee_id) {
    employeesQuery = employeesQuery.eq('id', employee_id);
  }

  const { data: employees } = await employeesQuery;

  // Get existing appointments for the date
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;
  
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companyId)
    .gte('datetime', startOfDay)
    .lte('datetime', endOfDay)
    .neq('status', 'cancelled');

  // Calculate available slots
  const availableSlots: any[] = [];
  const serviceDuration = service.duration_minutes;

  for (const employee of employees || []) {
    const availability = employee.availability_json?.[dayName] || [];
    
    for (const slot of availability) {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      
      let currentTime = new Date(`${date}T${slot.start}:00`);
      const endTime = new Date(`${date}T${slot.end}:00`);

      while (currentTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
        const slotStart = currentTime.toISOString();
        const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000).toISOString();

        // Check for conflicts
        const hasConflict = (existingAppointments || []).some((apt: any) => {
          if (apt.employee_id !== employee.id) return false;
          const aptStart = new Date(apt.datetime).getTime();
          const aptEnd = aptStart + apt.duration_minutes * 60000;
          const slotStartTime = currentTime.getTime();
          const slotEndTime = slotStartTime + serviceDuration * 60000;
          return !(slotEndTime <= aptStart || slotStartTime >= aptEnd);
        });

        if (!hasConflict) {
          availableSlots.push({
            employee_id: employee.id,
            employee_name: employee.full_name,
            start_time: currentTime.toTimeString().slice(0, 5),
            datetime: slotStart,
            service: service.name,
            duration: serviceDuration
          });
        }

        currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-min intervals
      }
    }
  }

  // Sort by time, then by first available employee
  availableSlots.sort((a, b) => a.datetime.localeCompare(b.datetime));

  return { 
    success: true, 
    available_slots: availableSlots.slice(0, 10), // Return first 10 slots
    service: service.name,
    date 
  };
}

async function bookAppointment(supabase: any, companyId: string, params: any) {
  const { service_name, datetime, customer_name, customer_email, customer_phone, employee_id } = params;

  // Get service
  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companyId)
    .ilike('name', `%${service_name}%`)
    .eq('is_active', true)
    .single();

  if (!service) {
    return { success: false, error: 'Service not found' };
  }

  // Find first available employee if not specified
  let assignedEmployeeId = employee_id;
  
  if (!assignedEmployeeId) {
    const checkResult = await checkAvailability(supabase, companyId, {
      service_name,
      date: datetime.split('T')[0]
    });

    const matchingSlot = checkResult.available_slots.find((s: any) => 
      s.datetime === datetime || s.start_time === datetime.split('T')[1]?.slice(0, 5)
    );

    if (matchingSlot) {
      assignedEmployeeId = matchingSlot.employee_id;
    }
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      company_id: companyId,
      employee_id: assignedEmployeeId,
      service_type: service.name,
      datetime: datetime,
      duration_minutes: service.duration_minutes,
      customer_name,
      customer_email,
      customer_phone,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    console.error('Booking error:', error);
    return { success: false, error: 'Failed to book appointment' };
  }

  // Send confirmation email asynchronously (don't wait for it)
  if (appointment?.id && customer_email) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    fetch(`${supabaseUrl}/functions/v1/send-appointment-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: appointment.id, type: 'confirmation' })
    }).catch(err => console.error('Failed to send confirmation email:', err));
  }

  return { 
    success: true, 
    appointment,
    message: `Appointment booked for ${customer_name} on ${new Date(datetime).toLocaleString()}`
  };
}

async function getBusinessHours(supabase: any, companyId: string, dayOfWeek: number) {
  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('company_id', companyId)
    .eq('day_of_week', dayOfWeek)
    .single();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (!hours) {
    return { day: dayNames[dayOfWeek], hours: 'Not specified' };
  }

  if (hours.is_closed) {
    return { day: dayNames[dayOfWeek], hours: 'Closed' };
  }

  return { 
    day: dayNames[dayOfWeek], 
    hours: `${hours.open_time} - ${hours.close_time}`,
    open_time: hours.open_time,
    close_time: hours.close_time
  };
}
