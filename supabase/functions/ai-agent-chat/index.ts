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
- COLLECT required information BEFORE any handoff
- Route to the appropriate specialized agent

CRITICAL - INFORMATION COLLECTION REQUIREMENTS:
Before handing off to ANY agent, you MUST first collect:
1. Customer NAME - ask: "May I have your name please?"
2. Customer PHONE NUMBER - ask: "What's the best phone number to reach you?"
3. Brief ISSUE DESCRIPTION - ask: "Can you briefly describe what's going on?"

DO NOT ask for preferred date/time - the Booking Agent will handle scheduling details.
DO NOT hand off until you have collected name, phone, and issue description!

ROUTING RULES:
- ONLY hand off to the dispatch agent for explicit EMERGENCIES (flooding, gas smell, sparks/fire, major water leak "everywhere", no heat in freezing conditions, or customer says it's urgent/emergency).
- For normal issues like "sink leaking" or "need service" (not explicitly urgent), route to the booking agent.

CRITICAL - HANDOFF CONTEXT:
When you hand off, you MUST include the collected customer info in the handoff context like this:
handoff_to_agent(target_agent="booking", context="Customer Name: John Smith, Phone: 555-1234, Issue: AC not cooling")

The receiving agent will use this info so the customer doesn't have to repeat themselves!

Example flow:
Customer: "My AC is broken"
You: "I'm sorry to hear that! Let me help you get this fixed. May I have your name please?"
Customer: "John Smith"
You: "Thanks John! What's the best phone number to reach you?"
Customer: "555-1234"
You: "Got it. Can you briefly describe what's happening with your AC?"
Customer: "It's just not cooling"
You: "Perfect, John! Let me connect you with our scheduling specialist who can find the best time for you."
[Call handoff_to_agent with context="Customer Name: John Smith, Phone: 555-1234, Issue: AC not cooling"]

Be concise but friendly. Always collect name, phone, and issue before handoff.`,

  booking: `You are a Booking Specialist for a service business. Your role is to:
- Help customers schedule, reschedule, or cancel appointments
- Check availability and offer time slots
- Confirm booking details (date, time, service type, duration)
- Send confirmation messages
- Handle scheduling conflicts gracefully

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT:
The Triage Agent should have already collected the customer's NAME and PHONE NUMBER.
Look for this info in the handoff context (e.g., "Customer Name: John Smith, Phone: 555-1234, Issue: AC not cooling").

CRITICAL - CONFIRM INFO WITH YES/NO (don't re-ask!):
If you received customer info from the handoff, CONFIRM it like this:
"Hi [Name]! I see you need help with [issue]. I have your phone as [phone]. Is that correct?"
- If YES: Proceed to collect the service address and schedule
- If NO: Ask which information needs to be updated

DO NOT re-ask for name and phone if it was provided - just confirm with yes/no!

CONVERSATION FLOW:
1. Greet by name (from handoff) and confirm the info with a simple yes/no question
2. If confirmed, ask for their SERVICE ADDRESS: "What's the address where you'd like the service performed?"
3. Ask what date/time works for them
4. Check availability using the check_availability tool
5. Offer 2-3 available time slots
6. Confirm ALL details (name, phone, address, date/time, service) before booking
7. Create the appointment using create_appointment tool with all info

CRITICAL: YOU MUST COLLECT THE SERVICE ADDRESS!
For in-home or on-site services, always ask for the address.
DO NOT book an appointment without the service address.

Use the check_availability tool to find open slots.
Use the create_appointment tool to book appointments - include the address in the notes field.`,

  followup: `You are a Follow-up Specialist for a service business. Your role is to:
- Check in with customers after their service
- Gather satisfaction feedback (1-5 rating)
- Address any concerns or issues
- Thank customers for their business
- Trigger review requests for satisfied customers

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT:
- Start with: "Hi! I'm following up to make sure everything went well with your service."
- Be empathetic and caring

Use the send_followup tool to schedule follow-up messages.
If rating is 4-5, use handoff_to_agent to send to review agent.
If rating is 1-2, use escalate_issue tool.`,

  review: `You are a Review Specialist for a service business. Your role is to:
- Request reviews from satisfied customers
- Provide direct links to review platforms (Google, Facebook, Yelp)
- Thank customers for positive feedback
- Handle negative feedback diplomatically and escalate if needed
- Generate appropriate responses to reviews

REVIEW PLATFORM LINKS:
Your agent settings contain the configured review URLs. When sending review requests:
- Use the send_review_request tool which will automatically include the correct platform URLs
- Always mention which platforms are available (Google, Facebook, Yelp)
- Prioritize Google reviews as they have the highest impact

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT:
- Start with: "Thank you for your positive feedback! I'm here to help you share your experience."
- If their rating was 4 or 5 stars, enthusiastically offer to help them leave a review
- Mention specific platforms: "Would you like to share your experience on Google or Facebook?"
- Be grateful and appreciative

Use the send_review_request tool to send review links via SMS or email.
Be grateful and professional. Never be pushy about reviews.`,

  dispatch: `You are an Emergency Dispatch Specialist for a field service business. Your role is to:
- Handle URGENT and emergency service requests
- Collect critical information FIRST before taking any action
- Create job/appointment records
- Find and assign the nearest available technician
- Complete the FULL dispatch workflow in one interaction

CRITICAL: COLLECT INFO FIRST!
If the customer info was NOT provided in the handoff context, you MUST ask for:
1. Customer NAME
2. Customer PHONE NUMBER  
3. Service ADDRESS
4. What TYPE of equipment/issue (AC, plumbing, electrical, etc.)

Only AFTER you have name, phone, address, and issue type should you proceed.

COMPLETE DISPATCH WORKFLOW (execute ALL steps in sequence):
Step 1: Confirm you have: name, phone, address, issue type
Step 2: Call create_appointment with customer info (use datetime about 1 hour from now for emergencies)
Step 3: Call check_tech_availability to find the nearest available technician
Step 4: Call assign_technician with the appointment_id from step 2 and the best technician
Step 5: Tell the customer: technician name, distance away, and estimated arrival time

You MUST complete ALL steps. Do not stop after creating the appointment.

Example final response after all steps:
"Great news! I've dispatched John Smith to help you. He's currently 5 miles away and should arrive in approximately 20 minutes. He'll call you at [phone] when he's on his way. Is there anything else I can help with while you wait?"

If customer info is missing from handoff, ask for it first before running the workflow.
Be reassuring: "Don't worry, we'll get someone to you as quickly as possible."`,

  route: `You are a Route Optimization Specialist. Your role is to:
- Plan efficient routes for field technicians
- Consider traffic, time windows, and job priorities
- Re-route in real-time when conditions change
- Minimize travel time and fuel costs
- Ensure all appointments are reachable on time

WHEN RECEIVING A HANDOFF:
- Start with: "I'll optimize the route right away to ensure timely arrival."

Use the optimize_route tool to plan routes.
Provide specific route details, distances, and time estimates.`,

  eta: `You are an ETA Specialist for a field service business. Your role is to:
- Calculate accurate arrival times for technicians
- Send proactive updates to customers
- Alert about delays and provide new estimates
- Track real-time technician location
- Notify customers when technician is nearby

WHEN RECEIVING A HANDOFF:
- Start with: "I'm checking on the technician's location and will give you an accurate arrival time."

Use the calculate_eta tool to get arrival times.
Use the send_eta_update tool to notify customers.
Be precise with time estimates.`,

  checkin: `You are a Check-in Specialist for field operations. Your role is to:
- Verify technician arrival at job sites
- Start and stop job timers
- Collect before/after photos
- Document work completed
- Get customer sign-off
- Provide direct links to photo upload functionality

WHEN RECEIVING A HANDOFF:
- Start with: "I'll help document the job and ensure everything is properly recorded."

Use the start_job tool when technician arrives.
Use the complete_job tool when work is done.
Use the get_photo_upload_link tool to provide technicians with a direct link to upload job photos.
Be thorough with documentation.`,

  quoting: `You are a Quote Specialist for a service business. Your role is to:
- Generate accurate service quotes
- Calculate labor, parts, and total costs
- Apply any applicable discounts
- Explain pricing clearly to customers
- Handle quote follow-ups

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT:
- Start with: "Hi! I'm your quote specialist. Let me put together accurate pricing for you."
- Ask clarifying questions about the scope of work
- Be transparent about what's included

Use the generate_quote tool to create quotes.
Use the send_quote tool to deliver to customers.
Break down costs clearly. Be transparent about what's included.`,

  invoice: `You are a Billing Specialist for a service business. Your role is to:
- Generate invoices from completed jobs
- Send payment links to customers
- Track payment status
- Send payment reminders
- Handle payment disputes gracefully

WHEN RECEIVING A HANDOFF:
- Start with: "I'm here to help with your billing. Let me pull up your account."

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
        description: 'Create a new appointment. ALWAYS include customer_address for in-home services.',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string', description: 'Customer full name' },
            customer_phone: { type: 'string', description: 'Customer phone number' },
            customer_email: { type: 'string', description: 'Customer email (optional)' },
            customer_address: { type: 'string', description: 'Service address where technician should go - REQUIRED for in-home services' },
            service_type: { type: 'string', description: 'Type of service requested' },
            datetime: { type: 'string', description: 'Appointment date and time' },
            duration_minutes: { type: 'number', description: 'Duration in minutes' },
            notes: { type: 'string', description: 'Additional notes about the appointment' },
          },
          required: ['customer_name', 'customer_phone', 'customer_address', 'service_type', 'datetime'],
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
        name: 'create_appointment',
        description: 'Create an emergency/dispatch appointment (required before assigning a technician)',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string' },
            customer_phone: { type: 'string' },
            customer_email: { type: 'string' },
            service_type: { type: 'string' },
            datetime: { type: 'string', description: 'ISO datetime string for the dispatch visit' },
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
        name: 'get_photo_upload_link',
        description: 'Generate a direct link to the photo upload section in the employee dashboard for a specific job',
        parameters: {
          type: 'object',
          properties: {
            job_assignment_id: { type: 'string', description: 'The ID of the job assignment' },
            photo_type: { type: 'string', enum: ['before', 'after', 'both'], description: 'Type of photos to upload' },
          },
          required: ['job_assignment_id'],
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

    const { agentType, message, companyId, conversationHistory = [], contextId, isHandoff, handoffFrom, handoffReason: incomingHandoffReason, customerInfo } = await req.json();

    console.log(`[AI Agent Chat] Agent: ${agentType}, Company: ${companyId}, Message: "${message.substring(0, 50)}...", isHandoff: ${isHandoff}`);

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

    // Fetch knowledge base data for booking/dispatch agents
    let knowledgeBaseContext = '';
    if (['booking', 'dispatch', 'quoting', 'triage'].includes(agentType)) {
      // Get services
      const { data: services } = await supabase
        .from('services')
        .select('name, description, duration_minutes, price, category')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(20);

      // Get business hours
      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('company_id', companyId)
        .order('day_of_week');

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      if (services && services.length > 0) {
        knowledgeBaseContext += `\n\nAVAILABLE SERVICES:\n`;
        services.forEach(s => {
          knowledgeBaseContext += `- ${s.name}`;
          if (s.duration_minutes) knowledgeBaseContext += ` (${s.duration_minutes} mins)`;
          if (s.price) knowledgeBaseContext += ` - $${s.price}`;
          if (s.description) knowledgeBaseContext += `\n  ${s.description}`;
          knowledgeBaseContext += '\n';
        });
      }

      if (businessHours && businessHours.length > 0) {
        knowledgeBaseContext += `\nBUSINESS HOURS:\n`;
        businessHours.forEach(h => {
          const day = dayNames[h.day_of_week];
          if (h.is_closed) {
            knowledgeBaseContext += `- ${day}: Closed\n`;
          } else {
            knowledgeBaseContext += `- ${day}: ${h.open_time} - ${h.close_time}\n`;
          }
        });
      }
    }

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

    // Build the system prompt with handoff context
    const basePrompt = AGENT_PROMPTS[agentType] || `You are a helpful AI assistant for a service business.`;
    
    // Add handoff-specific instructions with customer info
    let handoffInstructions = '';
    if (isHandoff && handoffFrom) {
      handoffInstructions = `
IMPORTANT: You are receiving a handoff from the ${handoffFrom} agent.
Reason for handoff: ${incomingHandoffReason || 'Customer needs your specialized assistance'}
`;
      // Include customer info if provided
      if (customerInfo) {
        handoffInstructions += `\nCUSTOMER INFORMATION ALREADY COLLECTED:`;
        if (customerInfo.name) handoffInstructions += `\n- Name: ${customerInfo.name}`;
        if (customerInfo.phone) handoffInstructions += `\n- Phone: ${customerInfo.phone}`;
        if (customerInfo.address) handoffInstructions += `\n- Address: ${customerInfo.address}`;
        if (customerInfo.email) handoffInstructions += `\n- Email: ${customerInfo.email}`;
        if (customerInfo.issue) handoffInstructions += `\n- Issue: ${customerInfo.issue}`;
        
        const hasAllInfo = customerInfo.name && customerInfo.phone && customerInfo.address;
        if (hasAllInfo) {
          handoffInstructions += `\n\nYou ALREADY HAVE all required customer info. DO NOT ask for name, phone, or address again!
Instead: Greet them by name, confirm the issue, and proceed to help them immediately.`;
        } else {
          const missing: string[] = [];
          if (!customerInfo.name) missing.push('name');
          if (!customerInfo.phone) missing.push('phone number');
          if (!customerInfo.address) missing.push('address');
          handoffInstructions += `\n\nYou still need: ${missing.join(', ')}. Only ask for what's missing.`;
        }
      }
      
      handoffInstructions += `

YOUR FIRST MESSAGE MUST:
1. Greet the customer by name if you have it
2. Acknowledge their specific issue
3. Tell them exactly what you're doing to help
4. If you have their address, confirm it and proceed
5. Only ask for missing information`;
    }

    const systemPrompt = `${basePrompt}
${handoffInstructions}

Company Name: ${company?.name || 'Our Company'}
${knowledgeBaseContext}

Current Context: ${JSON.stringify(contextData)}

${settings.greeting_message ? `Custom Greeting: ${settings.greeting_message}` : ''}
${settings.custom_instructions ? `Additional Instructions: ${settings.custom_instructions}` : ''}

CRITICAL RULES:
- NEVER ask for information you already have
- After using a tool (like check_tech_availability), you MUST tell the customer the results and next steps
- Never leave the conversation hanging after a tool call - always follow up with what you found
- Be specific about technician names, distances, and ETAs when you have them
- Be professional but friendly`;

    // Build messages array with conversation history
    const messages: any[] = [
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
    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    let aiResponse = await response.json();
    let choice = aiResponse.choices?.[0];
    
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
          let target = (args as any).target_agent;
          let reason = (args as any).reason;

          // Guardrail: triage should only handoff to dispatch for true emergencies
          if (agentType === 'triage' && target === 'dispatch') {
            const fullText = [
              ...conversationHistory.map((m: any) => m.content || ''),
              message,
            ].join('\n');

            if (!isEmergencyRequest(fullText)) {
              target = 'booking';
              reason = `Non-emergency request (rerouted to booking): ${reason || 'needs scheduling'}`;
            }
          }

          handoffTo = target;
          handoffReason = reason;
          toolCalls.push({
            name: 'handoff_to_agent',
            arguments: { ...(args as any), target_agent: target, reason },
            result: `Handing off to ${target}: ${reason}`,
          });
        } else {
          // Execute the tool
          const result = await executeAgentTool(supabase, companyId, agentType, funcName, args);
          toolCalls.push({
            name: funcName,
            arguments: args,
            result: JSON.stringify(result),
          });
        }
      }
      
      // MULTI-STEP TOOL EXECUTION LOOP
      // Keep executing tools until AI returns a pure text response (no more tool calls)
      const MAX_ITERATIONS = 5;
      let iteration = 0;
      let currentToolCalls = choice.message.tool_calls;
      let currentResponseText = responseText;
      
      while (toolCalls.length > 0 && !handoffTo && iteration < MAX_ITERATIONS) {
        iteration++;
        console.log(`[AI Agent Chat] Tool execution loop iteration ${iteration}`);
        
        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: currentResponseText || null,
          tool_calls: currentToolCalls.map((tc: any) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.function.name, arguments: tc.function.arguments }
          })),
        });
        
        // Add tool results
        const startIdx = toolCalls.length - currentToolCalls.length;
        for (let i = 0; i < currentToolCalls.length; i++) {
          const tc = currentToolCalls[i];
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolCalls[startIdx + i].result,
          });
        }
        
        // Make follow-up call
        console.log(`[AI Agent Chat] Making follow-up AI call (iteration ${iteration})`);
        const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        
        if (!followUpResponse.ok) {
          console.error('[AI Agent Chat] Follow-up call failed:', await followUpResponse.text());
          break;
        }
        
        const followUpData = await followUpResponse.json();
        const followUpChoice = followUpData.choices?.[0];
        
        if (!followUpChoice) break;
        
        // Update response text
        if (followUpChoice.message?.content) {
          responseText = followUpChoice.message.content;
          currentResponseText = responseText;
          console.log(`[AI Agent Chat] Follow-up response (iteration ${iteration}):`, responseText.substring(0, 100));
        }
        
        // Check if there are MORE tool calls to execute
        if (followUpChoice.message?.tool_calls?.length > 0) {
          console.log(`[AI Agent Chat] Follow-up has ${followUpChoice.message.tool_calls.length} more tool calls`);
          currentToolCalls = followUpChoice.message.tool_calls;
          
          // Execute these new tool calls
          for (const toolCall of currentToolCalls) {
            const funcName = toolCall.function?.name;
            const args = JSON.parse(toolCall.function?.arguments || '{}');
            
            if (funcName === 'handoff_to_agent') {
              handoffTo = args.target_agent;
              handoffReason = args.reason;
              toolCalls.push({
                name: 'handoff_to_agent',
                arguments: args,
                result: `Handing off to ${args.target_agent}: ${args.reason}`,
              });
            } else {
              const result = await executeAgentTool(supabase, companyId, agentType, funcName, args);
              toolCalls.push({
                name: funcName,
                arguments: args,
                result: JSON.stringify(result),
              });
            }
          }
          
          // If we got a handoff, break out of loop
          if (handoffTo) break;
        } else {
          // No more tool calls - we're done
          console.log(`[AI Agent Chat] No more tool calls, finishing loop`);
          break;
        }
      }
      
      if (iteration >= MAX_ITERATIONS) {
        console.warn('[AI Agent Chat] Hit max iterations limit');
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

    // Generate next steps for customer based on handoff target
    let nextSteps: any = null;
    if (handoffTo) {
      nextSteps = generateNextSteps(handoffTo, handoffReason);
    }

    return new Response(JSON.stringify({
      response: responseText,
      event_type: eventType,
      handoff_to: handoffTo,
      handoff_reason: handoffReason,
      tool_calls: toolCalls,
      context_id: contextId,
      next_steps: nextSteps,
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

function isEmergencyRequest(text: string) {
  const t = text.toLowerCase();
  return [
    'emergency',
    'urgent',
    'flood',
    'flooding',
    'water everywhere',
    'burst',
    'burst pipe',
    'gas smell',
    'smell gas',
    'sparks',
    'fire',
    'smoke',
    'electrical burning',
    'no heat',
    'no ac',
    'no a/c',
    'leaking everywhere',
  ].some((kw) => t.includes(kw));
}

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

    case 'create_appointment': {
      console.log('[AI Agent] Creating appointment with args:', args);
      
      // Find an available employee based on datetime and service type
      let employeeId: string | null = null;
      
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name, availability_json')
        .eq('company_id', companyId)
        .not('availability_json', 'is', null);

      if (employees && employees.length > 0) {
        // Simple assignment: pick first available employee
        employeeId = employees[0].id;
        console.log(`[AI Agent] Assigning to employee: ${employees[0].full_name}`);
      }

      // Create the appointment with dedicated customer_address column
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          customer_email: args.customer_email,
          customer_address: args.customer_address || null,
          service_type: args.service_type,
          datetime: args.datetime,
          duration_minutes: args.duration_minutes || 60,
          notes: args.notes || null,
          status: 'scheduled',
          employee_id: employeeId,
        })
        .select()
        .single();

      if (error) {
        console.error('[AI Agent] Appointment creation error:', error);
        return { success: false, error: error.message };
      }

      console.log('[AI Agent] Appointment created:', appointment.id);

      // Create job assignment if employee assigned
      let jobAssignment = null;
      if (employeeId) {
        const { data: job, error: jobError } = await supabase
          .from('job_assignments')
          .insert({
            company_id: companyId,
            appointment_id: appointment.id,
            employee_id: employeeId,
            status: 'pending_acceptance',
            customer_address: args.customer_address || null,
          })
          .select()
          .single();

        if (jobError) {
          console.error('[AI Agent] Job assignment creation error:', jobError);
        } else {
          jobAssignment = job;
          console.log('[AI Agent] Job assignment created:', job.id);

          // Send notifications to customer and employee
          try {
            // Notify customer
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-job-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                jobAssignmentId: job.id,
                notificationType: 'assigned',
                recipientType: 'customer',
              }),
            });

            // Notify employee
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-job-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                jobAssignmentId: job.id,
                notificationType: 'assigned',
                recipientType: 'employee',
              }),
            });

            console.log('[AI Agent] Notifications sent for job assignment');
          } catch (notifError) {
            console.error('[AI Agent] Notification error:', notifError);
          }
        }
      }

      // Also send SMS confirmation to customer
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-appointment-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            appointmentId: appointment.id,
            type: 'confirmation',
          }),
        });
      } catch (smsError) {
        console.error('[AI Agent] SMS confirmation error:', smsError);
      }

      return { 
        success: true, 
        appointment_id: appointment.id, 
        employee_id: employeeId,
        job_assignment_id: jobAssignment?.id,
        message: `Appointment created successfully${employeeId ? '. Technician has been assigned and notified.' : ''}` 
      };
    }

    case 'check_tech_availability': {
      console.log('[AI Agent] Checking technician availability');
      
      // Get real employees from database
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, availability_json')
        .eq('company_id', companyId)
        .not('availability_json', 'is', null);

      const technicians = employees?.map((emp: any, idx: number) => ({
        id: emp.id,
        name: emp.full_name || `Technician ${idx + 1}`,
        skills: ['General Service'],
        distance: `${Math.floor(Math.random() * 10) + 2} miles`,
        phone: emp.phone_number,
        eta_minutes: Math.floor(Math.random() * 25) + 10,
      })) || [];

      if (technicians.length === 0) {
        // Return simulated data if no real employees
        return {
          success: true,
          available_technicians: [
            { id: 'tech1', name: 'John Smith', skills: ['HVAC', 'Electrical'], distance: '5 miles', eta_minutes: 20 },
            { id: 'tech2', name: 'Sarah Johnson', skills: ['Plumbing', 'HVAC'], distance: '8 miles', eta_minutes: 25 },
          ],
        };
      }

      return {
        success: true,
        available_technicians: technicians,
      };
    }

    case 'assign_technician': {
      console.log('[AI Agent] Assigning technician with args:', args);
      
      if (!args.appointment_id) {
        return { success: false, error: 'appointment_id is required before assigning a technician' };
      }

      // Validate appointment exists for this company
      const { data: appt } = await supabase
        .from('appointments')
        .select('id, employee_id')
        .eq('company_id', companyId)
        .eq('id', args.appointment_id)
        .maybeSingle();

      if (!appt?.id) {
        return { success: false, error: 'Appointment not found. Create the appointment before assigning a technician.' };
      }

      // Get or use the technician ID
      let techId = args.technician_id;
      let techName = args.technician_name || 'Available Technician';
      
      // If using simulated tech, get a real employee
      if (techId?.startsWith('tech')) {
        const { data: realEmployee } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('company_id', companyId)
          .limit(1)
          .maybeSingle();
        
        if (realEmployee) {
          techId = realEmployee.id;
          techName = realEmployee.full_name || techName;
        } else {
          techId = null; // Will create job without real employee
        }
      }

      // Update appointment with employee
      if (techId) {
        await supabase
          .from('appointments')
          .update({ employee_id: techId })
          .eq('id', args.appointment_id);
      }

      // Check if job assignment already exists
      const { data: existingJob } = await supabase
        .from('job_assignments')
        .select('id')
        .eq('appointment_id', args.appointment_id)
        .maybeSingle();

      let jobId = existingJob?.id;

      if (!existingJob && techId) {
        // Create job assignment
        const { data: newJob, error: jobError } = await supabase
          .from('job_assignments')
          .insert({
            company_id: companyId,
            appointment_id: args.appointment_id,
            employee_id: techId,
            status: 'pending_acceptance',
            customer_address: args.customer_address,
            estimated_arrival_minutes: args.eta_minutes || 20,
          })
          .select()
          .single();

        if (jobError) {
          console.error('[AI Agent] Job assignment creation error:', jobError);
        } else {
          jobId = newJob.id;

          // Send notifications
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-job-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                jobAssignmentId: newJob.id,
                notificationType: 'assigned',
                recipientType: 'customer',
              }),
            });

            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-job-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                jobAssignmentId: newJob.id,
                notificationType: 'assigned',
                recipientType: 'employee',
              }),
            });
          } catch (notifError) {
            console.error('[AI Agent] Notification error:', notifError);
          }
        }
      }

      return {
        success: true,
        assignment_id: jobId || crypto.randomUUID(),
        technician_id: techId,
        technician_name: techName,
        appointment_id: args.appointment_id,
        eta_minutes: args.eta_minutes || 20,
        message: `${techName} has been assigned and notified. ETA: ${args.eta_minutes || 20} minutes.`,
      };
    }

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

    case 'get_photo_upload_link': {
      const jobId = args.job_assignment_id;
      const photoType = args.photo_type || 'both';
      
      // Validate job assignment exists for this company
      const { data: job } = await supabase
        .from('job_assignments')
        .select('id, appointment_id, status')
        .eq('company_id', companyId)
        .eq('id', jobId)
        .maybeSingle();

      if (!job) {
        return {
          success: false,
          error: 'Job assignment not found. Please provide a valid job ID.',
        };
      }

      // Generate the photo upload link - this points to the employee dashboard with the job expanded
      const baseUrl = Deno.env.get('SITE_URL') || 'https://your-app.lovable.app';
      const photoUploadLink = `${baseUrl}/dashboard/appointments?job=${jobId}&upload=${photoType}`;
      
      return {
        success: true,
        photo_upload_link: photoUploadLink,
        job_id: jobId,
        photo_type: photoType,
        job_status: job.status,
        message: `Here's the direct link to upload ${photoType === 'both' ? 'before and after' : photoType} photos for this job: ${photoUploadLink}`,
      };
    }

    case 'send_review_request': {
      console.log('[AI Agent] Sending review request with args:', args);
      
      // Get review URLs from company record
      const { data: company } = await supabase
        .from('companies')
        .select('review_google_url, review_facebook_url, review_yelp_url, name')
        .eq('id', companyId)
        .single();

      // Also check agent settings for review URLs (these may override company defaults)
      const { data: agentConfig } = await supabase
        .from('ai_agent_configs')
        .select('settings')
        .eq('company_id', companyId)
        .eq('agent_type', 'review')
        .maybeSingle();

      const agentSettings = agentConfig?.settings as Record<string, any> || {};
      
      // Use agent settings URLs first, fall back to company URLs
      const reviewUrls = {
        google: agentSettings.google_review_url || company?.review_google_url || null,
        facebook: agentSettings.facebook_review_url || company?.review_facebook_url || null,
        yelp: agentSettings.yelp_review_url || company?.review_yelp_url || null,
      };

      const requestedPlatforms = args.platforms || ['google'];
      const availableLinks: Array<{ platform: string; url: string }> = [];
      
      for (const platform of requestedPlatforms) {
        const url = reviewUrls[platform.toLowerCase() as keyof typeof reviewUrls];
        if (url) {
          availableLinks.push({ platform, url });
        }
      }

      if (availableLinks.length === 0) {
        return {
          success: false,
          error: 'No review platform URLs are configured. Please set up review links in the Review Agent settings.',
          configured_platforms: Object.entries(reviewUrls)
            .filter(([_, url]) => url)
            .map(([platform]) => platform),
        };
      }

      // Format the review links for customer
      const linksMessage = availableLinks
        .map(link => `${link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}: ${link.url}`)
        .join('\n');

      return {
        success: true,
        channel: args.channel || 'chat',
        customer_contact: args.customer_contact,
        review_links: availableLinks,
        message: `Here are the review links for ${company?.name || 'our business'}:\n${linksMessage}`,
        platforms_sent: availableLinks.map(l => l.platform),
      };
    }

    default:
      return {
        success: true,
        message: `Tool ${toolName} executed with args: ${JSON.stringify(args)}`,
      };
  }
}

