import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent system prompts with their specific behaviors and capabilities
const AGENT_PROMPTS: Record<string, string> = {
  triage: `You are a Triage Agent for a service business. Your role is to:
- Greet customers warmly and professionally
- Classify their intent (booking, emergency, quote, general inquiry)
- Assess urgency level (low, medium, high, emergency)
- Collect initial information (name, contact, brief description of need)
- Route to the appropriate specialized agent

CRITICAL: When transferring to another agent, you MUST:
1. First, provide a friendly message to the customer explaining what will happen
2. Then use the handoff_to_agent tool to transfer the conversation

Example responses when handing off:
- For booking: "I understand you'd like to schedule an appointment. Let me connect you with our scheduling specialist who can help find the perfect time for you."
- For emergencies: "I can see this is urgent. Let me immediately connect you with our emergency dispatch team who can get someone out to help you right away."
- For quotes: "You'd like a quote for service. Let me transfer you to our quoting specialist who can provide you with accurate pricing."

NEVER just process the handoff silently - always explain to the customer what's happening and reassure them.
Be concise but friendly. Ask clarifying questions when needed.`,

  booking: `You are a Booking Agent for a service business. Your role is to:
- Help customers schedule, reschedule, or cancel appointments
- Check availability and offer time slots
- Confirm booking details (date, time, service type, duration)
- Send confirmation messages
- Handle scheduling conflicts gracefully

Use the check_availability tool to find open slots.
Use the create_appointment tool to book appointments.
Always confirm the details before finalizing.`,

  followup: `You are a Follow-up Agent for a service business. Your role is to:
- Check in with customers after their service
- Gather satisfaction feedback (1-5 rating)
- Address any concerns or issues
- Thank customers for their business
- Trigger review requests for satisfied customers

Use the send_followup tool to schedule follow-up messages.
If rating is 4-5, use handoff_to_agent to send to review agent.
If rating is 1-2, use escalate_issue tool.`,

  review: `You are a Review Agent for a service business. Your role is to:
- Request reviews from satisfied customers
- Provide direct links to review platforms (Google, Yelp)
- Thank customers for positive feedback
- Handle negative feedback diplomatically and escalate if needed
- Generate appropriate responses to reviews

Use the send_review_request tool to send review links.
Be grateful and professional. Never be pushy about reviews.`,

  dispatch: `You are a Dispatch Agent for a field service business. Your role is to:
- Assign jobs to technicians based on skills, location, and availability
- Handle emergency dispatch requests
- Optimize workload distribution
- Communicate assignments to field staff
- Track job status and reassign if needed

Use the assign_technician tool to assign jobs.
Use the check_tech_availability tool to see who's available.
Prioritize emergencies and customer convenience.`,

  route: `You are a Route Optimization Agent. Your role is to:
- Plan efficient routes for field technicians
- Consider traffic, time windows, and job priorities
- Re-route in real-time when conditions change
- Minimize travel time and fuel costs
- Ensure all appointments are reachable on time

Use the optimize_route tool to plan routes.
Provide specific route details, distances, and time estimates.`,

  eta: `You are an ETA Agent for a field service business. Your role is to:
- Calculate accurate arrival times for technicians
- Send proactive updates to customers
- Alert about delays and provide new estimates
- Track real-time technician location
- Notify customers when technician is nearby

Use the calculate_eta tool to get arrival times.
Use the send_eta_update tool to notify customers.
Be precise with time estimates.`,

  checkin: `You are a Check-in Agent for field operations. Your role is to:
- Verify technician arrival at job sites
- Start and stop job timers
- Collect before/after photos
- Document work completed
- Get customer sign-off

Use the start_job tool when technician arrives.
Use the complete_job tool when work is done.
Be thorough with documentation.`,

  quoting: `You are a Quoting Agent for a service business. Your role is to:
- Generate accurate service quotes
- Calculate labor, parts, and total costs
- Apply any applicable discounts
- Explain pricing clearly to customers
- Handle quote follow-ups

Use the generate_quote tool to create quotes.
Use the send_quote tool to deliver to customers.
Break down costs clearly. Be transparent about what's included.`,

  invoice: `You are an Invoice Agent for a service business. Your role is to:
- Generate invoices from completed jobs
- Send payment links to customers
- Track payment status
- Send payment reminders
- Handle payment disputes gracefully

Use the generate_invoice tool to create invoices.
Use the send_payment_link tool for payment collection.
Be professional and clear about amounts due.`,

  inventory: `You are an Inventory Agent for a service business. Your role is to:
- Track parts and supplies stock levels
- Alert when items are running low
- Trigger reorder processes
- Track usage by technician
- Forecast inventory needs

Use the check_inventory tool to see stock levels.
Use the reorder_parts tool to trigger orders.
Provide specific quantities and item names.`,

  warranty: `You are a Warranty Agent for a service business. Your role is to:
- Check warranty coverage for equipment/services
- Process warranty claims
- Track claim status
- Alert customers before warranties expire
- Explain warranty terms clearly

Use the check_warranty tool to verify coverage.
Use the submit_warranty_claim tool to process claims.
Be helpful in navigating warranty processes.`,

  promo: `You are a Promotions Agent for a service business. Your role is to:
- Create targeted promotional campaigns
- Identify customer segments for offers
- Personalize discount offers
- Track campaign performance
- A/B test different approaches

Use the create_campaign tool to launch promotions.
Use the send_promo tool to deliver offers.
Be creative with promotions. Target the right customers.`,

  referral: `You are a Referral Agent for a service business. Your role is to:
- Manage customer referral programs
- Generate unique referral links
- Track successful referrals
- Process referral rewards
- Encourage sharing

Use the generate_referral_link tool to create links.
Use the process_referral_reward tool for successful referrals.
Make referral programs easy and rewarding.`,

  winback: `You are a Win-back Agent for a service business. Your role is to:
- Identify churned or inactive customers
- Create personalized re-engagement campaigns
- Offer special incentives to return
- Track win-back success rates
- Learn from churn patterns

Use the create_winback_offer tool to create incentives.
Use the send_winback_campaign tool to reach out.
Be warm and understanding. Acknowledge the time away.`,

  seasonal: `You are a Seasonal Campaign Agent for a service business. Your role is to:
- Plan seasonal service reminders
- Create timely maintenance campaigns
- Consider weather patterns and seasons
- Schedule annual service reminders
- Optimize timing for customer engagement

Use the create_seasonal_campaign tool to plan campaigns.
Use the send_seasonal_reminder tool for reminders.
Be proactive about seasonal needs.`,

  insights: `You are an Insights Agent for a service business. Your role is to:
- Analyze business performance data
- Identify trends and patterns
- Detect anomalies that need attention
- Provide actionable recommendations
- Generate performance reports

Use the analyze_metrics tool to gather data.
Use the generate_report tool for detailed reports.
Be data-driven but explain in business terms.`,

  forecast: `You are a Forecast Agent for a service business. Your role is to:
- Predict future demand based on historical data
- Project revenue and capacity needs
- Identify seasonal patterns
- Recommend staffing adjustments
- Plan for growth or slowdowns

Use the forecast_demand tool for predictions.
Use the generate_capacity_plan tool for planning.
Provide confidence levels with predictions.`,
};

