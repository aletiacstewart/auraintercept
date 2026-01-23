import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-REMINDERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Get companies with active trials
    const { data: companies, error: fetchError } = await supabaseClient
      .from('companies')
      .select(`
        id, name, trial_ends_at, 
        trial_reminder_7d_sent, trial_reminder_3d_sent, 
        trial_reminder_1d_sent, trial_expired_sent
      `)
      .gt('trial_ends_at', now.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch companies: ${fetchError.message}`);
    }

    logStep("Fetched companies with active trials", { count: companies?.length || 0 });

    let remindersSent = 0;

    for (const company of companies || []) {
      const trialEnds = new Date(company.trial_ends_at);
      const daysRemaining = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get company admin email
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('company_id', company.id);

      if (!admins || admins.length === 0) continue;

      const adminEmail = admins[0].email;
      if (!adminEmail) continue;

      // Get company's Resend API key
      const { data: integrations } = await supabaseClient
        .from('tenant_integrations')
        .select('resend_api_key')
        .eq('company_id', company.id)
        .single();

      const resendApiKey = integrations?.resend_api_key;
      if (!resendApiKey) {
        logStep("No Resend API key for company, skipping", { companyId: company.id });
        continue;
      }

      let shouldSendReminder = false;
      let reminderType = '';
      let updateField = '';

      // Check which reminder to send
      if (daysRemaining <= 7 && daysRemaining > 3 && !company.trial_reminder_7d_sent) {
        shouldSendReminder = true;
        reminderType = '7-day';
        updateField = 'trial_reminder_7d_sent';
      } else if (daysRemaining <= 3 && daysRemaining > 1 && !company.trial_reminder_3d_sent) {
        shouldSendReminder = true;
        reminderType = '3-day';
        updateField = 'trial_reminder_3d_sent';
      } else if (daysRemaining <= 1 && daysRemaining > 0 && !company.trial_reminder_1d_sent) {
        shouldSendReminder = true;
        reminderType = '1-day';
        updateField = 'trial_reminder_1d_sent';
      }

      if (shouldSendReminder) {
        try {
          // Send email via Resend
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Aura Intercept <noreply@aura-intercept.com>',
              to: adminEmail,
              subject: getEmailSubject(reminderType, company.name),
              html: getEmailHtml(reminderType, company.name, daysRemaining),
            }),
          });

          if (emailResponse.ok) {
            // Update the reminder sent flag
            await supabaseClient
              .from('companies')
              .update({ [updateField]: true })
              .eq('id', company.id);

            logStep("Reminder sent", { 
              companyId: company.id, 
              reminderType, 
              email: adminEmail 
            });
            remindersSent++;
          } else {
            const errorText = await emailResponse.text();
            logStep("Failed to send email", { companyId: company.id, error: errorText });
          }
        } catch (emailError) {
          logStep("Email send error", { 
            companyId: company.id, 
            error: emailError instanceof Error ? emailError.message : String(emailError) 
          });
        }
      }
    }

    // Check for expired trials
    const { data: expiredCompanies } = await supabaseClient
      .from('companies')
      .select('id, name, trial_ends_at, trial_expired_sent')
      .lt('trial_ends_at', now.toISOString())
      .eq('trial_expired_sent', false);

    for (const company of expiredCompanies || []) {
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('company_id', company.id);

      const { data: integrations } = await supabaseClient
        .from('tenant_integrations')
        .select('resend_api_key')
        .eq('company_id', company.id)
        .single();

      if (!admins?.[0]?.email || !integrations?.resend_api_key) continue;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integrations.resend_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Aura Intercept <noreply@aura-intercept.com>',
            to: admins[0].email,
            subject: `Your free trial has ended - ${company.name}`,
            html: getExpiredEmailHtml(company.name),
          }),
        });

        await supabaseClient
          .from('companies')
          .update({ trial_expired_sent: true })
          .eq('id', company.id);

        logStep("Expiration notice sent", { companyId: company.id });
        remindersSent++;
      } catch (error) {
        logStep("Failed to send expiration notice", { companyId: company.id });
      }
    }

    logStep("Function completed", { remindersSent });

    return new Response(JSON.stringify({ 
      success: true, 
      remindersSent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in trial-reminders", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function getEmailSubject(reminderType: string, companyName: string): string {
  switch (reminderType) {
    case '7-day':
      return `Your free trial ends in 7 days - Subscribe to keep your AI Agent`;
    case '3-day':
      return `Only 3 days left! Subscribe to continue using Aura Intercept`;
    case '1-day':
      return `⚠️ Last day of your free trial - ${companyName}`;
    default:
      return `Trial reminder - ${companyName}`;
  }
}

function getEmailHtml(reminderType: string, companyName: string, daysRemaining: number): string {
  const urgencyClass = reminderType === '1-day' ? 'color: #dc2626;' : 'color: #f59e0b;';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #0EA5E9; }
        .countdown { font-size: 48px; font-weight: bold; text-align: center; ${urgencyClass} }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .features { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-item { display: flex; align-items: center; margin: 8px 0; }
        .check { color: #10b981; margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡ Aura Intercept</div>
        </div>
        
        <h2>Hi ${companyName},</h2>
        
        <p>Your free trial is ending soon!</p>
        
        <div class="countdown">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left</div>
        
        <p>Don't lose access to your AI-powered appointment assistant. Subscribe now to keep:</p>
        
        <div class="features">
          <div class="feature-item"><span class="check">✓</span> Unlimited AI-powered appointments</div>
          <div class="feature-item"><span class="check">✓</span> Email, SMS & Voice reminders</div>
          <div class="feature-item"><span class="check">✓</span> Custom AI voice assistant</div>
          <div class="feature-item"><span class="check">✓</span> Talk to Aura chat</div>
          <div class="feature-item"><span class="check">✓</span> Full analytics & reports</div>
        </div>
        
        <div style="text-align: center;">
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard/subscription" class="cta-button">
            Subscribe Now - Starting at $497/month
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Questions? Reply to this email and we'll help you out.
        </p>
      </div>
    </body>
    </html>
  `;
}

function getExpiredEmailHtml(companyName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; color: #0EA5E9; }
        .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡ Aura Intercept</div>
        </div>
        
        <h2>Hi \${companyName},</h2>
        
        <div class="alert">
          <strong>Your free trial has ended.</strong>
          <p>Your access to premium features has been restricted.</p>
        </div>
        
        <p>We hope you enjoyed using Aura Intercept! To restore full access to your AI appointment assistant, subscribe to our Enterprise plan.</p>
        
        <div style="text-align: center;">
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard/subscription" class="cta-button">
            Subscribe Now - Starting at $497/month
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Your data is safe and will be waiting for you when you return.
        </p>
      </div>
    </body>
    </html>
  `;
}