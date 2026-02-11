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

    console.log("[voice-booking-agent] Received:", { agentId, toolName, hasParameters: !!body.parameters, bodyCompanyId: body.companyId, bodyCompany_id: body.company_id });

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
        console.log("[voice-booking-agent] Resolved companyId from agentId:", companyId);
      }
    }

    // Fallback: check both camelCase and snake_case from body and toolParams
    if (!companyId) {
      companyId = (body.companyId || body.company_id || toolParams.companyId || toolParams.company_id || "") as string;
      if (companyId) {
        console.log("[voice-booking-agent] Resolved companyId from body/params fallback:", companyId);
      }
    }

    if (!companyId) {
      console.error("[voice-booking-agent] Could not determine company. Body keys:", Object.keys(body), "ToolParams keys:", Object.keys(toolParams));
      return new Response(JSON.stringify({ error: "Could not determine company" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle tool calls
    switch (toolName) {
      case "check_availability": {
        const preferredDate = (toolParams.preferred_date || toolParams.date || "") as string;

        // 1. Get technician assignments and profiles in parallel
        const techAssignmentsPromise = supabase
          .from("employee_job_assignments")
          .select("employee_id")
          .eq("company_id", companyId)
          .eq("job_type", "technician");

        // Parse preferred date — resolve relative terms server-side as safety net
        let targetDate = preferredDate;
        if (!targetDate || targetDate.toLowerCase() === "tomorrow") {
          const d = new Date();
          if (!targetDate || targetDate.toLowerCase() === "tomorrow") {
            d.setDate(d.getDate() + 1);
          }
          targetDate = d.toISOString().split("T")[0];
          console.log("[voice-booking-agent] Resolved relative date to:", targetDate);
        } else if (targetDate.toLowerCase() === "today") {
          targetDate = new Date().toISOString().split("T")[0];
          console.log("[voice-booking-agent] Resolved 'today' to:", targetDate);
        }

        const [year, month, day] = targetDate.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = dayNames[dateObj.getDay()];

        // Fetch appointments for the date in parallel with assignments
        const dayStart = `${targetDate}T00:00:00`;
        const dayEnd = `${targetDate}T23:59:59`;

        const existingApptsPromise = supabase
          .from("appointments")
          .select("datetime, duration_minutes, employee_id")
          .eq("company_id", companyId)
          .gte("datetime", dayStart)
          .lte("datetime", dayEnd)
          .in("status", ["pending", "confirmed", "in-progress", "scheduled"]);

        const [{ data: techAssignments }, { data: existingAppts }] = await Promise.all([
          techAssignmentsPromise,
          existingApptsPromise,
        ]);

        if (!techAssignments || techAssignments.length === 0) {
          return new Response(JSON.stringify({
            available: false,
            slots: [],
            message: "Let me check on that for you... Unfortunately, no team members are currently available. Would you like us to reach out when someone is available?",
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
            message: "Let me look into that... I'm sorry, no team members are currently available.",
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. No need to re-parse date or re-fetch appointments — already done above

        // 4. Generate available slots from availability_json
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

        // 5. Deduplicate and limit to 5
        const uniqueSlots = [...new Set(availableSlots)].slice(0, 5);

        if (uniqueSlots.length === 0) {
          // 6. Scan next 14 days for alternatives
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
            ? `Great question! Let me share what I found... No openings on that date, but the next available dates are ${suggestions.join(", ")}. Would any of those work for you?`
            : "I've checked our schedule thoroughly, and unfortunately there are no available slots in the next two weeks. Would you like a team member to reach out when something opens up?";

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
          message: `Great, let me share what's available! On ${dateDisplay}, we have these times open: ${uniqueSlots.join(", ")}. Which time works best for you?`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "create_appointment":
      case "book_appointment": {
        const customerName = (toolParams.customer_name || toolParams.name || "Voice Caller") as string;
        const customerPhone = (toolParams.customer_phone || toolParams.phone || "") as string;
        const serviceType = (toolParams.service_type || toolParams.service || "General") as string;
        const datetime = (toolParams.datetime || toolParams.date || "") as string;
        const durationMinutes = Number(toolParams.duration_minutes || toolParams.duration || 60);

        if (!customerPhone || customerPhone.trim().length < 7) {
          return new Response(JSON.stringify({
            success: false,
            message: "I need the customer's phone number before I can book. Please ask them for their phone number.",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!datetime) {
          return new Response(JSON.stringify({
            success: false,
            message: "I need a specific date and time to book. Please ask the customer when they'd like to come in, then check availability first.",
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

        // Create job_assignments record so appointment appears in calendar & technician queue
        try {
          const { error: jaError } = await supabase
            .from("job_assignments")
            .insert({
              company_id: companyId,
              appointment_id: appointment.id,
              status: "pending_acceptance",
            });
          if (jaError) {
            console.error("[voice-booking-agent] job_assignments insert failed:", jaError);
          } else {
            console.log("[voice-booking-agent] job_assignments created for appointment:", appointment.id);
          }
        } catch (jaErr) {
          console.error("[voice-booking-agent] job_assignments error (non-blocking):", jaErr);
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
          message: `Wonderful, I've got that booked for you! Your appointment is set for ${customerName} on ${datetime} for ${serviceType}. Please note, your appointment is pending confirmation. Once accepted by our team, you'll receive a confirmation with all the details. Is there anything else I can help you with?`,
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
            ? `Here's what I found for you! We offer the following services: ${services.map((s: any) => s.name).join(", ")}. Which service are you interested in?`
            : "I checked and it looks like no services are currently configured. Would you like to speak with someone from our team?",
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
