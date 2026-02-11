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
        const serviceType = (toolParams.service_type || "") as string;
        const preferredDate = (toolParams.preferred_date || "") as string;

        const startDate = preferredDate || new Date().toISOString().split("T")[0];
        const endDate = new Date(new Date(startDate).getTime() + 7 * 86400000).toISOString().split("T")[0];

        const { data: appointments } = await supabase
          .from("appointments")
          .select("datetime, duration_minutes, employee_id")
          .eq("company_id", companyId)
          .gte("datetime", startDate)
          .lte("datetime", endDate)
          .in("status", ["confirmed", "pending"]);

        const { data: hours } = await supabase
          .from("business_hours")
          .select("*")
          .eq("company_id", companyId);

        return new Response(JSON.stringify({
          available: true,
          existing_appointments: (appointments || []).length,
          business_hours: hours || [],
          message: `There are ${(appointments || []).length} existing appointments this week. Business hours are configured.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