// Tool definitions for each agent category
const AGENT_TOOLS: Record<string, any[]> = {
  triage: [
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off the conversation to another specialized agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['booking', 'dispatch', 'quoting', 'followup', 'review', 'warranty'] },
            reason: { type: 'string', description: 'Why the handoff is happening' },
            urgency: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
            customer_intent: { type: 'string', description: 'What the customer wants to do' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'collect_customer_info',
        description: 'Collect and store customer information',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            issue_description: { type: 'string' },
          },
        },
      },
    },
  ],
  booking: [
    {
      type: 'function',
      function: {
        name: 'check_availability',
        description: 'Check available appointment slots',
        parameters: {
          type: 'object',
          properties: {
            service_type: { type: 'string' },
            preferred_date: { type: 'string' },
            employee_id: { type: 'string' },
          },
          required: ['service_type'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_appointment',
        description: 'Create a new appointment',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string' },
            customer_phone: { type: 'string' },
            customer_email: { type: 'string' },
            service_type: { type: 'string' },
            datetime: { type: 'string' },
            duration_minutes: { type: 'number' },
            notes: { type: 'string' },
          },
          required: ['customer_name', 'service_type', 'datetime'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reschedule_appointment',
        description: 'Reschedule an existing appointment',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            new_datetime: { type: 'string' },
          },
          required: ['appointment_id', 'new_datetime'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'cancel_appointment',
        description: 'Cancel an appointment',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['appointment_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to another agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['dispatch', 'quoting', 'triage'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  followup: [
    {
      type: 'function',
      function: {
        name: 'send_followup',
        description: 'Send a follow-up message to customer',
        parameters: {
          type: 'object',
          properties: {
            customer_id: { type: 'string' },
            channel: { type: 'string', enum: ['sms', 'email', 'call'] },
            message: { type: 'string' },
          },
          required: ['channel', 'message'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'record_feedback',
        description: 'Record customer satisfaction feedback',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comments: { type: 'string' },
          },
          required: ['rating'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'escalate_issue',
        description: 'Escalate an issue to management',
        parameters: {
          type: 'object',
          properties: {
            issue_description: { type: 'string' },
            urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
            customer_contact: { type: 'string' },
          },
          required: ['issue_description'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to review agent for satisfied customers',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['review', 'winback'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  review: [
    {
      type: 'function',
      function: {
        name: 'send_review_request',
        description: 'Send review request with platform links',
        parameters: {
          type: 'object',
          properties: {
            customer_contact: { type: 'string' },
            channel: { type: 'string', enum: ['sms', 'email'] },
            platforms: { type: 'array', items: { type: 'string' } },
          },
          required: ['channel', 'platforms'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'respond_to_review',
        description: 'Generate a response to a customer review',
        parameters: {
          type: 'object',
          properties: {
            review_text: { type: 'string' },
            rating: { type: 'number' },
            response_tone: { type: 'string', enum: ['thankful', 'apologetic', 'professional'] },
          },
          required: ['review_text', 'rating'],
        },
      },
    },
  ],
  dispatch: [
    {
      type: 'function',
      function: {
        name: 'check_tech_availability',
        description: 'Check technician availability',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            skills_required: { type: 'array', items: { type: 'string' } },
            location: { type: 'string' },
          },
          required: ['date'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'assign_technician',
        description: 'Assign a technician to a job',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            technician_id: { type: 'string' },
            priority: { type: 'string', enum: ['normal', 'high', 'emergency'] },
          },
          required: ['appointment_id', 'technician_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to route or ETA agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['route', 'eta', 'booking'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  route: [
    {
      type: 'function',
      function: {
        name: 'optimize_route',
        description: 'Optimize route for technician',
        parameters: {
          type: 'object',
          properties: {
            technician_id: { type: 'string' },
            date: { type: 'string' },
            appointments: { type: 'array', items: { type: 'string' } },
          },
          required: ['technician_id', 'date'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to ETA agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['eta', 'dispatch'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  eta: [
    {
      type: 'function',
      function: {
        name: 'calculate_eta',
        description: 'Calculate estimated time of arrival',
        parameters: {
          type: 'object',
          properties: {
            technician_id: { type: 'string' },
            appointment_id: { type: 'string' },
            current_location: { type: 'string' },
          },
          required: ['appointment_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_eta_update',
        description: 'Send ETA update to customer',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            eta_minutes: { type: 'number' },
            channel: { type: 'string', enum: ['sms', 'email', 'both'] },
          },
          required: ['appointment_id', 'eta_minutes'],
        },
      },
    },
  ],
  checkin: [
    {
      type: 'function',
      function: {
        name: 'start_job',
        description: 'Start job timer when technician arrives',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            technician_id: { type: 'string' },
            arrival_time: { type: 'string' },
          },
          required: ['appointment_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'complete_job',
        description: 'Complete job and record details',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            work_completed: { type: 'string' },
            parts_used: { type: 'array', items: { type: 'string' } },
            customer_signature: { type: 'boolean' },
          },
          required: ['appointment_id', 'work_completed'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to quoting or invoice agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['quoting', 'invoice', 'inventory'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  quoting: [
    {
      type: 'function',
      function: {
        name: 'generate_quote',
        description: 'Generate a service quote',
        parameters: {
          type: 'object',
          properties: {
            services: { type: 'array', items: { type: 'string' } },
            labor_hours: { type: 'number' },
            parts: { type: 'array', items: { type: 'object' } },
            discount_percent: { type: 'number' },
          },
          required: ['services'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_quote',
        description: 'Send quote to customer',
        parameters: {
          type: 'object',
          properties: {
            quote_id: { type: 'string' },
            customer_contact: { type: 'string' },
            channel: { type: 'string', enum: ['sms', 'email'] },
          },
          required: ['quote_id', 'channel'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to invoice agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['invoice', 'booking'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  invoice: [
    {
      type: 'function',
      function: {
        name: 'generate_invoice',
        description: 'Generate invoice from completed job',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            quote_id: { type: 'string' },
            additional_charges: { type: 'array', items: { type: 'object' } },
          },
          required: ['appointment_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_payment_link',
        description: 'Send payment link to customer',
        parameters: {
          type: 'object',
          properties: {
            invoice_id: { type: 'string' },
            customer_contact: { type: 'string' },
            channel: { type: 'string', enum: ['sms', 'email'] },
          },
          required: ['invoice_id', 'channel'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_payment_reminder',
        description: 'Send payment reminder',
        parameters: {
          type: 'object',
          properties: {
            invoice_id: { type: 'string' },
            days_overdue: { type: 'number' },
          },
          required: ['invoice_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to followup agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['followup'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  inventory: [
    {
      type: 'function',
      function: {
        name: 'check_inventory',
        description: 'Check current inventory levels',
        parameters: {
          type: 'object',
          properties: {
            part_ids: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reorder_parts',
        description: 'Trigger reorder for parts',
        parameters: {
          type: 'object',
          properties: {
            part_id: { type: 'string' },
            quantity: { type: 'number' },
            priority: { type: 'string', enum: ['normal', 'urgent'] },
          },
          required: ['part_id', 'quantity'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'record_usage',
        description: 'Record parts used on a job',
        parameters: {
          type: 'object',
          properties: {
            appointment_id: { type: 'string' },
            parts_used: { type: 'array', items: { type: 'object' } },
          },
          required: ['appointment_id', 'parts_used'],
        },
      },
    },
  ],
  warranty: [
    {
      type: 'function',
      function: {
        name: 'check_warranty',
        description: 'Check warranty status',
        parameters: {
          type: 'object',
          properties: {
            equipment_id: { type: 'string' },
            serial_number: { type: 'string' },
            customer_id: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'submit_warranty_claim',
        description: 'Submit a warranty claim',
        parameters: {
          type: 'object',
          properties: {
            equipment_id: { type: 'string' },
            issue_description: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
          },
          required: ['equipment_id', 'issue_description'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_agent',
        description: 'Hand off to other agent',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', enum: ['booking', 'dispatch'] },
            reason: { type: 'string' },
          },
          required: ['target_agent', 'reason'],
        },
      },
    },
  ],
  promo: [
    {
      type: 'function',
      function: {
        name: 'create_campaign',
        description: 'Create a promotional campaign',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            target_segment: { type: 'string' },
            discount_type: { type: 'string', enum: ['percent', 'fixed', 'free_service'] },
            discount_value: { type: 'number' },
            valid_until: { type: 'string' },
          },
          required: ['name', 'discount_type'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_promo',
        description: 'Send promotional offer to customers',
        parameters: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string' },
            customer_segment: { type: 'string' },
            channel: { type: 'string', enum: ['sms', 'email', 'both'] },
          },
          required: ['campaign_id', 'channel'],
        },
      },
    },
  ],
  referral: [
    {
      type: 'function',
      function: {
        name: 'generate_referral_link',
        description: 'Generate unique referral link for customer',
        parameters: {
          type: 'object',
          properties: {
            customer_id: { type: 'string' },
            reward_type: { type: 'string', enum: ['discount', 'credit', 'free_service'] },
          },
          required: ['customer_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'process_referral_reward',
        description: 'Process reward for successful referral',
        parameters: {
          type: 'object',
          properties: {
            referrer_id: { type: 'string' },
            referred_id: { type: 'string' },
            reward_value: { type: 'number' },
          },
          required: ['referrer_id', 'referred_id'],
        },
      },
    },
  ],
  winback: [
    {
      type: 'function',
      function: {
        name: 'identify_churned_customers',
        description: 'Identify customers at risk of churn',
        parameters: {
          type: 'object',
          properties: {
            days_inactive: { type: 'number' },
            segment: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_winback_offer',
        description: 'Create personalized win-back offer',
        parameters: {
          type: 'object',
          properties: {
            customer_id: { type: 'string' },
            offer_type: { type: 'string', enum: ['discount', 'free_service', 'loyalty_bonus'] },
            offer_value: { type: 'number' },
          },
          required: ['customer_id', 'offer_type'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_winback_campaign',
        description: 'Send win-back campaign to churned customers',
        parameters: {
          type: 'object',
          properties: {
            customer_ids: { type: 'array', items: { type: 'string' } },
            channel: { type: 'string', enum: ['sms', 'email', 'both'] },
            message_template: { type: 'string' },
          },
          required: ['channel'],
        },
      },
    },
  ],
  seasonal: [
    {
      type: 'function',
      function: {
        name: 'create_seasonal_campaign',
        description: 'Create seasonal marketing campaign',
        parameters: {
          type: 'object',
          properties: {
            season: { type: 'string', enum: ['spring', 'summer', 'fall', 'winter'] },
            service_focus: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
          },
          required: ['season', 'service_focus'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_seasonal_reminder',
        description: 'Send seasonal service reminder',
        parameters: {
          type: 'object',
          properties: {
            customer_segment: { type: 'string' },
            service_type: { type: 'string' },
            channel: { type: 'string', enum: ['sms', 'email', 'both'] },
          },
          required: ['service_type', 'channel'],
        },
      },
    },
  ],
  insights: [
    {
      type: 'function',
      function: {
        name: 'analyze_metrics',
        description: 'Analyze business performance metrics',
        parameters: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            date_range: { type: 'string' },
            comparison_period: { type: 'string' },
          },
          required: ['metrics'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_report',
        description: 'Generate detailed performance report',
        parameters: {
          type: 'object',
          properties: {
            report_type: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'custom'] },
            include_charts: { type: 'boolean' },
            send_to: { type: 'array', items: { type: 'string' } },
          },
          required: ['report_type'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'detect_anomalies',
        description: 'Detect unusual patterns in data',
        parameters: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            sensitivity: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['metric'],
        },
      },
    },
  ],
  forecast: [
    {
      type: 'function',
      function: {
        name: 'forecast_demand',
        description: 'Forecast service demand',
        parameters: {
          type: 'object',
          properties: {
            service_types: { type: 'array', items: { type: 'string' } },
            forecast_period: { type: 'string', enum: ['week', 'month', 'quarter'] },
            confidence_level: { type: 'number' },
          },
          required: ['forecast_period'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_capacity_plan',
        description: 'Generate staffing capacity plan',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            include_overtime: { type: 'boolean' },
            budget_constraint: { type: 'number' },
          },
          required: ['period'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'predict_revenue',
        description: 'Predict future revenue',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            scenario: { type: 'string', enum: ['conservative', 'moderate', 'optimistic'] },
          },
          required: ['period'],
        },
      },
    },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agentType, message, companyId, conversationHistory = [], contextId } = await req.json();

    console.log(`[AI Agent Chat] Agent: ${agentType}, Company: ${companyId}, Message: "${message.substring(0, 50)}..."`);

    // Get agent config for any custom settings
    const { data: config } = await supabase
      .from('ai_agent_configs')
      .select('settings')
      .eq('company_id', companyId)
      .eq('agent_type', agentType)
      .single();

    const settings = config?.settings || {};
    
    // Get company info for context
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    // Get context if provided
    let contextData = {};
    if (contextId) {
      const { data: context } = await supabase
        .from('ai_agent_context')
        .select('*')
        .eq('id', contextId)
        .single();
      contextData = context?.context_data || {};
    }

    // Build the system prompt
    const basePrompt = AGENT_PROMPTS[agentType] || `You are a helpful AI assistant for a service business.`;
    const systemPrompt = `${basePrompt}

Company Name: ${company?.name || 'Our Company'}
Current Context: ${JSON.stringify(contextData)}

${settings.greeting_message ? `Custom Greeting: ${settings.greeting_message}` : ''}
${settings.custom_instructions ? `Additional Instructions: ${settings.custom_instructions}` : ''}

IMPORTANT: 
- Use the available tools to perform actions
- Keep responses concise and actionable (2-4 sentences typically)
- Include specific details like names, times, or numbers when relevant
- Be professional but friendly`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Get tools for this agent type
    const tools = AGENT_TOOLS[agentType] || [
      {
        type: 'function',
        function: {
          name: 'handoff_to_agent',
          description: 'Hand off the conversation to another specialized agent',
          parameters: {
            type: 'object',
            properties: {
              target_agent: { type: 'string', description: 'The agent to hand off to' },
              reason: { type: 'string', description: 'Why the handoff is happening' },
            },
            required: ['target_agent', 'reason'],
          },
        },
      },
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];
    
    let responseText = choice?.message?.content || '';
    let handoffTo: string | null = null;
    let handoffReason: string | null = null;
    const toolCalls: Array<{ name: string; arguments: any; result: string }> = [];

    // Process tool calls
    if (choice?.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        const funcName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error('Failed to parse tool arguments:', toolCall.function.arguments);
        }
        
        if (funcName === 'handoff_to_agent') {
          handoffTo = (args as any).target_agent;
          handoffReason = (args as any).reason;
          toolCalls.push({
            name: 'handoff_to_agent',
            arguments: args,
            result: `Handing off to ${(args as any).target_agent}: ${(args as any).reason}`,
          });
        } else {
          // Execute the tool (simulated for now)
          const result = await executeAgentTool(supabase, companyId, agentType, funcName, args);
          toolCalls.push({
            name: funcName,
            arguments: args,
            result: JSON.stringify(result),
          });
        }
      }
    }

    // Generate a friendly fallback message if AI didn't provide one during handoff
    if (handoffTo && !responseText.trim()) {
      const handoffMessages: Record<string, string> = {
        booking: "I understand you'd like to schedule an appointment. Let me connect you with our scheduling specialist who can help find the perfect time for you.",
        dispatch: "I can see this needs immediate attention. Let me connect you with our dispatch team who can get someone out to help you right away.",
        quoting: "You'd like a quote for service. Let me transfer you to our quoting specialist who can provide you with accurate pricing.",
        followup: "Let me connect you with our follow-up team to ensure everything is taken care of.",
        review: "Thank you for your feedback! Let me connect you with our team to help with your review.",
        inventory: "Let me connect you with our parts specialist to check availability.",
        invoice: "Let me transfer you to our billing team who can assist with your invoice.",
        default: `I'll connect you with our ${handoffTo} specialist who can better assist you with this request.`,
      };
      responseText = handoffMessages[handoffTo] || handoffMessages.default;
    }

    // Determine event type based on agent and context
    let eventType = `${agentType}_response`;
    if (handoffTo) {
      eventType = `${agentType}_handoff`;
    } else if (toolCalls.length > 0) {
      eventType = `${agentType}_action`;
    }

    // Log the interaction
    await supabase.from('ai_agent_logs').insert({
      company_id: companyId,
      agent_type: agentType,
      context_id: contextId,
      action: 'ai_chat',
      input_data: { message, conversation_length: conversationHistory.length },
      output_data: { 
        response: responseText, 
        handoff_to: handoffTo,
        tool_calls: toolCalls,
      },
      success: true,
    });

    // Create event if there was a handoff or action
    if (handoffTo || toolCalls.length > 0) {
      await supabase.from('ai_agent_events').insert({
        company_id: companyId,
        source_agent: agentType,
        target_agent: handoffTo,
        event_type: eventType,
        payload: { 
          message, 
          response: responseText, 
          tool_calls: toolCalls,
          handoff_reason: handoffReason,
          context_id: contextId,
        },
        status: handoffTo ? 'pending' : 'processed',
        processed_at: handoffTo ? null : new Date().toISOString(),
      });
    }

    // Update context if handoff occurred
    if (handoffTo && contextId) {
      const { data: context } = await supabase
        .from('ai_agent_context')
        .select('handoff_history')
        .eq('id', contextId)
        .single();
      
      const handoffEntry = {
        from_agent: agentType,
        to_agent: handoffTo,
        reason: handoffReason,
        timestamp: new Date().toISOString(),
      };
      
      await supabase
        .from('ai_agent_context')
        .update({
          active_agent: handoffTo,
          handoff_history: [...(context?.handoff_history || []), handoffEntry],
          updated_at: new Date().toISOString(),
        })
        .eq('id', contextId);
    }

    return new Response(JSON.stringify({
      response: responseText,
      event_type: eventType,
      handoff_to: handoffTo,
      handoff_reason: handoffReason,
      tool_calls: toolCalls,
      context_id: contextId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[AI Agent Chat] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process request' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Execute agent-specific tools
async function executeAgentTool(
  supabase: any,
  companyId: string,
  agentType: string,
  toolName: string,
  args: any
): Promise<any> {
  console.log(`[AI Agent] Executing tool: ${toolName} for ${agentType}`);

  // Simulated tool execution - in production, these would connect to real systems
  switch (toolName) {
    case 'check_availability':
      return {
        success: true,
        available_slots: [
          { date: args.preferred_date || 'tomorrow', time: '9:00 AM', duration: 60 },
          { date: args.preferred_date || 'tomorrow', time: '2:00 PM', duration: 60 },
          { date: args.preferred_date || 'day after tomorrow', time: '10:00 AM', duration: 60 },
        ],
      };

    case 'create_appointment':
      const appointmentId = crypto.randomUUID();
      // Actually create the appointment
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          customer_email: args.customer_email,
          service_type: args.service_type,
          datetime: args.datetime,
          duration_minutes: args.duration_minutes || 60,
          notes: args.notes,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, appointment_id: appointment.id, message: 'Appointment created successfully' };

    case 'check_tech_availability':
      return {
        success: true,
        available_technicians: [
          { id: 'tech1', name: 'John Smith', skills: ['HVAC', 'Electrical'], distance: '5 miles' },
          { id: 'tech2', name: 'Sarah Johnson', skills: ['Plumbing', 'HVAC'], distance: '8 miles' },
        ],
      };

    case 'assign_technician':
      return {
        success: true,
        assignment_id: crypto.randomUUID(),
        technician: args.technician_id,
        appointment: args.appointment_id,
        message: 'Technician assigned successfully',
      };

    case 'calculate_eta':
      return {
        success: true,
        eta_minutes: Math.floor(Math.random() * 30) + 15,
        traffic_conditions: 'moderate',
        route_distance: '5.2 miles',
      };

    case 'generate_quote':
      const laborCost = (args.labor_hours || 2) * 75;
      const partsCost = args.parts?.reduce((sum: number, p: any) => sum + (p.price || 50), 0) || 100;
      const discount = args.discount_percent ? ((laborCost + partsCost) * args.discount_percent / 100) : 0;
      return {
        success: true,
        quote_id: crypto.randomUUID(),
        breakdown: {
          labor: laborCost,
          parts: partsCost,
          discount: discount,
          total: laborCost + partsCost - discount,
        },
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

    case 'analyze_metrics':
      return {
        success: true,
        metrics: {
          appointments_completed: Math.floor(Math.random() * 100) + 50,
          revenue: Math.floor(Math.random() * 50000) + 10000,
          customer_satisfaction: (Math.random() * 2 + 3).toFixed(1),
          average_response_time: Math.floor(Math.random() * 30) + 10,
        },
        trends: {
          appointments: '+12% vs last period',
          revenue: '+8% vs last period',
        },
      };

    case 'forecast_demand':
      return {
        success: true,
        forecast: {
          period: args.forecast_period,
          expected_appointments: Math.floor(Math.random() * 50) + 30,
          confidence: args.confidence_level || 0.85,
          peak_days: ['Monday', 'Friday'],
          recommended_staff: 4,
        },
      };

    default:
      return {
        success: true,
        message: `Tool ${toolName} executed with args: ${JSON.stringify(args)}`,
      };
  }
}
