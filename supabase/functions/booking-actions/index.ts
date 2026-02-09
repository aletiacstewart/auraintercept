import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula to calculate distance between two coordinates in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface TechnicianScore {
  technician_id: string;
  technician_name: string;
  workload_score: number;
  distance_score: number;
  history_score: number;
  total_score: number;
  active_jobs: number;
  distance_miles: number | null;
  is_preferred: boolean;
  service_count: number;
}

interface AssignmentSettings {
  use_load_balancing: boolean;
  use_distance_routing: boolean;
  use_customer_history: boolean;
  workload_weight: number;
  distance_weight: number;
  history_weight: number;
  max_distance_miles: number;
}

async function getAssignmentSettings(supabase: any, companyId: string): Promise<AssignmentSettings> {
  const { data: company } = await supabase
    .from('companies')
    .select(`
      assignment_use_load_balancing,
      assignment_use_distance_routing,
      assignment_use_customer_history,
      assignment_workload_weight,
      assignment_distance_weight,
      assignment_history_weight,
      assignment_max_distance_miles
    `)
    .eq('id', companyId)
    .single();

  return {
    use_load_balancing: company?.assignment_use_load_balancing ?? true,
    use_distance_routing: company?.assignment_use_distance_routing ?? true,
    use_customer_history: company?.assignment_use_customer_history ?? true,
    workload_weight: company?.assignment_workload_weight ?? 40,
    distance_weight: company?.assignment_distance_weight ?? 35,
    history_weight: company?.assignment_history_weight ?? 25,
    max_distance_miles: company?.assignment_max_distance_miles ?? 50,
  };
}

async function calculateTechnicianScores(
  supabase: any,
  companyId: string,
  technicianIds: string[],
  customerEmail: string | null,
  customerPhone: string | null,
  customerLat: number | null,
  customerLng: number | null
): Promise<Map<string, TechnicianScore>> {
  const settings = await getAssignmentSettings(supabase, companyId);
  const scores = new Map<string, TechnicianScore>();

  // Get technician profiles with location info
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, home_latitude, home_longitude, current_latitude, current_longitude')
    .in('id', technicianIds);

  // Get active job counts for each technician
  const { data: activeJobs } = await supabase
    .from('job_assignments')
    .select('employee_id')
    .in('employee_id', technicianIds)
    .eq('company_id', companyId)
    .in('status', ['pending_acceptance', 'accepted', 'en_route', 'arrived', 'in_progress']);

  // Count jobs per technician
  const jobCounts = new Map<string, number>();
  (activeJobs || []).forEach((job: any) => {
    jobCounts.set(job.employee_id, (jobCounts.get(job.employee_id) || 0) + 1);
  });

  // Get customer history
  let customerHistory = new Map<string, { service_count: number; last_service_at: string }>();
  
  if (settings.use_customer_history && (customerEmail || customerPhone)) {
    let historyQuery = supabase
      .from('customer_technician_history')
      .select('technician_id, service_count, last_service_at')
      .eq('company_id', companyId)
      .in('technician_id', technicianIds);

    if (customerEmail) {
      historyQuery = historyQuery.eq('customer_email', customerEmail);
    } else if (customerPhone) {
      historyQuery = historyQuery.eq('customer_phone', customerPhone);
    }

    const { data: history } = await historyQuery;
    (history || []).forEach((h: any) => {
      customerHistory.set(h.technician_id, {
        service_count: h.service_count,
        last_service_at: h.last_service_at
      });
    });
  }

  // Calculate scores for each technician
  for (const profile of profiles || []) {
    const activeJobCount = jobCounts.get(profile.id) || 0;
    const history = customerHistory.get(profile.id);

    // Workload score: fewer active jobs = higher score (max 100)
    let workloadScore = 100;
    if (settings.use_load_balancing) {
      workloadScore = Math.max(0, 100 - (activeJobCount * 20));
    }

    // Distance score: closer = higher score (max 100)
    let distanceScore = 50; // Default middle score if no location data
    let distanceMiles: number | null = null;
    
    if (settings.use_distance_routing && customerLat && customerLng) {
      const techLat = profile.current_latitude || profile.home_latitude;
      const techLng = profile.current_longitude || profile.home_longitude;
      
      if (techLat && techLng) {
        distanceMiles = haversineDistance(techLat, techLng, customerLat, customerLng);
        
        // Exclude technicians beyond max distance
        if (distanceMiles > settings.max_distance_miles) {
          distanceScore = 0;
        } else {
          // Score decreases as distance increases
          distanceScore = Math.max(0, 100 - (distanceMiles * 3));
        }
      }
    }

    // History score: served this customer before = bonus (max 100)
    let historyScore = 0;
    const isPreferred = !!history;
    
    if (settings.use_customer_history && history) {
      historyScore = 100;
      
      // Extra bonus for recent service (within 30 days)
      const lastService = new Date(history.last_service_at);
      const daysSinceService = (Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceService <= 30) {
        historyScore = 100; // Already at max
      }
    }

    // Calculate weighted total score
    const totalWeight = settings.workload_weight + settings.distance_weight + settings.history_weight;
    const totalScore = (
      (workloadScore * settings.workload_weight) +
      (distanceScore * settings.distance_weight) +
      (historyScore * settings.history_weight)
    ) / totalWeight;

    scores.set(profile.id, {
      technician_id: profile.id,
      technician_name: profile.full_name,
      workload_score: Math.round(workloadScore),
      distance_score: Math.round(distanceScore),
      history_score: Math.round(historyScore),
      total_score: Math.round(totalScore),
      active_jobs: activeJobCount,
      distance_miles: distanceMiles ? Math.round(distanceMiles * 10) / 10 : null,
      is_preferred: isPreferred,
      service_count: history?.service_count || 0
    });
  }

  return scores;
}

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
      case 'get_technician_scores':
        result = await getTechnicianScores(supabase, company_id, params);
        break;
      case 'find_next_available':
        result = await findNextAvailable(supabase, company_id, params);
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

