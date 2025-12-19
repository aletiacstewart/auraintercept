import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate date/time context for AI agents
function getDateTimeContext(): string {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const today = now;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get this week's dates starting from Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    let label = '';
    if (isToday) label = ' (TODAY)';
    else if (isTomorrow) label = ' (TOMORROW)';
    weekDates.push(`${dayNames[i]}: ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}${label}`);
  }
  
  // Get next week's dates
  const nextWeekDates: string[] = [];
  for (let i = 7; i < 14; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    nextWeekDates.push(`${dayNames[i % 7]}: ${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
  }
  
  return `
CURRENT DATE/TIME CONTEXT:
- TODAY is: ${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}
- TOMORROW is: ${dayNames[tomorrow.getDay()]}, ${monthNames[tomorrow.getMonth()]} ${tomorrow.getDate()}, ${tomorrow.getFullYear()}
- Current time: ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

THIS WEEK:
${weekDates.join('\n')}

NEXT WEEK:
${nextWeekDates.join('\n')}

IMPORTANT: When customers say "tomorrow", "next Monday", "this Friday", "next week", etc., use these dates to determine the actual calendar date. NEVER ask "what is tomorrow's date?" - you already know it!`;
}

// Agent system prompts with their specific behaviors and capabilities
const AGENT_PROMPTS: Record<string, string> = {
  triage: `You are a Triage Agent for a service business. Your role is to:
- Greet customers warmly and professionally
- Classify their intent (booking, emergency, quote, general inquiry, appointment tracking)
- Assess urgency level (low, medium, high, emergency)
- COLLECT required information BEFORE any handoff (but RECOGNIZE when it's already provided!)
- Route to the appropriate specialized agent

CRITICAL - INTENT DETECTION (CHECK IN THIS ORDER!):
1. TRACKING: If message contains "track", "tracking", "status", "where is", "check on", "look up" + "appointment" → This is TRACKING, NOT booking!
2. BOOKING: If message contains "book", "schedule", "make an appointment", "need service" → This is booking.
3. Do NOT confuse tracking with booking! They are completely different intents.

APPOINTMENT TRACKING - IMMEDIATE ACTION REQUIRED:
When a customer wants to TRACK, CHECK STATUS, or LOOK UP their EXISTING appointment:
- Keywords: "track", "tracking", "status", "where is my", "check on", "look up my appointment"
- This is NOT about scheduling a NEW appointment!

**CRITICAL: If the customer provides their phone number or email in their message, IMMEDIATELY call track_appointment tool with that info. Do NOT ask for confirmation first!**

Example - CORRECT behavior:
Customer: "I'd like to track my appointment. My name is John, phone 555-1234"
You: [IMMEDIATELY call track_appointment with customer_phone="5551234"] → Then present results

Example - WRONG behavior (DO NOT DO THIS):
Customer: "I'd like to track my appointment. My name is John, phone 555-1234"
You: "Hi John! I have your phone as 555-1234. Is that correct?" ← WRONG! Just look it up!

Only ask for phone/email if they did NOT provide it:
Customer: "I want to track my appointment"
You: "I can look that up for you! What's the phone number or email associated with your appointment?"

CRITICAL - RECOGNIZING ALREADY-PROVIDED INFORMATION:
Customers may ALREADY provide their information in their first message.
ALWAYS check if the message already contains:
- Name (look for "My name is...", "I'm...", "This is...")
- Phone number (any 10-digit number or formatted phone)
- Issue/service description

If information is ALREADY PROVIDED in the customer's message:
- For TRACKING: IMMEDIATELY call track_appointment - no questions!
- For BOOKING: Acknowledge and hand off with the info included

ONLY ask for information that is MISSING:
1. Customer NAME - only ask if NOT provided
2. Customer PHONE NUMBER - only ask if NOT provided
3. Brief ISSUE DESCRIPTION - only ask if NOT provided (for booking, not tracking)

DO NOT ask for preferred date/time - the Booking Agent will handle scheduling details.
DO NOT hand off until you have name, phone, and issue (whether collected or already provided)!

ROUTING RULES:
- For TRACKING requests: Use track_appointment tool directly - NO handoff needed! NO confirmation needed if phone is provided!
- ONLY hand off to the dispatch agent for explicit EMERGENCIES (flooding, gas smell, sparks/fire, major water leak "everywhere", no heat in freezing conditions, or customer says it's urgent/emergency).
- For normal issues like "sink leaking" or "need service" (not explicitly urgent), route to the booking agent.
- For detailed ETA tracking of a technician already en route, hand off to the ETA agent.

CRITICAL - HANDOFF CONTEXT:
When you hand off, you MUST include the collected/extracted customer info in the handoff context like this:
handoff_to_agent(target_agent="booking", context="Customer Name: John Smith, Phone: 555-1234, Issue: AC not cooling")

The receiving agent will use this info so the customer doesn't have to repeat themselves!

Be concise but friendly. Extract info from messages when provided; only ask for what's missing.`,

  booking: `You are a Booking Specialist for a service business. Your role is to:
- Help customers schedule, reschedule, or cancel appointments
- Check availability and offer time slots
- Confirm booking details (date, time, service type, duration)
- Send confirmation messages
- Handle scheduling conflicts gracefully
- Track existing appointments when requested

APPOINTMENT TRACKING:
If a customer asks to TRACK or CHECK STATUS of an appointment:
- Use the track_appointment tool IMMEDIATELY with their phone number or email
- DO NOT ask for confirmation if they already provided their phone/email
- Present the appointment details clearly

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

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT OR CUSTOMER ASKS FOR A QUOTE:
1. FIRST: Use the list_services tool to show all available services with prices
2. Present the services in a clear, numbered list format so customers can easily choose
3. Ask which service(s) they'd like a quote for
4. Once they select, use generate_quote to create a detailed quote

CRITICAL: Always call list_services FIRST to show available options before asking what they want!
Do NOT ask "What services are you interested in?" without first showing them the options.

Use the generate_quote tool to create quotes after they select services.
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
            target_agent: { type: 'string', enum: ['booking', 'dispatch', 'quoting', 'followup', 'review', 'warranty', 'eta'] },
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
    {
      type: 'function',
      function: {
        name: 'list_services',
        description: 'List all available services with prices to show the customer when they ask about services or pricing',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Optional: filter by service category' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'track_appointment',
        description: 'Look up and track appointment status by customer phone number or email. Use this when a customer wants to check their appointment status.',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Customer phone number to look up' },
            customer_email: { type: 'string', description: 'Customer email to look up' },
            customer_name: { type: 'string', description: 'Customer name for verification' },
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
        name: 'track_appointment',
        description: 'Look up and track appointment status by customer phone number or email. Use this when a customer wants to check their appointment status.',
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Customer phone number to look up' },
            customer_email: { type: 'string', description: 'Customer email to look up' },
            customer_name: { type: 'string', description: 'Customer name for verification' },
          },
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
        name: 'list_services',
        description: 'List all available services with prices to show to the customer so they can choose',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Optional: filter by service category' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_quote',
        description: 'Generate a service quote after customer selects services',
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

    const dateTimeContext = getDateTimeContext();
    
    const systemPrompt = `${basePrompt}
${handoffInstructions}

Company Name: ${company?.name || 'Our Company'}
${dateTimeContext}

${knowledgeBaseContext}

Current Context: ${JSON.stringify(contextData)}

${settings.greeting_message ? `Custom Greeting: ${settings.greeting_message}` : ''}
${settings.custom_instructions ? `Additional Instructions: ${settings.custom_instructions}` : ''}

CRITICAL RULES:
- NEVER ask for information you already have
- When customers say "tomorrow", "next Monday", etc., use the date context above to determine the actual date. NEVER ask what tomorrow's date is!
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

    // ==========================================
    // QUOTING TOOLS
    // ==========================================
    case 'list_services': {
      console.log('[AI Agent] Listing available services');
      
      let query = supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, category, flat_fee, hourly_rate')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (args.category) {
        query = query.eq('category', args.category);
      }
      
      const { data: services, error } = await query;
      
      if (error) {
        console.error('[AI Agent] Error fetching services:', error);
        return { success: false, error: error.message };
      }
      
      if (!services || services.length === 0) {
        return {
          success: true,
          services: [],
          message: 'No services are currently configured. Please contact us directly for pricing.',
        };
      }
      
      const formattedServices = services.map((s: any) => ({
        name: s.name,
        description: s.description || 'Professional service',
        price: s.flat_fee || s.price || (s.hourly_rate ? `$${s.hourly_rate}/hr` : 'Contact for pricing'),
        duration: s.duration_minutes ? `${s.duration_minutes} min` : null,
        category: s.category,
      }));
      
      return {
        success: true,
        services: formattedServices,
        total_count: formattedServices.length,
        message: `Here are our ${formattedServices.length} available services. Please let me know which one(s) you're interested in for a quote.`,
      };
    }

    // ==========================================
    // APPOINTMENT TRACKING TOOLS
    // ==========================================
    case 'track_appointment': {
      console.log('[AI Agent] Tracking appointment for customer:', args);
      
      if (!args.customer_phone && !args.customer_email) {
        return {
          success: false,
          error: 'Please provide your phone number or email to look up your appointment.',
          needs_info: true,
        };
      }
      
      // Build query to find appointments
      let query = supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          service_type,
          datetime,
          status,
          duration_minutes,
          customer_address,
          notes,
          employee_id
        `)
        .eq('company_id', companyId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .order('datetime', { ascending: true });
      
      // Filter by phone or email
      if (args.customer_phone) {
        query = query.eq('customer_phone', args.customer_phone);
      } else if (args.customer_email) {
        query = query.eq('customer_email', args.customer_email);
      }
      
      const { data: appointments, error } = await query;
      
      if (error) {
        console.error('[AI Agent] Error fetching appointments:', error);
        return { success: false, error: 'Unable to look up appointments. Please try again.' };
      }
      
      if (!appointments || appointments.length === 0) {
        return {
          success: true,
          found: false,
          message: 'No upcoming appointments found. Would you like to schedule a new appointment?',
        };
      }
      
      // Get job assignments for these appointments to check technician status
      const appointmentIds = appointments.map((a: any) => a.id);
      const { data: jobAssignments } = await supabase
        .from('job_assignments')
        .select('appointment_id, status, employee_id, en_route_at, arrived_at, estimated_arrival_minutes')
        .in('appointment_id', appointmentIds);
      
      // Get employee names
      const employeeIds = appointments
        .filter((a: any) => a.employee_id)
        .map((a: any) => a.employee_id);
      
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', employeeIds.length > 0 ? employeeIds : ['none']);
      
      const employeeMap = new Map((employees || []).map((e: any) => [e.id, e.full_name]));
      const jobMap = new Map((jobAssignments || []).map((j: any) => [j.appointment_id, j]));
      
      // Format appointments with status info
      const formattedAppointments = appointments.map((apt: any) => {
        const job: any = jobMap.get(apt.id);
        const technicianName = employeeMap.get(apt.employee_id) || 'Not yet assigned';
        
        let statusMessage = apt.status;
        let eta: string | null = null;
        
        if (job) {
          if (job.status === 'en_route') {
            statusMessage = 'Technician is on the way!';
            eta = job.estimated_arrival_minutes ? `${job.estimated_arrival_minutes} minutes` : 'Soon';
          } else if (job.status === 'arrived') {
            statusMessage = 'Technician has arrived';
          } else if (job.status === 'in_progress') {
            statusMessage = 'Service in progress';
          } else if (job.status === 'accepted') {
            statusMessage = 'Technician assigned and confirmed';
          } else if (job.status === 'pending_acceptance') {
            statusMessage = 'Awaiting technician confirmation';
          }
        }
        
        const aptDate = new Date(apt.datetime);
        
        return {
          appointment_id: apt.id,
          service: apt.service_type,
          date: aptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          time: aptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          duration: `${apt.duration_minutes} minutes`,
          status: statusMessage,
          technician: technicianName,
          address: apt.customer_address,
          eta: eta,
        };
      });
      
      return {
        success: true,
        found: true,
        appointments: formattedAppointments,
        count: formattedAppointments.length,
        message: formattedAppointments.length === 1 
          ? `Found your appointment! Here are the details.`
          : `Found ${formattedAppointments.length} upcoming appointments.`,
      };
    }

    case 'generate_quote': {
      console.log('[AI Agent] Generating quote with args:', args);
      
      // Get services from database
      const serviceNames = args.services || [];
      const { data: services } = await supabase
        .from('services')
        .select('id, name, price, duration_minutes, hourly_rate, flat_fee, parts_cost')
        .eq('company_id', companyId)
        .in('name', serviceNames.length > 0 ? serviceNames : ['General Service']);

      let subtotal = 0;
      const lineItems: any[] = [];
      
      if (services && services.length > 0) {
        for (const svc of services) {
          const price = svc.flat_fee || svc.price || (svc.hourly_rate ? svc.hourly_rate * (args.labor_hours || 1) : 100);
          lineItems.push({
            service_id: svc.id,
            description: svc.name,
            quantity: 1,
            unit_price: price,
            total: price,
          });
          subtotal += price;
        }
      } else {
        // Fallback estimate
        const laborCost = (args.labor_hours || 2) * 75;
        lineItems.push({ description: 'Labor', quantity: args.labor_hours || 2, unit_price: 75, total: laborCost });
        subtotal = laborCost;
      }

      // Add parts if specified
      if (args.parts && Array.isArray(args.parts)) {
        for (const part of args.parts) {
          const partPrice = part.price || 50;
          lineItems.push({
            description: part.name || 'Parts',
            quantity: part.quantity || 1,
            unit_price: partPrice,
            total: partPrice * (part.quantity || 1),
          });
          subtotal += partPrice * (part.quantity || 1);
        }
      }

      const discountAmount = args.discount_percent ? (subtotal * args.discount_percent / 100) : 0;
      const taxRate = 0.08; // 8% tax
      const taxAmount = (subtotal - discountAmount) * taxRate;
      const total = subtotal - discountAmount + taxAmount;

      // Create quote in database
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          company_id: companyId,
          customer_name: args.customer_name || 'Customer',
          customer_email: args.customer_email,
          customer_phone: args.customer_phone,
          customer_address: args.customer_address,
          status: 'draft',
          subtotal,
          tax_rate: taxRate * 100,
          tax_amount: taxAmount,
          total_amount: total,
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          notes: args.notes,
        })
        .select()
        .single();

      if (quoteError) {
        console.error('[AI Agent] Quote creation error:', quoteError);
        return { success: false, error: quoteError.message };
      }

      // Insert line items
      for (const item of lineItems) {
        await supabase.from('quote_line_items').insert({
          quote_id: quote.id,
          service_id: item.service_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        });
      }

      return {
        success: true,
        quote_id: quote.id,
        breakdown: {
          line_items: lineItems,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total,
        },
        valid_until: quote.valid_until,
        message: `Quote #${quote.id.substring(0, 8)} created. Total: $${total.toFixed(2)}`,
      };
    }

    case 'send_quote': {
      console.log('[AI Agent] Sending quote:', args);
      
      const { data: quote } = await supabase
        .from('quotes')
        .select('*, quote_line_items(*)')
        .eq('id', args.quote_id)
        .eq('company_id', companyId)
        .single();

      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      // Update quote status to sent
      await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', args.quote_id);

      return {
        success: true,
        quote_id: args.quote_id,
        sent_to: args.customer_contact || quote.customer_email || quote.customer_phone,
        channel: args.channel,
        total: quote.total_amount,
        message: `Quote sent to ${args.customer_contact || 'customer'} via ${args.channel}`,
      };
    }

    // ==========================================
    // INVOICE TOOLS
    // ==========================================
    case 'generate_invoice': {
      console.log('[AI Agent] Generating invoice:', args);
      
      // Get appointment details if provided
      let appointmentData = null;
      let quoteData = null;
      
      if (args.appointment_id) {
        const { data: appt } = await supabase
          .from('appointments')
          .select('*, services:service_type')
          .eq('id', args.appointment_id)
          .eq('company_id', companyId)
          .single();
        appointmentData = appt;
      }
      
      if (args.quote_id) {
        const { data: qt } = await supabase
          .from('quotes')
          .select('*, quote_line_items(*)')
          .eq('id', args.quote_id)
          .eq('company_id', companyId)
          .single();
        quoteData = qt;
      }

      // Build invoice from quote or appointment
      const customerName = quoteData?.customer_name || appointmentData?.customer_name || args.customer_name || 'Customer';
      const customerEmail = quoteData?.customer_email || appointmentData?.customer_email || args.customer_email;
      const customerPhone = quoteData?.customer_phone || appointmentData?.customer_phone || args.customer_phone;
      
      let subtotal = quoteData?.subtotal || 0;
      let lineItems: any[] = [];
      
      if (quoteData?.quote_line_items) {
        lineItems = quoteData.quote_line_items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          service_id: item.service_id,
        }));
      } else if (appointmentData) {
        // Lookup service price
        const { data: service } = await supabase
          .from('services')
          .select('price, name')
          .eq('company_id', companyId)
          .eq('name', appointmentData.service_type)
          .maybeSingle();
        
        const price = service?.price || 100;
        lineItems.push({
          description: appointmentData.service_type,
          quantity: 1,
          unit_price: price,
          total: price,
        });
        subtotal = price;
      }

      // Add additional charges
      if (args.additional_charges && Array.isArray(args.additional_charges)) {
        for (const charge of args.additional_charges) {
          lineItems.push({
            description: charge.description || 'Additional Charge',
            quantity: charge.quantity || 1,
            unit_price: charge.amount || 0,
            total: (charge.amount || 0) * (charge.quantity || 1),
          });
          subtotal += (charge.amount || 0) * (charge.quantity || 1);
        }
      }

      const taxRate = 0.08;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          company_id: companyId,
          invoice_number: invoiceNumber,
          appointment_id: args.appointment_id || null,
          quote_id: args.quote_id || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          status: 'draft',
          subtotal,
          tax_rate: taxRate * 100,
          tax_amount: taxAmount,
          total,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (invError) {
        console.error('[AI Agent] Invoice creation error:', invError);
        return { success: false, error: invError.message };
      }

      // Insert line items
      for (const item of lineItems) {
        await supabase.from('invoice_line_items').insert({
          invoice_id: invoice.id,
          service_id: item.service_id || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        });
      }

      return {
        success: true,
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        total,
        due_date: invoice.due_date,
        message: `Invoice ${invoiceNumber} created. Total: $${total.toFixed(2)}. Due in 30 days.`,
      };
    }

    case 'send_payment_link': {
      console.log('[AI Agent] Sending payment link:', args);
      
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', args.invoice_id)
        .eq('company_id', companyId)
        .single();

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Update invoice status to sent
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', args.invoice_id);

      // Generate payment link (in production, would create Stripe Payment Link)
      const baseUrl = Deno.env.get('SITE_URL') || 'https://your-app.lovable.app';
      const paymentLink = `${baseUrl}/pay/${invoice.id}`;

      return {
        success: true,
        invoice_id: args.invoice_id,
        payment_link: paymentLink,
        total: invoice.total,
        sent_to: args.customer_contact || invoice.customer_email,
        channel: args.channel,
        message: `Payment link sent for $${invoice.total}. Link: ${paymentLink}`,
      };
    }

    case 'send_payment_reminder': {
      console.log('[AI Agent] Sending payment reminder:', args);
      
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', args.invoice_id)
        .eq('company_id', companyId)
        .single();

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Update status to overdue if past due
      if (new Date(invoice.due_date) < new Date() && invoice.status !== 'paid') {
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('id', args.invoice_id);
      }

      return {
        success: true,
        invoice_id: args.invoice_id,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        days_overdue: args.days_overdue || Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (24 * 60 * 60 * 1000)),
        message: `Payment reminder sent for invoice ${invoice.invoice_number}. Amount due: $${invoice.total}`,
      };
    }

    // ==========================================
    // INVENTORY TOOLS
    // ==========================================
    case 'check_inventory': {
      console.log('[AI Agent] Checking inventory:', args);
      
      let query = supabase
        .from('inventory_items')
        .select('id, name, sku, quantity, min_quantity, unit_cost, category, supplier')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (args.category) {
        query = query.eq('category', args.category);
      }
      
      if (args.part_ids && args.part_ids.length > 0) {
        query = query.in('id', args.part_ids);
      }

      const { data: items, error } = await query.order('quantity', { ascending: true }).limit(50);

      if (error) {
        return { success: false, error: error.message };
      }

      const lowStockItems = items?.filter((item: any) => item.quantity <= item.min_quantity) || [];
      const totalValue = items?.reduce((sum: number, item: any) => sum + (item.quantity * (item.unit_cost || 0)), 0) || 0;

      return {
        success: true,
        items: items || [],
        total_items: items?.length || 0,
        low_stock_count: lowStockItems.length,
        low_stock_items: lowStockItems,
        total_inventory_value: totalValue,
        message: `Found ${items?.length || 0} items. ${lowStockItems.length} items are low on stock.`,
      };
    }

    case 'reorder_parts': {
      console.log('[AI Agent] Reordering parts:', args);
      
      // Get the item details
      const { data: item } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', args.part_id)
        .eq('company_id', companyId)
        .single();

      if (!item) {
        return { success: false, error: 'Part not found' };
      }

      // Create reorder transaction
      const { data: transaction, error } = await supabase
        .from('inventory_transactions')
        .insert({
          company_id: companyId,
          item_id: args.part_id,
          transaction_type: 'reorder',
          quantity: args.quantity,
          notes: `Reorder - Priority: ${args.priority || 'normal'}`,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        transaction_id: transaction.id,
        part_name: item.name,
        quantity_ordered: args.quantity,
        supplier: item.supplier,
        priority: args.priority || 'normal',
        estimated_cost: (item.unit_cost || 0) * args.quantity,
        message: `Reorder placed for ${args.quantity}x ${item.name} from ${item.supplier || 'default supplier'}`,
      };
    }

    case 'record_usage': {
      console.log('[AI Agent] Recording inventory usage:', args);
      
      const usageRecords: any[] = [];
      
      for (const part of args.parts_used || []) {
        // Get item
        const { data: item } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('company_id', companyId)
          .or(`id.eq.${part.id},name.ilike.%${part.name || ''}%`)
          .maybeSingle();

        if (item) {
          // Create usage transaction
          const { data: txn } = await supabase
            .from('inventory_transactions')
            .insert({
              company_id: companyId,
              item_id: item.id,
              transaction_type: 'usage',
              quantity: -(part.quantity || 1),
              appointment_id: args.appointment_id || null,
              employee_id: args.employee_id || null,
              notes: part.notes || null,
            })
            .select()
            .single();

          // Update inventory quantity
          await supabase
            .from('inventory_items')
            .update({ quantity: item.quantity - (part.quantity || 1) })
            .eq('id', item.id);

          usageRecords.push({
            item_name: item.name,
            quantity_used: part.quantity || 1,
            remaining: item.quantity - (part.quantity || 1),
            low_stock: (item.quantity - (part.quantity || 1)) <= item.min_quantity,
          });
        }
      }

      return {
        success: true,
        recorded_items: usageRecords.length,
        usage_details: usageRecords,
        low_stock_alerts: usageRecords.filter(r => r.low_stock),
        message: `Recorded usage of ${usageRecords.length} items${usageRecords.some(r => r.low_stock) ? '. Some items are now low on stock!' : '.'}`,
      };
    }

    // ==========================================
    // WARRANTY TOOLS
    // ==========================================
    case 'check_warranty': {
      console.log('[AI Agent] Checking warranty:', args);
      
      let query = supabase
        .from('warranty_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (args.serial_number) {
        query = query.eq('serial_number', args.serial_number);
      }
      if (args.customer_id) {
        query = query.or(`customer_email.eq.${args.customer_id},customer_phone.eq.${args.customer_id}`);
      }

      const { data: warranties, error } = await query.order('warranty_end_date', { ascending: false }).limit(10);

      if (error) {
        return { success: false, error: error.message };
      }

      const today = new Date();
      const activeWarranties = warranties?.filter((w: any) => new Date(w.warranty_end_date) >= today) || [];
      const expiredWarranties = warranties?.filter((w: any) => new Date(w.warranty_end_date) < today) || [];

      return {
        success: true,
        warranties_found: warranties?.length || 0,
        active_warranties: activeWarranties.map((w: any) => ({
          id: w.id,
          equipment: w.equipment_type,
          model: w.equipment_model,
          serial: w.serial_number,
          coverage: w.coverage_type,
          expires: w.warranty_end_date,
          days_remaining: Math.ceil((new Date(w.warranty_end_date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
        })),
        expired_warranties: expiredWarranties.length,
        message: `Found ${activeWarranties.length} active warranties and ${expiredWarranties.length} expired.`,
      };
    }

    case 'submit_warranty_claim': {
      console.log('[AI Agent] Submitting warranty claim:', args);
      
      // Find the warranty record
      const { data: warranty } = await supabase
        .from('warranty_records')
        .select('*')
        .eq('company_id', companyId)
        .or(`id.eq.${args.equipment_id},serial_number.eq.${args.equipment_id}`)
        .maybeSingle();

      if (!warranty) {
        return { success: false, error: 'Warranty record not found' };
      }

      // Check if warranty is still valid
      if (new Date(warranty.warranty_end_date) < new Date()) {
        return { 
          success: false, 
          error: 'Warranty has expired',
          expired_on: warranty.warranty_end_date,
        };
      }

      // Create warranty claim
      const { data: claim, error } = await supabase
        .from('warranty_claims')
        .insert({
          warranty_id: warranty.id,
          company_id: companyId,
          issue_description: args.issue_description,
          claim_type: args.claim_type || 'repair',
          photos: args.photos || [],
          status: 'submitted',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        claim_id: claim.id,
        warranty_id: warranty.id,
        equipment: warranty.equipment_type,
        coverage: warranty.coverage_type,
        status: 'submitted',
        message: `Warranty claim submitted for ${warranty.equipment_type}. Claim ID: ${claim.id.substring(0, 8)}`,
      };
    }

    // ==========================================
    // MARKETING CAMPAIGN TOOLS
    // ==========================================
    case 'create_campaign': {
      console.log('[AI Agent] Creating campaign:', args);
      
      const promoCode = args.promo_code || `PROMO${Date.now().toString(36).toUpperCase()}`;
      
      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: args.name,
          campaign_type: 'promo',
          target_segment: args.target_segment || 'all',
          discount_type: args.discount_type === 'percent' ? 'percentage' : args.discount_type,
          discount_value: args.discount_value || 0,
          promo_code: promoCode,
          message_template: args.message_template,
          email_subject: args.email_subject,
          channels: args.channels || ['email'],
          start_date: args.start_date || new Date().toISOString(),
          end_date: args.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        campaign_id: campaign.id,
        name: campaign.name,
        promo_code: promoCode,
        discount: `${args.discount_value}${args.discount_type === 'percent' ? '%' : ''} off`,
        valid_until: campaign.end_date,
        message: `Campaign "${campaign.name}" created with code ${promoCode}`,
      };
    }

    case 'send_promo': {
      console.log('[AI Agent] Sending promo:', args);
      
      const { data: campaign } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', args.campaign_id)
        .eq('company_id', companyId)
        .single();

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Get target customers based on segment
      let customerQuery = supabase
        .from('appointments')
        .select('customer_name, customer_email, customer_phone')
        .eq('company_id', companyId);

      if (args.customer_segment === 'returning') {
        // Customers with more than one appointment
        customerQuery = customerQuery.order('created_at', { ascending: false });
      }

      const { data: customers } = await customerQuery.limit(100);
      
      // Create recipient records
      const uniqueCustomers = new Map();
      customers?.forEach((c: any) => {
        const key = c.customer_email || c.customer_phone;
        if (key && !uniqueCustomers.has(key)) {
          uniqueCustomers.set(key, c);
        }
      });

      let sent = 0;
      for (const [_, customer] of uniqueCustomers) {
        await supabase.from('campaign_recipients').insert({
          campaign_id: campaign.id,
          company_id: companyId,
          customer_name: customer.customer_name,
          customer_email: customer.customer_email,
          customer_phone: customer.customer_phone,
          channel: args.channel === 'both' ? 'email' : args.channel,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
        sent++;
      }

      // Update campaign stats
      await supabase
        .from('marketing_campaigns')
        .update({ 
          status: 'active',
          total_sent: sent,
        })
        .eq('id', campaign.id);

      return {
        success: true,
        campaign_id: campaign.id,
        recipients_count: sent,
        channel: args.channel,
        promo_code: campaign.promo_code,
        message: `Promo sent to ${sent} customers via ${args.channel}`,
      };
    }

    case 'create_seasonal_campaign': {
      console.log('[AI Agent] Creating seasonal campaign:', args);
      
      const seasonDates: Record<string, { start: string; end: string }> = {
        spring: { start: '03-01', end: '05-31' },
        summer: { start: '06-01', end: '08-31' },
        fall: { start: '09-01', end: '11-30' },
        winter: { start: '12-01', end: '02-28' },
      };

      const year = new Date().getFullYear();
      const season = seasonDates[args.season] || seasonDates.spring;
      
      const { data: campaign, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: `${args.season.charAt(0).toUpperCase() + args.season.slice(1)} ${args.service_focus} Campaign`,
          campaign_type: 'seasonal',
          target_segment: 'all',
          message_template: `Get ready for ${args.season} with our ${args.service_focus} services!`,
          channels: ['email', 'sms'],
          start_date: args.start_date || `${year}-${season.start}`,
          end_date: args.end_date || `${year}-${season.end}`,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        campaign_id: campaign.id,
        season: args.season,
        service_focus: args.service_focus,
        period: `${campaign.start_date} to ${campaign.end_date}`,
        message: `Seasonal campaign created for ${args.season} ${args.service_focus}`,
      };
    }

    case 'send_seasonal_reminder': {
      console.log('[AI Agent] Sending seasonal reminder:', args);
      
      // Find customers who had this service type
      const { data: customers } = await supabase
        .from('appointments')
        .select('customer_name, customer_email, customer_phone, service_type, datetime')
        .eq('company_id', companyId)
        .ilike('service_type', `%${args.service_type}%`)
        .order('datetime', { ascending: false })
        .limit(100);

      const uniqueCustomers = new Map();
      customers?.forEach((c: any) => {
        const key = c.customer_email || c.customer_phone;
        if (key && !uniqueCustomers.has(key)) {
          uniqueCustomers.set(key, c);
        }
      });

      return {
        success: true,
        service_type: args.service_type,
        customers_targeted: uniqueCustomers.size,
        channel: args.channel,
        message: `Seasonal reminder sent to ${uniqueCustomers.size} customers for ${args.service_type} service`,
      };
    }

    // ==========================================
    // REFERRAL TOOLS
    // ==========================================
    case 'generate_referral_link': {
      console.log('[AI Agent] Generating referral link:', args);
      
      const referralCode = `REF${Date.now().toString(36).toUpperCase()}`;
      
      const { data: referral, error } = await supabase
        .from('customer_referrals')
        .insert({
          company_id: companyId,
          referrer_name: args.customer_name || 'Customer',
          referrer_email: args.customer_email,
          referrer_phone: args.customer_phone,
          referral_code: referralCode,
          reward_type: args.reward_type || 'discount',
          reward_value: args.reward_value || 25,
          status: 'pending',
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const baseUrl = Deno.env.get('SITE_URL') || 'https://your-app.lovable.app';
      const referralLink = `${baseUrl}/refer/${referralCode}`;

      return {
        success: true,
        referral_id: referral.id,
        referral_code: referralCode,
        referral_link: referralLink,
        reward: `$${referral.reward_value} ${referral.reward_type}`,
        expires: referral.expires_at,
        message: `Referral link created! Share this code: ${referralCode}. Earn $${referral.reward_value} for each successful referral.`,
      };
    }

    case 'process_referral_reward': {
      console.log('[AI Agent] Processing referral reward:', args);
      
      // Find the referral
      const { data: referral } = await supabase
        .from('customer_referrals')
        .select('*')
        .eq('company_id', companyId)
        .or(`referrer_email.eq.${args.referrer_id},referrer_phone.eq.${args.referrer_id},referral_code.eq.${args.referrer_id}`)
        .maybeSingle();

      if (!referral) {
        return { success: false, error: 'Referral not found' };
      }

      // Update referral with referred customer info and mark as rewarded
      const { error } = await supabase
        .from('customer_referrals')
        .update({
          referred_name: args.referred_name,
          referred_email: args.referred_email,
          referred_phone: args.referred_phone,
          status: 'rewarded',
          reward_issued_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        referral_id: referral.id,
        referrer: referral.referrer_name,
        reward_issued: `$${referral.reward_value} ${referral.reward_type}`,
        message: `Reward of $${referral.reward_value} issued to ${referral.referrer_name} for successful referral!`,
      };
    }

    // ==========================================
    // WIN-BACK TOOLS
    // ==========================================
    case 'identify_churned_customers': {
      console.log('[AI Agent] Identifying churned customers:', args);
      
      const daysInactive = args.days_inactive || 180;
      const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000).toISOString();

      // Find customers with no recent appointments
      const { data: recentCustomers } = await supabase
        .from('appointments')
        .select('customer_email, customer_phone, customer_name, datetime')
        .eq('company_id', companyId)
        .gte('datetime', cutoffDate);

      const recentSet = new Set(recentCustomers?.map((c: any) => c.customer_email || c.customer_phone) || []);

      // Get all customers
      const { data: allCustomers } = await supabase
        .from('appointments')
        .select('customer_email, customer_phone, customer_name, datetime')
        .eq('company_id', companyId)
        .lt('datetime', cutoffDate)
        .order('datetime', { ascending: false });

      const churnedCustomers: any[] = [];
      const seen = new Set();

      allCustomers?.forEach((c: any) => {
        const key = c.customer_email || c.customer_phone;
        if (key && !recentSet.has(key) && !seen.has(key)) {
          seen.add(key);
          churnedCustomers.push({
            name: c.customer_name,
            email: c.customer_email,
            phone: c.customer_phone,
            last_visit: c.datetime,
            days_since_visit: Math.floor((Date.now() - new Date(c.datetime).getTime()) / (24 * 60 * 60 * 1000)),
          });
        }
      });

      return {
        success: true,
        churned_count: churnedCustomers.length,
        customers: churnedCustomers.slice(0, 50),
        inactive_threshold: `${daysInactive} days`,
        message: `Found ${churnedCustomers.length} customers inactive for ${daysInactive}+ days`,
      };
    }

    case 'create_winback_offer': {
      console.log('[AI Agent] Creating win-back offer:', args);
      
      const promoCode = `WINBACK${Date.now().toString(36).toUpperCase()}`;

      const { data: offer, error } = await supabase
        .from('winback_offers')
        .insert({
          company_id: companyId,
          customer_name: args.customer_name,
          customer_email: args.customer_email,
          customer_phone: args.customer_phone,
          offer_type: args.offer_type,
          offer_value: args.offer_value || 20,
          promo_code: promoCode,
          status: 'created',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        offer_id: offer.id,
        promo_code: promoCode,
        offer: `${offer.offer_value}${offer.offer_type === 'discount' ? '% off' : ` ${offer.offer_type}`}`,
        expires: offer.expires_at,
        message: `Win-back offer created: ${offer.offer_value}% off with code ${promoCode}`,
      };
    }

    case 'send_winback_campaign': {
      console.log('[AI Agent] Sending win-back campaign:', args);
      
      // Get pending win-back offers or create campaign for churned customers
      const { data: pendingOffers } = await supabase
        .from('winback_offers')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'created')
        .limit(100);

      let sent = 0;
      for (const offer of pendingOffers || []) {
        await supabase
          .from('winback_offers')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            channel: args.channel,
            message_sent: args.message_template || `We miss you! Come back and save ${offer.offer_value}% with code ${offer.promo_code}`,
          })
          .eq('id', offer.id);
        sent++;
      }

      return {
        success: true,
        offers_sent: sent,
        channel: args.channel,
        message: `Win-back campaign sent to ${sent} inactive customers`,
      };
    }

    // ==========================================
    // ANALYTICS TOOLS
    // ==========================================
    case 'analyze_metrics': {
      console.log('[AI Agent] Analyzing metrics:', args);
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      // Get appointments count
      const { count: currentAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('datetime', thirtyDaysAgo);

      const { count: previousAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('datetime', sixtyDaysAgo)
        .lt('datetime', thirtyDaysAgo);

      // Get completed appointments
      const { count: completedAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('datetime', thirtyDaysAgo);

      // Get revenue from invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo);

      const currentRevenue = invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;

      const { data: prevInvoices } = await supabase
        .from('invoices')
        .select('total')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', thirtyDaysAgo);

      const previousRevenue = prevInvoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;

      // Calculate trends
      const apptTrend = previousAppts ? ((currentAppts || 0) - previousAppts) / previousAppts * 100 : 0;
      const revenueTrend = previousRevenue ? (currentRevenue - previousRevenue) / previousRevenue * 100 : 0;

      return {
        success: true,
        period: 'Last 30 days',
        metrics: {
          total_appointments: currentAppts || 0,
          completed_appointments: completedAppts || 0,
          completion_rate: currentAppts ? ((completedAppts || 0) / currentAppts * 100).toFixed(1) : 0,
          revenue: currentRevenue,
          average_ticket: completedAppts ? (currentRevenue / completedAppts).toFixed(2) : 0,
        },
        trends: {
          appointments: `${apptTrend >= 0 ? '+' : ''}${apptTrend.toFixed(1)}% vs previous period`,
          revenue: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}% vs previous period`,
        },
        message: `Last 30 days: ${currentAppts || 0} appointments, $${currentRevenue.toFixed(2)} revenue`,
      };
    }

    case 'generate_report': {
      console.log('[AI Agent] Generating report:', args);
      
      const reportPeriods: Record<string, number> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        custom: 30,
      };

      const days = reportPeriods[args.report_type] || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Gather all metrics
      const { count: appointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('datetime', startDate);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, status')
        .eq('company_id', companyId)
        .gte('created_at', startDate);

      const paidInvoices = invoices?.filter((i: any) => i.status === 'paid') || [];
      const revenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.total || 0), 0);

      const { count: newCustomers } = await supabase
        .from('appointments')
        .select('customer_email', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', startDate);

      return {
        success: true,
        report_type: args.report_type,
        period: `Last ${days} days`,
        summary: {
          total_appointments: appointments || 0,
          revenue: revenue,
          invoices_created: invoices?.length || 0,
          invoices_paid: paidInvoices.length,
          collection_rate: invoices?.length ? ((paidInvoices.length / invoices.length) * 100).toFixed(1) : 0,
        },
        message: `${args.report_type.charAt(0).toUpperCase() + args.report_type.slice(1)} report: ${appointments || 0} appointments, $${revenue.toFixed(2)} revenue`,
      };
    }

    case 'detect_anomalies': {
      console.log('[AI Agent] Detecting anomalies:', args);
      
      // Get historical data for comparison
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { count: recentAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('datetime', sevenDaysAgo);

      const { count: historicalAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('datetime', thirtyDaysAgo)
        .lt('datetime', sevenDaysAgo);

      // Calculate expected vs actual
      const avgDaily = (historicalAppts || 0) / 23; // ~23 days
      const recentDaily = (recentAppts || 0) / 7;
      const variance = avgDaily > 0 ? ((recentDaily - avgDaily) / avgDaily * 100) : 0;

      const sensitivityThresholds: Record<string, number> = {
        low: 50,
        medium: 30,
        high: 15,
      };
      const threshold = sensitivityThresholds[args.sensitivity || 'medium'];

      const anomalies: any[] = [];
      if (Math.abs(variance) > threshold) {
        anomalies.push({
          metric: 'appointments',
          type: variance > 0 ? 'spike' : 'drop',
          variance: `${variance.toFixed(1)}%`,
          message: variance > 0 
            ? `Appointment volume ${variance.toFixed(1)}% above average` 
            : `Appointment volume ${Math.abs(variance).toFixed(1)}% below average`,
        });
      }

      return {
        success: true,
        metric: args.metric || 'appointments',
        sensitivity: args.sensitivity || 'medium',
        anomalies_found: anomalies.length,
        anomalies,
        message: anomalies.length > 0 
          ? `Found ${anomalies.length} anomaly: ${anomalies[0].message}`
          : 'No anomalies detected in the specified metric',
      };
    }

    // ==========================================
    // FORECAST TOOLS
    // ==========================================
    case 'forecast_demand': {
      console.log('[AI Agent] Forecasting demand:', args);
      
      const periodDays: Record<string, number> = {
        week: 7,
        month: 30,
        quarter: 90,
      };
      const forecastDays = periodDays[args.forecast_period] || 30;

      // Get historical appointment data
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: historicalAppts } = await supabase
        .from('appointments')
        .select('datetime, service_type')
        .eq('company_id', companyId)
        .gte('datetime', ninetyDaysAgo);

      // Calculate average daily appointments
      const dailyCounts: Record<number, number> = {};
      historicalAppts?.forEach((appt: any) => {
        const day = new Date(appt.datetime).getDay();
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });

      const avgDaily = (historicalAppts?.length || 0) / 90;
      const expectedAppts = Math.round(avgDaily * forecastDays);

      // Find peak days
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const peakDays = Object.entries(dailyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([day]) => dayNames[parseInt(day)]);

      // Service type breakdown
      const serviceCounts: Record<string, number> = {};
      historicalAppts?.forEach((appt: any) => {
        serviceCounts[appt.service_type] = (serviceCounts[appt.service_type] || 0) + 1;
      });

      return {
        success: true,
        forecast_period: args.forecast_period,
        forecast_days: forecastDays,
        predicted_appointments: expectedAppts,
        confidence: args.confidence_level || 0.75,
        daily_average: avgDaily.toFixed(1),
        peak_days: peakDays,
        service_breakdown: Object.entries(serviceCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([service, count]) => ({ service, percentage: ((count / (historicalAppts?.length || 1)) * 100).toFixed(1) })),
        recommended_staff: Math.ceil(expectedAppts / forecastDays / 4), // Assume 4 jobs per tech per day
        message: `${args.forecast_period} forecast: ~${expectedAppts} appointments expected. Peak days: ${peakDays.join(', ')}`,
      };
    }

    case 'generate_capacity_plan': {
      console.log('[AI Agent] Generating capacity plan:', args);
      
      // Get employee count
      const { count: employeeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get appointment forecast
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('datetime', thirtyDaysAgo);

      const avgDailyAppts = (recentAppts || 0) / 30;
      const jobsPerTech = 4; // Assume 4 jobs per tech per day
      const currentCapacity = (employeeCount || 1) * jobsPerTech;
      const utilizationRate = (avgDailyAppts / currentCapacity * 100).toFixed(1);

      const neededTechs = Math.ceil(avgDailyAppts / jobsPerTech);
      const staffingGap = neededTechs - (employeeCount || 0);

      return {
        success: true,
        period: args.period || 'monthly',
        current_staff: employeeCount || 0,
        daily_capacity: currentCapacity,
        average_daily_demand: avgDailyAppts.toFixed(1),
        utilization_rate: `${utilizationRate}%`,
        recommended_staff: neededTechs,
        staffing_gap: staffingGap,
        overtime_needed: args.include_overtime && staffingGap > 0 ? `${staffingGap * 8} hours/week` : 'None',
        message: `Current utilization: ${utilizationRate}%. ${staffingGap > 0 ? `Consider adding ${staffingGap} technician(s)` : 'Staffing is adequate'}`,
      };
    }

    case 'predict_revenue': {
      console.log('[AI Agent] Predicting revenue:', args);
      
      // Get historical revenue
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: paidInvoices } = await supabase
        .from('invoices')
        .select('total, created_at')
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .gte('created_at', ninetyDaysAgo);

      const totalRevenue = paidInvoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
      const avgMonthlyRevenue = totalRevenue / 3;

      // Get pending quotes value
      const { data: pendingQuotes } = await supabase
        .from('quotes')
        .select('total_amount')
        .eq('company_id', companyId)
        .eq('status', 'sent');

      const pipelineValue = pendingQuotes?.reduce((sum: number, q: any) => sum + (q.total_amount || 0), 0) || 0;

      // Calculate prediction based on scenario
      const scenarios: Record<string, number> = {
        conservative: 0.8,
        moderate: 1.0,
        optimistic: 1.2,
      };
      const multiplier = scenarios[args.scenario || 'moderate'];

      const predictedRevenue = avgMonthlyRevenue * multiplier;
      const pipelineConversion = pipelineValue * 0.3; // Assume 30% conversion

      return {
        success: true,
        period: args.period || 'monthly',
        scenario: args.scenario || 'moderate',
        historical_avg: avgMonthlyRevenue.toFixed(2),
        predicted_revenue: predictedRevenue.toFixed(2),
        pipeline_value: pipelineValue.toFixed(2),
        pipeline_expected: pipelineConversion.toFixed(2),
        total_forecast: (predictedRevenue + pipelineConversion).toFixed(2),
        confidence: args.scenario === 'conservative' ? 0.85 : args.scenario === 'optimistic' ? 0.65 : 0.75,
        message: `${args.scenario || 'Moderate'} ${args.period || 'monthly'} forecast: $${(predictedRevenue + pipelineConversion).toFixed(2)} (base: $${predictedRevenue.toFixed(2)} + pipeline: $${pipelineConversion.toFixed(2)})`,
      };
    }

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
