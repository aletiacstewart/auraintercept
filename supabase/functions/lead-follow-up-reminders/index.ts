import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyTerminology } from "../_shared/industry-pack.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FollowUp {
  id: string;
  lead_id: string;
  company_id: string;
  scheduled_at: string;
  follow_up_type: string;
  message_template: string | null;
  status: string;
}

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending follow-ups that are due
    const { data: followUps, error: fetchError } = await supabase
      .from('lead_follow_ups')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch follow-ups: ${fetchError.message}`);
    }

    if (!followUps || followUps.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending follow-ups' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const followUp of followUps as FollowUp[]) {
      try {
        // Get lead details
        const { data: lead } = await supabase
          .from('leads')
          .select('id, name, phone, email, company_id')
          .eq('id', followUp.lead_id)
          .single();

        if (!lead) {
          // Lead was deleted, mark follow-up as cancelled
          await supabase
            .from('lead_follow_ups')
            .update({ status: 'cancelled' })
            .eq('id', followUp.id);
          continue;
        }

        // Get company details
        const { data: company } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', followUp.company_id)
          .single();

        const companyName = company?.name || 'Our Team';
        const leadName = lead.name || 'there';
        const pack = await loadIndustryPackForCompany(supabase, followUp.company_id);

        let sent = false;
        let errorMessage: string | null = null;

        // Process based on follow-up type
        switch (followUp.follow_up_type) {
          case 'sms':
            if (lead.phone) {
              // Get company's SignalWire credentials
              const { data: settings } = await supabase
                .from('tenant_integrations')
                .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
                .eq('company_id', followUp.company_id)
                .single();

              if (settings?.signalwire_project_id && settings?.signalwire_api_token && settings?.signalwire_phone_number && settings?.signalwire_space_url) {
                const message = applyTerminology(
                  followUp.message_template ||
                    `Hi ${leadName}, this is ${companyName} following up on your inquiry. How can we help you today?`,
                  pack
                );

                try {
                  const signalwireResponse = await fetch(
                    `https://${settings.signalwire_space_url}/api/laml/2010-04-01/Accounts/${settings.signalwire_project_id}/Messages`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Basic ${btoa(`${settings.signalwire_project_id}:${settings.signalwire_api_token}`)}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      body: new URLSearchParams({
                        To: lead.phone,
                        From: settings.signalwire_phone_number,
                        Body: message,
                      }),
                    }
                  );

                  if (signalwireResponse.ok) {
                    sent = true;
                  } else {
                    const signalwireError = await signalwireResponse.json();
                    errorMessage = signalwireError.message || 'Failed to send SMS';
                  }
                } catch (e: unknown) {
                  errorMessage = `SMS error: ${e instanceof Error ? e.message : 'Unknown error'}`;
                }
              } else {
                errorMessage = 'SignalWire not configured';
              }
            } else {
              errorMessage = 'No phone number';
            }
            break;

          case 'email':
            if (lead.email) {
              const resendApiKey = Deno.env.get('RESEND_API_KEY');
              
              if (resendApiKey) {
                const subject = `Following up on your inquiry - ${companyName}`;
                const message = applyTerminology(
                  followUp.message_template ||
                    `Hello ${leadName},\n\nI wanted to follow up on your recent inquiry with ${companyName}. Please let me know if you have any questions or would like to schedule a {service}.\n\nBest regards,\n${companyName}`,
                  pack
                );

                try {
                  const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${resendApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: `${companyName} <noreply@auraintercept.ai>`,
                      to: [lead.email],
                      subject,
                      text: message,
                    }),
                  });

                  if (emailResponse.ok) {
                    sent = true;
                  } else {
                    const emailError = await emailResponse.json();
                    errorMessage = emailError.message || 'Failed to send email';
                  }
                } catch (e: unknown) {
                  errorMessage = `Email error: ${e instanceof Error ? e.message : 'Unknown error'}`;
                }
              } else {
                errorMessage = 'Email not configured';
              }
            } else {
              errorMessage = 'No email address';
            }
            break;

          case 'call':
          case 'task':
            // These are reminder types - just mark as completed
            // The actual action should be taken by the user
            sent = true;
            break;
        }

        // Update follow-up status
        await supabase
          .from('lead_follow_ups')
          .update({
            status: sent ? 'sent' : 'failed',
            completed_at: sent ? new Date().toISOString() : null,
          })
          .eq('id', followUp.id);

        // Log activity
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: followUp.lead_id,
            company_id: followUp.company_id,
            activity_type: 'follow_up_sent',
            description: sent 
              ? `Automated ${followUp.follow_up_type} follow-up sent`
              : `Follow-up failed: ${errorMessage}`,
            metadata: {
              follow_up_id: followUp.id,
              follow_up_type: followUp.follow_up_type,
              success: sent,
              error: errorMessage,
            },
          });

        // Update lead's last_activity_at
        await supabase
          .from('leads')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', followUp.lead_id);

        results.push({
          followUpId: followUp.id,
          leadId: followUp.lead_id,
          type: followUp.follow_up_type,
          sent,
          error: errorMessage,
        });
      } catch (e: unknown) {
        console.error(`Error processing follow-up ${followUp.id}:`, e);
        results.push({
          followUpId: followUp.id,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