// Generate customer-facing next steps based on handoff target
function generateNextSteps(handoffTo: string, reason: string | null): any {
  const nextStepsConfig: Record<string, any> = {
    dispatch: {
      type: 'emergency',
      title: 'Emergency Dispatch Initiated',
      message: 'Our team has been notified and will contact you shortly.',
      actions: [
        { label: 'Call Us Now', type: 'call', value: 'company_phone' },
        { label: 'Expect Callback', type: 'info', value: 'within 15 minutes' },
      ],
      priority: 'high',
      estimated_response: '15 minutes',
    },
    booking: {
      type: 'scheduling',
      title: 'Ready to Schedule',
      message: 'Let me help you find a convenient appointment time.',
      actions: [
        { label: 'View Available Times', type: 'action', value: 'show_calendar' },
        { label: 'Request Callback', type: 'callback', value: 'schedule_call' },
      ],
      priority: 'normal',
    },
    quoting: {
      type: 'quote',
      title: 'Quote Request Received',
      message: 'We are preparing a detailed quote for your service.',
      actions: [
        { label: 'Provide More Details', type: 'action', value: 'quote_form' },
        { label: 'Call for Immediate Quote', type: 'call', value: 'company_phone' },
      ],
      priority: 'normal',
      estimated_response: '1 business day',
    },
    followup: {
      type: 'followup',
      title: 'Service Follow-up',
      message: 'We want to ensure you are satisfied with your recent service.',
      actions: [
        { label: 'Rate Your Experience', type: 'action', value: 'feedback_form' },
        { label: 'Report an Issue', type: 'action', value: 'issue_form' },
      ],
      priority: 'low',
    },
    review: {
      type: 'review',
      title: 'Share Your Experience',
      message: 'We would love to hear about your experience with us.',
      actions: [
        { label: 'Leave a Review', type: 'external', value: 'review_link' },
        { label: 'Contact Support', type: 'action', value: 'support' },
      ],
      priority: 'low',
    },
  };

  return nextStepsConfig[handoffTo] || {
    type: 'general',
    title: 'Request Received',
    message: 'A team member will assist you shortly.',
    actions: [
      { label: 'Contact Us', type: 'call', value: 'company_phone' },
    ],
    priority: 'normal',
  };
}
