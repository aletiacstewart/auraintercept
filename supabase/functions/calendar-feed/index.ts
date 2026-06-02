import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT = {
  requests: 60,      // Max requests per window
  windowSeconds: 3600, // 1 hour window
};

// In-memory rate limit store (per-instance, resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(token: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(token);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(token, { count: 1, resetAt: now + RATE_LIMIT.windowSeconds * 1000 });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT.requests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

// Format date to ICS format (YYYYMMDDTHHMMSSZ)
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Escape special characters for ICS
function escapeICS(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Generate ICS content from appointments
function generateICS(appointments: any[], calendarName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aura Intercept//Calendar Feed//EN",
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const apt of appointments) {
    const startDate = new Date(apt.datetime);
    const endDate = new Date(startDate.getTime() + (apt.duration_minutes || 60) * 60 * 1000);
    const createdDate = new Date(apt.created_at);
    const updatedDate = new Date(apt.updated_at || apt.created_at);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${apt.id}@auraintercept.ai`);
    lines.push(`DTSTAMP:${formatDateToICS(updatedDate)}`);
    lines.push(`DTSTART:${formatDateToICS(startDate)}`);
    lines.push(`DTEND:${formatDateToICS(endDate)}`);
    lines.push(`CREATED:${formatDateToICS(createdDate)}`);
    lines.push(`LAST-MODIFIED:${formatDateToICS(updatedDate)}`);
    lines.push(`SUMMARY:${escapeICS(apt.service_type)} - ${escapeICS(apt.customer_name)}`);
    
    if (apt.customer_address) {
      lines.push(`LOCATION:${escapeICS(apt.customer_address)}`);
    }
    
    const description = [
      `Customer: ${apt.customer_name}`,
      apt.customer_phone ? `Phone: ${apt.customer_phone}` : null,
      apt.customer_email ? `Email: ${apt.customer_email}` : null,
      apt.notes ? `Notes: ${apt.notes}` : null,
    ].filter(Boolean).join("\\n");
    
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
    lines.push(`STATUS:${apt.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Generate a single event ICS for customers (no PII in description)
function generateSingleEventICS(appointment: any, companyName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aura Intercept//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const startDate = new Date(appointment.datetime);
  const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);
  const createdDate = new Date(appointment.created_at);

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${appointment.id}@auraintercept.ai`);
  lines.push(`DTSTAMP:${formatDateToICS(createdDate)}`);
  lines.push(`DTSTART:${formatDateToICS(startDate)}`);
  lines.push(`DTEND:${formatDateToICS(endDate)}`);
  lines.push(`SUMMARY:${escapeICS(appointment.service_type)} with ${escapeICS(companyName)}`);
  
  if (appointment.customer_address) {
    lines.push(`LOCATION:${escapeICS(appointment.customer_address)}`);
  }
  
  // Customer-facing ICS - minimal PII, just service info
  const description = [
    `Service: ${appointment.service_type}`,
    `Provider: ${companyName}`,
    appointment.notes ? `Notes: ${appointment.notes}` : null,
  ].filter(Boolean).join("\\n");
  
  lines.push(`DESCRIPTION:${escapeICS(description)}`);
  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type") || "employee"; // "employee", "company", or "appointment"
    const appointmentId = url.searchParams.get("appointment_id");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting check
    const rateCheck = checkRateLimit(token);
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for calendar feed token`);
      return new Response(JSON.stringify({ 
        error: "Too many requests. Please try again later." 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter || 3600)
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle single appointment download for customers using SECURITY DEFINER RPC
    if (type === "appointment" && appointmentId) {
      // Validate appointmentId format
      if (!uuidRegex.test(appointmentId)) {
        return new Response(JSON.stringify({ error: "Invalid appointment ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Fetching single appointment via secure RPC for customer download");
      
      // Use SECURITY DEFINER function to get appointment by token
      const { data: appointments, error: aptError } = await supabase
        .rpc('get_appointment_by_customer_token', { p_token: token });

      if (aptError) {
        console.error("RPC error fetching appointment:", aptError);
        return new Response(JSON.stringify({ error: "Failed to fetch appointment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the specific appointment by ID
      const appointment = appointments?.find((a: any) => a.id === appointmentId);
      
      if (!appointment) {
        console.error("Appointment not found or invalid token");
        return new Response(JSON.stringify({ error: "Appointment not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const companyName = appointment.company_name || "Service Provider";
      const icsContent = generateSingleEventICS(appointment, companyName);

      return new Response(icsContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="appointment.ics"`,
        },
      });
    }

    // Handle employee feed using SECURITY DEFINER RPC
    if (type === "employee") {
      console.log("Fetching employee calendar feed via secure RPC");
      
      // Use SECURITY DEFINER function to get employee appointments
      const { data: appointments, error: aptError } = await supabase
        .rpc('get_employee_calendar_appointments', { p_feed_token: token });

      if (aptError) {
        console.error("RPC error fetching employee appointments:", aptError);
        return new Response(JSON.stringify({ error: "Failed to fetch appointments" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no appointments returned, it could mean invalid token or no assignments
      // We return empty calendar (RPC returns empty set for invalid token)
      const calendarName = "My Appointments";
      const icsContent = generateICS(appointments || [], calendarName);

      return new Response(icsContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/calendar; charset=utf-8",
        },
      });
    }

    // Handle company feed using SECURITY DEFINER RPC
    if (type === "company") {
      console.log("Fetching company calendar feed via secure RPC");
      
      // Use SECURITY DEFINER function to get company appointments
      const { data: appointments, error: aptError } = await supabase
        .rpc('get_company_calendar_appointments', { p_feed_token: token });

      if (aptError) {
        console.error("RPC error fetching company appointments:", aptError);
        return new Response(JSON.stringify({ error: "Failed to fetch appointments" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get company name from first appointment or default
      const companyName = appointments?.[0]?.company_name || "Company Appointments";
      const icsContent = generateICS(appointments || [], companyName);

      return new Response(icsContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/calendar; charset=utf-8",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid feed type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Calendar feed error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
