import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get companies with cost alerts enabled
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name, cost_alert_enabled, cost_alert_threshold, cost_alert_email, last_cost_alert_at")
      .eq("cost_alert_enabled", true)
      .not("cost_alert_email", "is", null);

    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
      throw companiesError;
    }

    console.log(`Found ${companies?.length || 0} companies with cost alerts enabled`);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const alertsSent: string[] = [];

    for (const company of companies || []) {
      // Check if alert was already sent this month
      if (company.last_cost_alert_at) {
        const lastAlertMonth = new Date(company.last_cost_alert_at).toISOString().slice(0, 7);
        if (lastAlertMonth === currentMonth) {
          console.log(`Alert already sent for ${company.name} this month`);
          continue;
        }
      }

      // Get the estimate for current month
      const { data: estimate, error: estimateError } = await supabase
        .from("cost_estimates")
        .select("*")
        .eq("company_id", company.id)
        .eq("month_year", currentMonth)
        .single();

      if (estimateError || !estimate) {
        console.log(`No estimate found for ${company.name} for ${currentMonth}`);
        continue;
      }

      // Calculate actual costs from reminder_logs
      const startOfMonth = new Date(currentMonth + "-01").toISOString();
      const endOfMonth = new Date(new Date(currentMonth + "-01").setMonth(new Date(currentMonth + "-01").getMonth() + 1)).toISOString();

      const { data: reminderLogs, error: logsError } = await supabase
        .from("reminder_logs")
        .select("channel, status")
        .eq("company_id", company.id)
        .eq("status", "sent")
        .gte("created_at", startOfMonth)
        .lt("created_at", endOfMonth);

      if (logsError) {
        console.error(`Error fetching logs for ${company.name}:`, logsError);
        continue;
      }

      // Calculate actual costs
      const emailCount = reminderLogs?.filter(l => l.channel === "email").length || 0;
      const smsCount = reminderLogs?.filter(l => l.channel === "sms").length || 0;
      const voiceCount = reminderLogs?.filter(l => l.channel === "voice").length || 0;

      const actualEmailCost = emailCount * 0.001;
      const actualSmsCost = smsCount * 0.0079;
      const actualVoiceCost = voiceCount * 0.11;
      const actualTotalCost = actualEmailCost + actualSmsCost + actualVoiceCost;

      const estimatedTotal = Number(estimate.estimated_total_cost) || 0;
      
      if (estimatedTotal === 0) {
        console.log(`No estimated costs for ${company.name}`);
        continue;
      }

      const variancePercent = ((actualTotalCost - estimatedTotal) / estimatedTotal) * 100;

      console.log(`${company.name}: Actual $${actualTotalCost.toFixed(2)} vs Estimated $${estimatedTotal.toFixed(2)} (${variancePercent.toFixed(1)}%)`);

      // Check if variance exceeds threshold
      if (variancePercent > company.cost_alert_threshold) {
        // Get tenant integrations for Resend API key
        const { data: integration } = await supabase
          .from("tenant_integrations")
          .select("resend_api_key")
          .eq("company_id", company.id)
          .single();

        if (!integration?.resend_api_key) {
          console.log(`No Resend API key for ${company.name}`);
          continue;
        }

        const resend = new Resend(integration.resend_api_key);

        const { error: emailError } = await resend.emails.send({
          from: "Cost Alerts <alerts@resend.dev>",
          to: [company.cost_alert_email],
          subject: `⚠️ Cost Alert: Budget exceeded by ${variancePercent.toFixed(0)}%`,
          html: `
            <h2>Cost Alert for ${company.name}</h2>
            <p>Your actual costs this month have exceeded your estimated budget by <strong>${variancePercent.toFixed(1)}%</strong>.</p>
            
            <h3>Cost Breakdown</h3>
            <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Category</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Estimated</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Actual</th>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">Email</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${Number(estimate.estimated_email_cost).toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${actualEmailCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">SMS</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${Number(estimate.estimated_sms_cost).toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${actualSmsCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">Voice</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${Number(estimate.estimated_voice_cost).toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${actualVoiceCost.toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; background: #fef2f2;">
                <td style="padding: 8px; border: 1px solid #e5e7eb;">Total</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${estimatedTotal.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">$${actualTotalCost.toFixed(2)}</td>
              </tr>
            </table>
            
            <p style="margin-top: 20px;">Your alert threshold is set to ${company.cost_alert_threshold}%.</p>
            <p>Review your reminder strategy to optimize costs.</p>
          `,
        });

        if (emailError) {
          console.error(`Error sending email to ${company.name}:`, emailError);
          continue;
        }

        // Update last alert timestamp
        await supabase
          .from("companies")
          .update({ last_cost_alert_at: new Date().toISOString() })
          .eq("id", company.id);

        alertsSent.push(company.name);
        console.log(`Alert sent to ${company.name}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alertsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in cost-alerts function:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
