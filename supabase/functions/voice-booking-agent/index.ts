import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let body: Record<string, unknown>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        console.error("Failed to parse body:", text.substring(0, 200));
        return new Response(JSON.stringify({ error: "Invalid request body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const agentId = (body.agent_id || body.agentId || "") as string;
    const toolName = (body.tool_name || body.toolName || "") as string;
    const toolParams = (body.parameters || body.tool_parameters || body) as Record<string, unknown>;

    // Map agent_id to company_id
    let companyId = "";
    if (agentId) {
      const { data: integration } = await supabase
        .from("tenant_integrations")
        .select("company_id")
        .eq("elevenlabs_agent_id", agentId)
        .maybeSingle();

      if (integration) {
        companyId = integration.company_id;
      }
    }

    if (!companyId) {
      companyId = (toolParams.company_id || "") as string;
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: "Could not determine company" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle tool calls
    switch (toolName) {
      case "check_availability": {
        const preferredDate = (toolParams.preferred_date || toolParams.date || "") as string;

        // 1. Get technician assignments for this company
        const { data: techAssignments } = await supabase
          .from("employee_job_assignments")
          .select("employee_id, services")
          .eq("company_id", companyId)
          .eq("job_type", "technician");

        if (!techAssignments || techAssignments.length === 0) {
          return new Response(JSON.stringify({
            available: false,
            slots: [],
            message: "No team members are currently available. Would you like us to reach out when someone is available?",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const employeeIds = techAssignments.map((a: any) => a.employee_id);

        // 2. Get employee profiles with availability_json
        const { data: techProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, availability_json")
          .in("id", employeeIds);

        if (!techProfiles || techProfiles.length === 0) {
          return new Response(JSON.stringify({
            available: false,
            slots: [],
            message: "No team members are currently available.",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. Parse preferred date (default to tomorrow)
        let targetDate = preferredDate;
        if (!targetDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          targetDate = tomorrow.toISOString().split("T")[0];
        }

        const [year, month, day] = targetDate.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = dayNames[dateObj.getDay()];

        // 4. Get existing appointments for that date
        const dayStart = `${targetDate}T00:00:00`;
        const dayEnd = `${targetDate}T23:59:59`;

        const { data: existingAppts } = await supabase
          .from("appointments")
          .select("datetime, duration_minutes, employee_id")
          .eq("company_id", companyId)
          .gte("datetime", dayStart)
          .lte("datetime", dayEnd)
          .in("status", ["pending", "confirmed", "in-progress", "scheduled"]);

        // 5. Generate available slots from availability_json
        const availableSlots: string[] = [];

        for (const emp of techProfiles) {
          const availability = (emp as any).availability_json || {};
          const daySlots = availability[dayName];
          if (!daySlots || !Array.isArray(daySlots) || daySlots.length === 0) continue;

          for (const slot of daySlots) {
            const startHour = parseInt(slot.start?.split(":")[0] || "8", 10);
            const endHour = parseInt(slot.end?.split(":")[0] || "17", 10);

            for (let hour = startHour; hour < endHour; hour++) {
              const timeStr = `${hour.toString().padStart(2, "0")}:00`;
              const slotDateTime = `${targetDate}T${timeStr}:00`;

              // Check conflicts with existing appointments for this employee
              const hasConflict = (existingAppts || []).some((apt: any) => {
                if (apt.employee_id !== (emp as any).id) return false;
                const aptTime = new Date(apt.datetime);
                const slotTime = new Date(slotDateTime);
                const aptEnd = new Date(aptTime.getTime() + (apt.duration_minutes || 60) * 60000);
                return slotTime >= aptTime && slotTime < aptEnd;
              });

              if (!hasConflict) {
                const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                const ampm = hour >= 12 ? "PM" : "AM";
                availableSlots.push(`${displayHour}:00 ${ampm}`);
              }
            }
          }
        }

        // 6. Deduplicate and limit to 5
        const uniqueSlots = [...new Set(availableSlots)].slice(0, 5);

        if (uniqueSlots.length === 0) {
          // 7. Scan next 14 days for alternatives
          const suggestions: string[] = [];
          for (let i = 1; i <= 14 && suggestions.length < 3; i++) {
            const checkDate = new Date(year, month - 1, day + i);
            const checkDayName = dayNames[checkDate.getDay()];

            const hasAvailability = techProfiles.some((emp: any) => {
              const avail = emp.availability_json || {};
              const slots = avail[checkDayName];
              return slots && Array.isArray(slots) && slots.length > 0;
            });

            if (hasAvailability) {
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const dn = dayNames[checkDate.getDay()];
              suggestions.push(`${dn.charAt(0).toUpperCase() + dn.slice(1)}, ${monthNames[checkDate.getMonth()]} ${checkDate.getDate()}`);
            }
          }

          const message = suggestions.length > 0
            ? `No openings on that date. The next available dates are ${suggestions.join(", ")}. Would any of those work?`
            : "No available slots in the next two weeks. Would you like a team member to reach out when something opens up?";

          return new Response(JSON.stringify({
            available: false,
            slots: [],
            suggestions: suggestions,
            message,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const dateDisplay = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        return new Response(JSON.stringify({
          available: true,
          date: targetDate,
          slots: uniqueSlots,
          message: `Available times on ${dateDisplay}: ${uniqueSlots.join(", ")}. Which time works best?`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "create_appointment":
      case "book_appointment": {
        const customerName = (toolParams.customer_name || toolParams.name || "Voice Caller") as string;
        const customerPhone = (toolParams.customer_phone || toolParams.phone || "") as string;
        const serviceType = (toolParams.service_type || toolParams.service || "General") as string;
        const datetime = (toolParams.datetime || toolParams.date || "") as string;
        const durationMinutes = Number(toolParams.duration_minutes || toolParams.duration || 60);

        if (!datetime) {
          return new Response(JSON.stringify({
            success: false,
            message: "A date and time is required to book an appointment.",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: appointment, error } = await supabase
          .from("appointments")
          .insert({
            company_id: companyId,
            customer_name: customerName,
            customer_phone: customerPhone,
            service_type: serviceType,
            datetime,
            duration_minutes: durationMinutes,
            status: "pending",
            notes: "Booked via voice agent",
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to create appointment:", error);
          return new Response(JSON.stringify({
            success: false,
            message: "Sorry, I couldn't book the appointment. Please try again.",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Sync to Google Calendar (if connected)
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              action: 'sync_appointment',
              companyId: companyId,
              appointmentId: appointment.id,
              appointment: appointment,
            }),
          });
          console.log('[Voice Agent] Google Calendar sync triggered for appointment:', appointment.id);
        } catch (calendarError) {
          console.error('[Voice Agent] Google Calendar sync error (non-blocking):', calendarError);
        }

        return new Response(JSON.stringify({
          success: true,
          appointment_id: appointment.id,
          message: `Appointment booked for ${customerName} on ${datetime} for ${serviceType}.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_services":
      case "list_services": {
        const { data: services } = await supabase
          .from("services")
          .select("name, description, duration_minutes, price, delivery_type")
          .eq("company_id", companyId)
          .eq("is_active", true);

        return new Response(JSON.stringify({
          services: services || [],
          message: services?.length
            ? `Available services: ${services.map((s: any) => s.name).join(", ")}`
            : "No services are currently configured.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default: {
        return new Response(JSON.stringify({
          message: `Tool '${toolName}' is not supported. Available tools: check_availability, create_appointment, get_services.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (e) {
    console.error("voice-booking-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