async function getTechnicianScores(supabase: any, companyId: string, params: any) {
  const { technician_ids, customer_email, customer_phone, customer_lat, customer_lng } = params;

  if (!technician_ids || technician_ids.length === 0) {
    return { success: true, scores: [] };
  }

  const scores = await calculateTechnicianScores(
    supabase,
    companyId,
    technician_ids,
    customer_email,
    customer_phone,
    customer_lat,
    customer_lng
  );

  return {
    success: true,
    scores: Array.from(scores.values()).sort((a, b) => b.total_score - a.total_score)
  };
}

async function checkAvailability(supabase: any, companyId: string, params: any) {
  const { service_name, date, employee_id, customer_email, customer_phone, customer_address } = params;

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

  // Get business hours for the day - parse date components to avoid UTC timezone shift
  const dateParts = date.split('-');
  const targetDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  const dayOfWeek = targetDate.getDay();
  
  // Get ALL hour types for this day (regular, office, field, emergency)
  const { data: allHours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('company_id', companyId)
    .eq('day_of_week', dayOfWeek)
    .in('hour_type', ['regular', 'office']); // Only booking-relevant types

  // Find any open hours (prefer 'office' for booking, then 'regular')
  const hours = allHours?.find(h => !h.is_closed && h.hour_type === 'office') 
             || allHours?.find(h => !h.is_closed && h.hour_type === 'regular');

  if (!hours) {
    return { success: true, available_slots: [], message: 'Business is closed on this day' };
  }

  // Get employees with availability for this day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];

  // Get technicians assigned to this specific service
  const { data: serviceAssignments } = await supabase
    .from('technician_service_assignments')
    .select('technician_id')
    .eq('company_id', companyId)
    .eq('service_id', service.id);

  // Get technicians with the technician job type
  const { data: techJobAssignments } = await supabase
    .from('employee_job_assignments')
    .select('employee_id')
    .eq('company_id', companyId)
    .eq('job_type', 'technician');

  const allTechIds = (techJobAssignments || []).map((t: any) => t.employee_id);
  
  // Filter to technicians assigned to this service (if any assignments exist)
  let eligibleTechIds = allTechIds;
  if (serviceAssignments && serviceAssignments.length > 0) {
    const assignedTechIds = serviceAssignments.map((sa: any) => sa.technician_id);
    eligibleTechIds = allTechIds.filter((id: string) => assignedTechIds.includes(id));
  }

  if (eligibleTechIds.length === 0) {
    return { success: true, available_slots: [], message: 'No technicians available for this service' };
  }

  // Try to geocode customer address for distance scoring
  let customerLat: number | null = null;
  let customerLng: number | null = null;
  
  // Check if we have cached coordinates from customer profile
  if (customer_email || customer_phone) {
    let profileQuery = supabase
      .from('customer_profiles')
      .select('latitude, longitude')
      .eq('company_id', companyId);
    
    if (customer_email) {
      profileQuery = profileQuery.eq('email', customer_email);
    } else if (customer_phone) {
      profileQuery = profileQuery.eq('phone', customer_phone);
    }
    
    const { data: customerProfile } = await profileQuery.single();
    if (customerProfile?.latitude && customerProfile?.longitude) {
      customerLat = customerProfile.latitude;
      customerLng = customerProfile.longitude;
    }
  }

  // Calculate scores for all eligible technicians
  const technicianScores = await calculateTechnicianScores(
    supabase,
    companyId,
    eligibleTechIds,
    customer_email,
    customer_phone,
    customerLat,
    customerLng
  );

  let employeesQuery = supabase
    .from('profiles')
    .select('id, full_name, availability_json')
    .eq('company_id', companyId)
    .in('id', eligibleTechIds);

  if (employee_id) {
    if (!eligibleTechIds.includes(employee_id)) {
      return { success: false, error: 'Selected technician cannot perform this service', available_slots: [] };
    }
    employeesQuery = supabase
      .from('profiles')
      .select('id, full_name, availability_json')
      .eq('id', employee_id);
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

  // Calculate available slots with technician scores
  const availableSlots: any[] = [];
  const serviceDuration = service.duration_minutes;

  for (const employee of employees || []) {
    const availability = employee.availability_json?.[dayName] || [];
    const score = technicianScores.get(employee.id);
    
    for (const slot of availability) {
      let currentTime = new Date(`${date}T${slot.start}:00`);
      const endTime = new Date(`${date}T${slot.end}:00`);

      while (currentTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
        // Build datetime string manually to avoid UTC conversion shifting times
        const yyyy = currentTime.getFullYear();
        const mm = String(currentTime.getMonth() + 1).padStart(2, '0');
        const dd = String(currentTime.getDate()).padStart(2, '0');
        const hh = String(currentTime.getHours()).padStart(2, '0');
        const min = String(currentTime.getMinutes()).padStart(2, '0');
        const slotStart = `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;

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
            duration: serviceDuration,
            // Include scoring info
            score: score?.total_score || 50,
            active_jobs: score?.active_jobs || 0,
            distance_miles: score?.distance_miles,
            is_preferred: score?.is_preferred || false,
            service_count: score?.service_count || 0
          });
        }

        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }
    }
  }

  // Sort by time first, then by score (highest first) for same time slots
  availableSlots.sort((a, b) => {
    const timeCompare = a.datetime.localeCompare(b.datetime);
    if (timeCompare !== 0) return timeCompare;
    return (b.score || 0) - (a.score || 0);
  });

  // Group slots by time and return top-scored technician for each time
  const slotsByTime = new Map<string, any>();
  for (const slot of availableSlots) {
    const timeKey = slot.start_time;
    if (!slotsByTime.has(timeKey) || slot.score > slotsByTime.get(timeKey).score) {
      slotsByTime.set(timeKey, slot);
    }
  }

  const bestSlots = Array.from(slotsByTime.values()).slice(0, 10);

  return { 
    success: true, 
    available_slots: bestSlots,
    all_slots: availableSlots.slice(0, 50), // Also return all for manual selection
    service: service.name,
    date 
  };
}

async function bookAppointment(supabase: any, companyId: string, params: any) {
  const { 
    service_name, datetime, customer_name, customer_email, customer_phone, customer_address, employee_id,
    // Customer notification preferences (opt-in means they WANT notifications)
    sms_opt_in, email_opt_in, call_opt_in
  } = params;

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

  // Get company default notification preferences
  const { data: company } = await supabase
    .from('companies')
    .select('default_sms_enabled, default_email_enabled, default_call_enabled')
    .eq('id', companyId)
    .single();

  // Use customer preferences if provided, otherwise fall back to company defaults
  // opt_out is the inverse of opt_in (true means don't send, false means do send)
  const smsOptOut = sms_opt_in !== undefined ? !sms_opt_in : !(company?.default_sms_enabled ?? true);
  const emailOptOut = email_opt_in !== undefined ? !email_opt_in : !(company?.default_email_enabled ?? true);
  const callOptOut = call_opt_in !== undefined ? !call_opt_in : !(company?.default_call_enabled ?? true);

  // Find best available employee using smart scoring if not specified
  let assignedEmployeeId = employee_id;
  
  if (!assignedEmployeeId) {
    const checkResult = await checkAvailability(supabase, companyId, {
      service_name,
      date: datetime.split('T')[0],
      customer_email,
      customer_phone,
      customer_address
    });

    // Find the slot matching the requested datetime with the best score
    const matchingSlots = (checkResult.all_slots || checkResult.available_slots || []).filter((s: any) => 
      s.datetime === datetime || s.start_time === datetime.split('T')[1]?.slice(0, 5)
    );

    if (matchingSlots.length > 0) {
      // Sort by score and pick the best
      matchingSlots.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      assignedEmployeeId = matchingSlots[0].employee_id;
      
      console.log(`Smart assignment: Selected technician ${matchingSlots[0].employee_name} with score ${matchingSlots[0].score}`);
    }
  }

  // Create appointment with company default preferences
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
      customer_address,
      status: 'scheduled',
      sms_opt_out: smsOptOut,
      email_opt_out: emailOptOut,
      call_opt_out: callOptOut
    })
    .select()
    .single();

  if (error) {
    console.error('Booking error:', error);
    return { success: false, error: 'Failed to book appointment' };
  }

  // Send confirmation notifications asynchronously
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  if (appointment?.id && customer_email) {
    fetch(`${supabaseUrl}/functions/v1/send-appointment-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: appointment.id, type: 'confirmation' })
    }).catch(err => console.error('Failed to send confirmation email:', err));
  }

  if (appointment?.id && customer_phone) {
    fetch(`${supabaseUrl}/functions/v1/send-appointment-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: appointment.id, type: 'confirmation' })
    }).catch(err => console.error('Failed to send confirmation SMS:', err));
  }

  // Send staff notification for new booking
  if (appointment?.id) {
    fetch(`${supabaseUrl}/functions/v1/send-staff-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        notificationType: 'new_booking',
        title: 'New Appointment Booked',
        message: `${customer_name} booked ${service.name} for ${new Date(datetime).toLocaleString()}`,
        metadata: { 
          appointmentId: appointment.id,
          customerName: customer_name,
          customerEmail: customer_email,
          customerPhone: customer_phone,
          serviceType: service.name,
          datetime
        },
        recipientRole: 'all'
      })
    }).catch(err => console.error('Failed to send staff notification:', err));
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

async function findNextAvailable(supabase: any, companyId: string, params: any) {
  const { service_name, start_date, max_days = 14 } = params;

  const startDate = start_date ? new Date(start_date) : new Date();
  // Start from the day after the requested date
  startDate.setDate(startDate.getDate() + 1);

  const datesWithSlots: any[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let i = 0; i < max_days && datesWithSlots.length < 3; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(startDate.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];

    try {
      const result = await checkAvailability(supabase, companyId, {
        service_name: service_name || 'Standard Service Call / Diagnostic',
        date: dateStr,
      });

      if (result.available_slots && result.available_slots.length > 0) {
        datesWithSlots.push({
          date: dateStr,
          day_name: dayNames[checkDate.getDay()],
          slot_count: result.available_slots.length,
          sample_times: result.available_slots.slice(0, 4).map((s: any) => s.start_time),
          service: result.service,
        });
      }
    } catch (err) {
      console.error(`Error checking ${dateStr}:`, err);
    }
  }

  return {
    success: true,
    dates_with_availability: datesWithSlots,
    message: datesWithSlots.length > 0
      ? `Found ${datesWithSlots.length} upcoming date(s) with availability.`
      : 'No availability found in the next ' + max_days + ' days.',
  };
}