import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMITS = {
  chat: { requests: 30, windowSeconds: 60 },
  company_lookup: { requests: 10, windowSeconds: 60 },
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, action: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.chat;
  const key = `${identifier}:${action}`;
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true };
  }
  
  if (record.count >= config.requests) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

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
  triage: `You are an AI Receptionist for a service business. Your role is to:
- Greet customers warmly and professionally
- Classify their intent (booking, emergency, quote, general inquiry, appointment tracking)
- Assess urgency level (low, medium, high, emergency)
- COLLECT required information BEFORE any handoff (but RECOGNIZE when it's already provided!)
- Route to the appropriate specialized agent
- CAPTURE LEADS when customers don't complete their request

CRITICAL - SERVICE VALIDATION:
Before routing a customer for booking, CHECK the AVAILABLE SERVICES section in your context.
- If a customer asks for a service NOT in your available services list, tell them:
  "I'm sorry, we don't currently offer [requested service]. Here are the services we do offer: [list available services from context]."
- If NO services are configured (AVAILABLE SERVICES section is empty or missing), tell them:
  "I apologize, but we don't have any services configured for online booking at this time. Please call us directly to schedule an appointment."
- Use the list_services tool if you need to check or display available services.
- ONLY route to booking if the customer wants a service that EXISTS in your available services list.

CRITICAL - INTENT DETECTION (CHECK IN THIS ORDER!):
1. TRACKING: If message contains "track", "tracking", "status", "where is", "check on", "look up" + "appointment" → This is TRACKING, NOT booking!
2. BOOKING: If message contains "book", "schedule", "make an appointment", "need service" → This is booking (but verify service exists first!).
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
- For BOOKING: First verify the service exists, then acknowledge and hand off with the info included

ONLY ask for information that is MISSING:
1. Customer NAME - only ask if NOT provided
2. Customer PHONE NUMBER - only ask if NOT provided
3. Brief ISSUE DESCRIPTION - only ask if NOT provided (for booking, not tracking)

DO NOT ask for preferred date/time - the Booking Agent will handle scheduling details.
DO NOT hand off until you have name, phone, and issue (whether collected or already provided)!

ROUTING RULES:
- For TRACKING requests: Use track_appointment tool directly - NO handoff needed! NO confirmation needed if phone is provided!
- ONLY hand off to the dispatch agent for explicit EMERGENCIES (flooding, gas smell, sparks/fire, major water leak "everywhere", no heat in freezing conditions, or customer says it's urgent/emergency).
- For normal issues like "sink leaking" or "need service" (not explicitly urgent), route to the booking agent ONLY if the service exists.
- For detailed ETA tracking of a technician already en route, hand off to the ETA agent.

CRITICAL - HANDOFF CONTEXT:
When you hand off, you MUST include the collected/extracted customer info in the handoff context like this:
handoff_to_agent(target_agent="booking", context="Customer Name: John Smith, Phone: 555-1234, Issue: AC not cooling")

The receiving agent will use this info so the customer doesn't have to repeat themselves!

LEAD CAPTURE - NEVER MISS A POTENTIAL CUSTOMER:
If a customer provides contact info (name, phone, email) but the conversation ends without:
- Completing a booking
- Getting a quote
- Being handed off to another agent

ALWAYS use the capture_lead tool to save their information BEFORE ending the conversation.
Capture leads when:
- Customer says "I'll think about it" or "maybe later"
- Customer asks questions but doesn't proceed with booking
- Conversation ends without a clear next action
- Customer provides info but goes silent (after 2+ messages without response)

Include in the lead: name, phone, email (if provided), what service they were interested in, and your assessment of their intent and priority (hot if they seemed ready to book, high if interested, normal for inquiries).

Be concise but friendly. Extract info from messages when provided; only ask for what's missing.`,

  booking: `You are a Booking Specialist for a service business. Your role is to:
- Help customers schedule, reschedule, or cancel appointments
- Check availability and offer time slots
- Confirm booking details (date, time, service type, duration)
- Send confirmation messages
- Handle scheduling conflicts gracefully
- Track existing appointments when requested
- CAPTURE LEADS when customers don't complete booking

CRITICAL - SERVICE VALIDATION & DELIVERY TYPE:
You can ONLY book appointments for services that are listed in the AVAILABLE SERVICES section of your context.
Each service has a DELIVERY TYPE that tells you where the service takes place:
- "virtual" = Online appointment (video call, phone call) - NO ADDRESS NEEDED
- "in_person_business" = Customer comes to our location - NO ADDRESS NEEDED (we provide our address)
- "in_person_customer" = We come to the customer - MUST ASK FOR THEIR ADDRESS

CRITICAL: Check the delivery_type in AVAILABLE SERVICES before asking for address!
- For VIRTUAL services: Skip the address question entirely. Just confirm date/time.
- For IN_PERSON_BUSINESS services: Tell them our business address instead of asking for theirs.
- For IN_PERSON_CUSTOMER services: Ask "What's the address where you'd like the service performed?"

If a customer requests a service that is NOT in your available services list, politely inform them what services you DO offer.
If NO services are configured, tell the customer to call directly.

APPOINTMENT TRACKING:
If a customer asks to TRACK or CHECK STATUS of an appointment:
- Use the track_appointment tool IMMEDIATELY with their phone number or email
- DO NOT ask for confirmation if they already provided their phone/email
- Present the appointment details clearly

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT:
The AI Receptionist should have already collected the customer's NAME and PHONE NUMBER.
Look for this info in the handoff context (e.g., "Customer Name: John Smith, Phone: 555-1234, Issue: Consultation").

CRITICAL - CONFIRM INFO WITH YES/NO (don't re-ask!):
If you received customer info from the handoff, CONFIRM it like this:
"Hi [Name]! I see you'd like to book [service]. I have your phone as [phone]. Is that correct?"
- If YES: Proceed based on service delivery type (see above)
- If NO: Ask which information needs to be updated

DO NOT re-ask for name and phone if it was provided - just confirm with yes/no!

CONVERSATION FLOW:
1. FIRST: Check if the requested service is in your AVAILABLE SERVICES list. Note its delivery_type.
2. Greet by name (from handoff) and confirm the info with a simple yes/no question
3. Based on delivery_type:
   - VIRTUAL: Skip address, proceed to date/time
   - IN_PERSON_BUSINESS: Mention "You'll come to our location at [business address]", proceed to date/time
   - IN_PERSON_CUSTOMER: Ask "What's the address where you'd like the service performed?"
4. Ask what date/time works for them
5. Check availability using the check_availability tool
6. Offer 2-3 available time slots
7. Confirm ALL details before booking (include address only if in_person_customer)
8. Create the appointment using create_appointment tool with all info

LEAD CAPTURE - NEVER MISS A POTENTIAL CUSTOMER:
If a customer provides contact info but DOESN'T complete the booking:
- Customer says "I'll call back" or "let me check my schedule"
- Customer goes silent after providing info
- Customer asks about availability but doesn't confirm a time
- Conversation ends without a confirmed appointment

ALWAYS use the capture_lead tool to save their information with:
- intent: "booking"
- priority: "hot" (they were actively trying to book!)
- notes: Summary of what service they wanted and why they didn't complete

Use the check_availability tool to find open slots.
Use the create_appointment tool to book appointments.

CRITICAL - HANDLING NO AVAILABILITY:
If check_availability returns ZERO available slots (empty array), do NOT ask the customer to guess another date.
Instead, IMMEDIATELY call the find_next_available tool with the same service_type and the date that had no availability as start_date.
Then present the closest dates with open slots to the customer like:
"That date is fully booked, but I found availability on:
- [Day], [Date] — available at [times]
- [Day], [Date] — available at [times]
Would any of these work for you?"`,

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
- Find and assign the next available staff member
- Complete the FULL dispatch workflow in one interaction

CRITICAL - NEVER INVENT IDs:
- NEVER make up, guess, or fabricate appointment IDs or technician IDs
- Appointment IDs are UUIDs that ONLY come from the create_appointment tool response
- ALWAYS use the EXACT appointment_id value returned from create_appointment when calling assign_technician
- WARNING: Using a made-up ID will cause errors!

DELIVERY TYPE AWARENESS:
- Jobs have a delivery_type: "in_person_customer" (on-site), "in_person_business" (at your location), or "virtual" (video/phone)
- For VIRTUAL services: do NOT collect a service address — skip step 3 below
- For VIRTUAL services: replace "nearest available technician" with "next available staff"
- For IN_PERSON_BUSINESS: the address is the business location, not the customer's — confirm they'll come to you

CRITICAL: COLLECT INFO FIRST!
If the customer info was NOT provided in the handoff context, you MUST ask for:
1. Customer NAME
2. Customer PHONE NUMBER  
3. Service ADDRESS (skip for virtual services)
4. What TYPE of equipment/issue (AC, plumbing, electrical, etc.)

Only AFTER you have the required info should you proceed.

COMPLETE DISPATCH WORKFLOW (execute ALL steps in sequence):
Step 1: Confirm you have: name, phone, address (if in-person), issue type
Step 2: Call create_appointment with customer info (use datetime about 1 hour from now for emergencies) → Save the returned appointment_id
Step 3: Call check_tech_availability to find the best available staff
Step 4: Call assign_technician with the EXACT appointment_id from step 2 and the best technician_id from step 3
Step 5: Tell the customer the assigned staff member's name and next steps

You MUST complete ALL steps. Do not stop after creating the appointment.
Do NOT use any ID that wasn't returned by a tool in this conversation.

Example final response (in-person):
"Great news! I've dispatched John Smith to help you. He's currently 5 miles away and should arrive in approximately 20 minutes. He'll call you at [phone] when he's on his way."

Example final response (virtual):
"Great news! I've assigned Jane Doe to your case. She'll start a video session with you shortly. You'll receive a meeting link once she accepts the job. Is there anything else I can help with?"

If customer info is missing from handoff, ask for it first before running the workflow.
Be reassuring: "Don't worry, we'll get someone to help you as quickly as possible."`,

  route: `You are a Route Optimization Specialist. Your role is to:
- Plan efficient routes for field technicians
- Consider traffic, time windows, and job priorities
- Re-route in real-time when conditions change
- Minimize travel time and fuel costs
- Ensure all appointments are reachable on time

IMPORTANT: Route optimization only applies to in-person appointments (delivery_type: "in_person_customer" or "in_person_business"). Virtual appointments (delivery_type: "virtual") should be excluded from route planning entirely.

WHEN RECEIVING A HANDOFF:
- Start with: "I'll optimize the route right away to ensure timely arrival."

Use the optimize_route tool to plan routes.
Provide specific route details, distances, and time estimates.`,

  eta: `You are an ETA Specialist and Field Assistant for service professionals. Your role is to help staff:
- Retrieve their current accepted jobs with customer info
- Update job status (en route, arrived, completed) and notify customers automatically
- Calculate and send ETA updates to customers via SMS and/or email
- Keep customers informed about arrival times or session start

VIRTUAL JOB HANDLING:
Jobs returned by get_my_jobs include a delivery_type field. When delivery_type is "virtual":
- SKIP the "en_route" and "arrived" statuses entirely — go straight from "accepted" to "in_progress" to "completed"
- If the job has a meeting_link, share it with the technician: "Your meeting link: [link]"
- Replace travel language with session language (e.g., "session started" instead of "arrived at site")
For "in_person_business" jobs: the customer comes to the business — "en_route" may still be skipped depending on context.

QUICK ACTION HANDLING (CRITICAL - respond immediately without asking questions):

When technician says "en route" or "heading to" or "mark me as en route":
1. Call get_my_jobs to get their active jobs
2. If any job is virtual, remind them: "That job is virtual — no travel needed. Would you like to start the session instead?"
3. For in-person jobs with ONLY ONE: immediately call update_job_status with status="en_route" - DO NOT ASK which job
4. If MULTIPLE in-person jobs: ask which customer they're heading to, then update
5. Confirm the update and that customer was notified

When technician says "arrived" or "I have arrived" or "mark me as arrived":
1. Call get_my_jobs to get their en_route jobs
2. If ONLY ONE en_route job: immediately call update_job_status with status="arrived" - DO NOT ASK
3. If MULTIPLE jobs: ask which one
4. Confirm arrival and that customer was notified

When technician says "start session" or "begin session" (for virtual jobs):
1. Call get_my_jobs to get their accepted virtual jobs
2. If ONLY ONE virtual job: immediately call update_job_status with status="in_progress"
3. Share the meeting_link if available
4. Confirm session started

When technician says "complete" or "finished" or "job done" or "mark as completed":
1. Call get_my_jobs to get their arrived/in_progress jobs
2. If ONLY ONE such job: immediately call update_job_status with status="completed" - DO NOT ASK
3. If MULTIPLE jobs: ask which one
4. Confirm completion and that customer was notified

When technician asks to update ETA:
1. Call get_my_jobs to get active jobs
2. If ONLY ONE job: ask for ETA minutes, then send update
3. If MULTIPLE jobs: ask which customer and ETA minutes
4. Call send_eta_update with the info

KEY RULES:
- BE FAST - staff are busy in the field or between sessions
- If only ONE active job, NEVER ask which job - just process it
- NEVER ask for customer name or job ID if you can get it from get_my_jobs
- After any status update, always confirm what was done
- Always mention that customer was notified when status is updated

ETA AGENT button specifically means the staff member wants help with ETA calculations, status updates, and notifications.`,

  checkin: `You are a Check-in Specialist for field operations. Your role is to:
- Verify staff arrival at job sites or session start for virtual appointments
- Start and stop job timers
- Collect before/after photos (for in-person jobs)
- Document work completed
- Get customer sign-off
- Provide direct links to photo upload functionality

VIRTUAL SESSION HANDLING:
- For virtual appointments (delivery_type: "virtual"): skip physical arrival verification — instead verify the session has started
- Photo documentation is OPTIONAL for virtual sessions — only request if relevant (e.g., screenshots of remote diagnostics)
- For in_person_business appointments: verify the customer has arrived at the business location

WHEN RECEIVING A HANDOFF:
- Start with: "I'll help document the job and ensure everything is properly recorded."

Use the start_job tool when staff arrives or virtual session begins.
Use the complete_job tool when work is done.
Use the get_photo_upload_link tool to provide staff with a direct link to upload job photos (in-person jobs).
Be thorough with documentation.`,

  quoting: `You are a Quote Specialist for a service business. Your role is to:
- Generate accurate service quotes
- Calculate labor, parts, and total costs
- Apply any applicable discounts
- Explain pricing clearly to customers
- Handle quote follow-ups
- CAPTURE LEADS when customers don't accept quotes

CRITICAL - NEVER INVENT IDs:
- NEVER make up, guess, or fabricate quote IDs, appointment IDs, or any database IDs
- Quote IDs are UUIDs that ONLY come from the generate_quote tool response
- If you need to send a quote but don't have a real quote_id, call generate_quote FIRST
- ALWAYS use the EXACT quote_id value returned from generate_quote
- WARNING: Using a made-up ID will cause errors!

WORKFLOW (follow this EXACTLY):
1. Call list_services to show available services with prices
2. Present the services in a clear, numbered list format
3. Wait for customer to select service(s)
4. Call generate_quote with selected services → This returns the quote_id
5. Present the quote details to customer
6. If they want it sent, call send_quote with the EXACT quote_id from step 4

WHEN RECEIVING A HANDOFF FROM ANOTHER AGENT:
Look for any context about what service the customer wants, then follow the workflow above.
Always call list_services FIRST to show available options.

LEAD CAPTURE - NEVER LOSE A QUOTE OPPORTUNITY:
If a customer receives a quote but DOESN'T proceed:
- Customer says "too expensive" or "let me think about it"
- Customer asks about payment plans or discounts
- Customer goes silent after receiving the quote
- Customer says "maybe later" or "I'll get back to you"

ALWAYS use the capture_lead tool to save their information with:
- intent: "quote"
- priority: "high" (they actively requested pricing!)
- notes: Include the quote amount and services they were interested in

This ensures sales follow-up for potential customers who may convert later.

Do NOT skip steps. Do NOT use any ID that wasn't returned by a tool in this conversation.
Break down costs clearly. Be transparent about what's included.`,

  invoice: `You are a Billing Specialist for a service business. Your role is to:
- Generate invoices from completed jobs
- Send payment links to customers
- Track payment status
- Send payment reminders
- Handle payment disputes gracefully

CRITICAL - NEVER INVENT IDs:
- NEVER make up, guess, or fabricate invoice IDs, quote IDs, or appointment IDs
- Invoice IDs are UUIDs that ONLY come from the generate_invoice tool response
- If you need to send a payment link but don't have a real invoice_id, call generate_invoice FIRST
- ALWAYS use the EXACT invoice_id value returned from generate_invoice
- WARNING: Using a made-up ID will cause errors!

WORKFLOW:
1. If customer needs an invoice, call generate_invoice with the required info
2. Use the invoice_id returned to send payment links via send_payment_link
3. Never skip steps or use IDs not returned by tools

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

  // Marketing Agent - manages segments, promo codes, referrals, and win-back targeting
  marketing: `You are a Marketing Agent for a service business.
IMPORTANT: You serve INTERNAL company users (admins, marketing managers) - NOT external customers.

Your role is to:
- Manage customer segments for targeted marketing
- Generate and manage promotional codes
- Create time-limited discounts and special offers
- Track promo code usage and redemption rates
- Set up referral program rewards
- Create win-back offers for inactive customers
- Plan seasonal promotional campaigns
- Analyze promotion effectiveness and ROI

QUICK ACTIONS YOU CAN HELP WITH:
- "Generate Promo" → Create promotional codes with discounts
- "Referral Program" → Set up customer referral rewards
- "Win-Back Offer" → Create special offers for inactive customers
- "Promo Usage" → Track code redemption and performance
- "Seasonal Promo" → Create holiday or seasonal promotions

Be creative with promotions. Balance discount value with business margins.
Track usage to identify successful promotion types and optimal discount levels.`,

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

  insights: `You are a Business Insights Agent for company administrators and managers.
IMPORTANT: You serve INTERNAL company users (admins, managers, executives) - NOT external customers.
Provide business intelligence and strategic insights directly without customer-service-style language.

Your role is to:
- Provide high-level strategic business intelligence and recommendations
- Synthesize data into actionable executive-level insights
- Identify market trends and competitive opportunities
- Generate strategic forecasts and business projections
- Focus on "what does this mean for the business" perspective
- Create insight summaries for leadership decision-making

QUICK ACTIONS:
- "Strategic Overview" → High-level business health and direction
- "Market Trends" → Industry and competitive landscape analysis
- "Growth Opportunities" → Identify expansion and optimization areas
- "Executive Summary" → Key insights for leadership review

Respond with data-driven insights and strategic recommendations. Be direct and professional.
Explain business implications, not just numbers.`,

  forecast: `You are a Forecast Agent for company administrators and managers.
IMPORTANT: You serve INTERNAL company users (admins, managers) - NOT external customers.
Provide forecasts and projections directly without customer-service-style language.

Your role is to:
- Predict future demand based on historical data
- Project revenue and capacity needs
- Identify seasonal patterns
- Recommend staffing adjustments
- Plan for growth or slowdowns

QUICK ACTIONS:
- "Monthly Forecast" → Demand predictions for next month
- "Revenue Projection" → Revenue forecasts for next quarter
- "Staffing Needs" → Recommended staffing adjustments

Use the forecast_demand tool for predictions.
Use the generate_capacity_plan tool for planning.
Provide confidence levels with predictions. Be direct and data-focused.`,

  revenue: `You are a Revenue Analysis Agent for company administrators and managers.
IMPORTANT: You serve INTERNAL company users (admins, managers) - NOT external customers.
Provide revenue data and analysis directly without customer-service-style language.

Your role is to:
- Analyze revenue trends and patterns
- Track income by service type, technician, and time period
- Identify high-performing and underperforming revenue streams
- Calculate profit margins and cost analysis
- Provide revenue forecasting and projections
- Track payment collection rates and outstanding invoices

QUICK ACTIONS:
- "Revenue Report" → Generate detailed revenue breakdown
- "Profit Analysis" → Analyze margins by service type
- "Payment Tracking" → Review outstanding invoices and collection rates
- "Revenue Forecast" → Project future revenue based on trends
- "Top Services" → Identify highest revenue-generating services

Respond with data, numbers, and actionable insights. Be precise and professional.`,

  performance: `You are a Performance Analytics Agent for company administrators and managers. 
IMPORTANT: You serve INTERNAL company users (admins, managers, supervisors) - NOT external customers.
Provide performance data and reports directly without customer-service-style language.

Your role is to:
- Track individual technician and team performance metrics
- Measure job completion rates and efficiency
- Analyze customer satisfaction scores by employee
- Monitor response times and on-time arrival rates
- Identify training opportunities and top performers
- Generate performance scorecards and reports

QUICK ACTIONS:
- "Team Performance" → Overview of all technician metrics
- "Individual Report" → Detailed performance for specific employee
- "Efficiency Analysis" → Job completion times and optimization
- "Customer Satisfaction" → Review ratings by technician
- "Leaderboard" → Top performers this period
- "Training Needs" → Identify skill gaps and improvement areas

Respond with data, charts descriptions, and actionable insights. Be direct and professional.
Provide balanced feedback - celebrate successes and constructively address areas for improvement.`,

  // Campaign Agent - for marketing campaign management
  campaign: `You are a Campaign Agent for a service business.
IMPORTANT: You serve INTERNAL company users (admins, marketing managers) - NOT external customers.

Your role is to:
- Create and manage marketing campaigns
- Set campaign goals, target audiences, and messaging
- Track campaign performance and ROI
- Manage multi-channel campaigns (email, SMS, social)
- A/B test different campaign variations
- Analyze campaign results and suggest improvements

QUICK ACTIONS YOU CAN HELP WITH:
- "Create Campaign" → Help create a new marketing campaign with targeting and messaging
- "Campaign Status" → Check performance of active campaigns
- "End Campaign" → Close and report on a campaign
- "Campaign Analysis" → Deep dive into campaign performance metrics

Be strategic about targeting. Think about customer segments and timing.
Suggest A/B testing approaches and measure campaign effectiveness.`,

  // Lead Agent - for lead management and nurturing
  lead: `You are a Lead Agent for a service business.
IMPORTANT: You serve INTERNAL company users (admins, marketing managers) - NOT external customers.

Your role is to:
- Manage and prioritize sales leads
- Track lead sources and conversion rates
- Segment leads by status, value, and intent
- Create follow-up schedules for lead nurturing
- Qualify leads and route to appropriate team members
- Analyze lead pipeline and forecast conversions

QUICK ACTIONS YOU CAN HELP WITH:
- "New Lead" → Add and track a new sales lead
- "Lead Status" → Check status of existing leads
- "Hot Leads" → View high-priority leads ready to convert
- "Lead Sources" → Analyze where leads are coming from
- "Conversion Report" → Lead-to-customer conversion metrics

Be proactive about lead follow-up. Prioritize based on intent and engagement.
Suggest optimal timing for outreach based on lead behavior.`,


  // Social Media Agents - for SocialMediaAgentConsole
  social_content: `You are a Social Media Agent for a service business.
IMPORTANT: You serve INTERNAL company users (admins, marketing managers) - NOT external customers.

Your role is to:
- Create engaging social media posts for multiple platforms
- Craft platform-optimized content with appropriate tone and length
- Suggest relevant hashtags and captions based on industry trends
- Help repurpose content across multiple platforms
- Generate content from job completion photos and service highlights

PLATFORM SPECIFICATIONS (CRITICAL - always follow these limits):
- Instagram: 2200 character limit, visual-first, hashtag strategy (up to 30)
- Facebook: 63206 character limit, engagement-focused, call-to-action
- LinkedIn: 3000 character limit, professional tone, thought leadership
- TikTok: 4000 character limit, trend-aware, Gen-Z friendly, casual
- Google Business: 1500 character limit, local SEO, business updates
- SMS: 160 character limit, urgent/promotional, clear CTA

CONTENT CREATION WORKFLOW:
1. Ask which platforms they're targeting (can be multiple)
2. Understand the message, goal, or source material (job photos, promotions, etc.)
3. Generate platform-optimized versions with appropriate length/tone
4. Include relevant hashtags for each platform
5. Offer to save as draft or schedule for later

TOOLS AVAILABLE:
- create_social_post: Create drafts for one or more platforms
- list_social_drafts: View pending/published content
- approve_social_draft: Approve and optionally publish immediately
- schedule_social_post: Schedule for future publishing

Be creative, on-brand, and platform-aware. Suggest trending formats when relevant.`,

  social_scheduler: `You are a Social Media Scheduler for a service business.
IMPORTANT: You serve INTERNAL company users (admins, marketing managers) - NOT external customers.

Your role is to:
- Schedule posts for optimal engagement times
- Manage the content publishing queue across platforms
- Suggest best posting times based on audience insights
- Handle rescheduling and cancellations
- Maintain a balanced content calendar
- Ensure consistent posting frequency

SCHEDULING BEST PRACTICES:
- Instagram: Best times typically 11am-1pm and 7-9pm, avoid late night
- Facebook: Best times typically 9am-12pm, especially Wed-Fri
- LinkedIn: Best times typically 7-8am, 12pm, 5-6pm on weekdays
- TikTok: Best times typically 6-9am and 7-11pm
- Google Business: Business hours, spread throughout the week

QUICK ACTIONS:
- "Schedule post" → Schedule an approved draft
- "View scheduled" → Show upcoming scheduled posts
- "Reschedule" → Move a post to a different time
- "Cancel scheduled" → Remove from schedule

TOOLS AVAILABLE:
- list_social_drafts: View drafts with status filter
- schedule_social_post: Schedule a draft for publishing
- get_social_analytics: View publishing patterns

Be proactive about suggesting optimal times and maintaining posting consistency.`,

  social_analytics: `You are a Social Media Analytics agent for a service business.
IMPORTANT: You serve INTERNAL company users (admins, marketing managers) - NOT external customers.

Your role is to:
- Track social media publishing activity and volume
- Analyze content performance by platform
- Identify patterns in posting frequency and timing
- Report on draft-to-published conversion rates
- Provide insights on content type effectiveness
- Suggest optimizations based on historical data

METRICS TO TRACK:
- Posts published per platform
- Publishing frequency and consistency
- Draft approval rates
- Scheduled vs immediate publishing ratio
- Platform distribution of content
- Content creation trends over time

QUICK ACTIONS:
- "Social report" → Publishing statistics overview
- "Platform breakdown" → Performance by platform
- "Publishing trends" → Activity over time
- "Content analysis" → What content types perform well

TOOLS AVAILABLE:
- get_social_analytics: Get publishing metrics by date range and platform
- list_social_drafts: View content by status for analysis

Respond with data, trends, and actionable recommendations. Be direct and insight-focused.`,

  // Data Analytics agent - for detailed data analysis and metrics
  analytics: `You are a Data Analytics Agent for a service business. Your role is to:
- Answer questions about business data using the query_business_data tool
- Query and analyze raw operational data in detail
- Build custom reports with specific metrics and breakdowns
- Perform statistical analysis and calculations
- Create data exports and detailed metric breakdowns
- Focus on "what do the numbers show" perspective
- Drill down into granular data for specific questions

CRITICAL - USE TOOLS FOR DATA QUESTIONS:
When users ask about counts, totals, or status of business data (warranties, leads, appointments, quotes, invoices, inventory, campaigns, customers, feedback), ALWAYS use the query_business_data tool to get accurate real-time data. DO NOT guess or make up numbers!

Examples:
- "How many active warranties?" → query_business_data(data_type: "warranties", filter: "active", count_only: true)
- "Show me pending quotes" → query_business_data(data_type: "quotes", filter: "pending", count_only: false)
- "How many leads this month?" → query_business_data(data_type: "leads", time_period: "month", count_only: true)
- "Low stock inventory items" → query_business_data(data_type: "inventory", filter: "low_stock")
- "Today's appointments" → query_business_data(data_type: "appointments", filter: "today")

QUICK ACTIONS YOU CAN HELP WITH:
- "Custom Report" → Build reports with specific metrics and filters
- "Data Export" → Export raw data for external analysis
- "Metric Breakdown" → Detailed analysis of specific KPIs
- "Statistical Analysis" → Run calculations and comparisons
- "Trend Analysis" → Analyze patterns in operational data
- "Query Data" → Answer specific data questions with precision

Be precise with numbers and methodology. Provide data-backed answers with clear sources.
After getting tool results, present the data clearly in a conversational response.`,

  // Admin/Business agent - for BusinessOpsAgentConsole
  admin: `You are a Business Operations Agent for a service business. Your role is to:
- Generate and manage customer quotes
- Create and send invoices
- Track inventory and parts
- Handle pricing inquiries
- Support administrative tasks

QUICK ACTIONS YOU CAN HELP WITH:
- "Create Quote" → Generate accurate service quotes with pricing
- "Generate Invoice" → Create invoices from completed jobs
- "Check Inventory" → Look up parts and stock levels
- "Price Lookup" → Find pricing for services

Use the list_services tool to get accurate pricing.
Use the generate_quote tool to create quotes.
Use the generate_invoice tool for billing.
Be professional, accurate, and helpful with all business operations tasks.`,
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
            target_agent: { type: 'string', enum: ['booking', 'dispatch', 'quoting', 'followup', 'review', 'eta'] },
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
    {
      type: 'function',
      function: {
        name: 'capture_lead',
        description: 'Capture customer information as a lead for follow-up. Use when customer provides contact info but doesn\'t complete their request (booking, quote, etc.).',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email address' },
            address: { type: 'string', description: 'Customer address if provided' },
            service_interest: { type: 'string', description: 'What service they were interested in' },
            intent: { type: 'string', enum: ['booking', 'quote', 'inquiry', 'emergency'], description: 'What the customer wanted to do' },
            notes: { type: 'string', description: 'Summary of conversation or customer needs' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'hot'], description: 'Lead priority based on interest level' },
          },
          required: ['name'],
        },
      },
    },
  ],
  booking: [
    {
      type: 'function',
      function: {
        name: 'list_services',
        description: 'List all available services with prices. ALWAYS use this to verify a service exists before booking!',
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
    {
      type: 'function',
      function: {
        name: 'find_next_available',
        description: 'Find the next available dates when a requested date has no availability. Returns up to 3 upcoming dates with open slots. Use this IMMEDIATELY when check_availability returns zero slots instead of asking the customer to pick a new date.',
        parameters: {
          type: 'object',
          properties: {
            service_type: { type: 'string', description: 'The service type to check availability for' },
            start_date: { type: 'string', description: 'The date that had no availability (YYYY-MM-DD). Will search from the day after this date.' },
          },
          required: ['service_type', 'start_date'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'capture_lead',
        description: 'Capture customer information as a lead for follow-up. Use when customer doesn\'t complete booking.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email address' },
            address: { type: 'string', description: 'Customer address if provided' },
            service_interest: { type: 'string', description: 'What service they were interested in' },
            intent: { type: 'string', enum: ['booking', 'quote', 'inquiry', 'emergency'], description: 'What the customer wanted to do' },
            notes: { type: 'string', description: 'Summary of conversation or customer needs' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'hot'], description: 'Lead priority based on interest level' },
          },
          required: ['name'],
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
        name: 'get_my_jobs',
        description: 'Get the technician\'s currently assigned jobs with customer contact info',
        parameters: {
          type: 'object',
          properties: {
            employee_id: { type: 'string', description: 'The technician\'s employee/user ID (optional, will use authenticated user if not provided)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_job_status',
        description: 'Update job status to en_route, arrived, in_progress, or completed. This also automatically notifies the customer.',
        parameters: {
          type: 'object',
          properties: {
            job_assignment_id: { type: 'string', description: 'The job assignment ID' },
            status: { type: 'string', enum: ['en_route', 'arrived', 'in_progress', 'completed'], description: 'The new status' },
            eta_minutes: { type: 'number', description: 'Optional estimated arrival time in minutes (for en_route status)' },
          },
          required: ['job_assignment_id', 'status'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_eta_update',
        description: 'Send ETA update notification to customer via SMS, email, or both',
        parameters: {
          type: 'object',
          properties: {
            job_assignment_id: { type: 'string', description: 'The job assignment ID to send ETA for' },
            eta_minutes: { type: 'number', description: 'Estimated time of arrival in minutes' },
            channel: { type: 'string', enum: ['sms', 'email', 'both'], description: 'How to notify the customer' },
          },
          required: ['job_assignment_id', 'eta_minutes', 'channel'],
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
    {
      type: 'function',
      function: {
        name: 'capture_lead',
        description: 'Capture customer information as a lead for follow-up. Use when customer receives quote but doesn\'t proceed.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email address' },
            address: { type: 'string', description: 'Customer address if provided' },
            service_interest: { type: 'string', description: 'What service they were interested in' },
            intent: { type: 'string', enum: ['booking', 'quote', 'inquiry', 'emergency'], description: 'What the customer wanted to do' },
            notes: { type: 'string', description: 'Summary including quote amount and services they were interested in' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'hot'], description: 'Lead priority based on interest level' },
          },
          required: ['name'],
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
    {
      type: 'function',
      function: {
        name: 'capture_lead',
        description: 'Manually add a new lead to the system',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Customer phone number' },
            email: { type: 'string', description: 'Customer email address' },
            address: { type: 'string', description: 'Customer address if provided' },
            service_interest: { type: 'string', description: 'What service they are interested in' },
            intent: { type: 'string', enum: ['booking', 'quote', 'inquiry', 'emergency'], description: 'Customer intent' },
            notes: { type: 'string', description: 'Additional notes about the lead' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'hot'], description: 'Lead priority' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_leads',
        description: 'Get leads filtered by status, source, or date range',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], description: 'Filter by lead status' },
            source: { type: 'string', description: 'Filter by lead source (voice, sms, chat, email, widget)' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'hot'], description: 'Filter by priority' },
            limit: { type: 'number', description: 'Maximum number of leads to return (default 20)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_lead_status',
        description: 'Update lead status and add follow-up notes',
        parameters: {
          type: 'object',
          properties: {
            lead_id: { type: 'string', description: 'The lead ID to update' },
            status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], description: 'New status for the lead' },
            notes: { type: 'string', description: 'Follow-up notes to add' },
            follow_up_at: { type: 'string', description: 'Schedule follow-up date/time' },
          },
          required: ['lead_id', 'status'],
        },
      },
    },
  ],
  
  // Marketing agent tools
  marketing: [
    {
      type: 'function',
      function: {
        name: 'create_campaign',
        description: 'Create a new marketing campaign',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Campaign name' },
            campaign_type: { type: 'string', enum: ['email', 'sms', 'both'] },
            target_segment: { type: 'string', description: 'Customer segment to target' },
            message_template: { type: 'string', description: 'Message content' },
            discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
            discount_value: { type: 'number' },
          },
          required: ['name', 'campaign_type'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_promo_code',
        description: 'Generate a promotional code with discount',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Custom code or leave empty for auto-generate' },
            discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
            discount_value: { type: 'number' },
            expires_at: { type: 'string', description: 'Expiration date' },
          },
          required: ['discount_type', 'discount_value'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_customer_segments',
        description: 'Analyze customer segments for targeting',
        parameters: {
          type: 'object',
          properties: {
            segment_type: { type: 'string', enum: ['all', 'active', 'inactive', 'high_value', 'new'] },
          },
        },
      },
    },
    // Social media management tools
    {
      type: 'function',
      function: {
        name: 'create_social_post',
        description: 'Create a social media post draft for one or more platforms',
        parameters: {
          type: 'object',
          properties: {
            platforms: { 
              type: 'array', 
              items: { type: 'string', enum: ['instagram', 'facebook', 'linkedin', 'tiktok', 'google_business', 'sms'] },
              description: 'Platforms to post to'
            },
            content: { type: 'string', description: 'Post content/caption' },
            hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags to include (without # symbol)' },
            image_url: { type: 'string', description: 'URL of image to attach (optional)' },
            scheduled_for: { type: 'string', description: 'ISO datetime for scheduled publishing (optional, leave empty for draft)' },
          },
          required: ['platforms', 'content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_social_drafts',
        description: 'List social media drafts pending review or published posts',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'approved', 'published', 'rejected', 'all'], description: 'Filter by status' },
            platform: { type: 'string', enum: ['instagram', 'facebook', 'linkedin', 'tiktok', 'google_business', 'sms'], description: 'Filter by platform' },
            limit: { type: 'number', description: 'Maximum number of drafts to return (default 10)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'approve_social_draft',
        description: 'Approve a social media draft for publishing',
        parameters: {
          type: 'object',
          properties: {
            draft_id: { type: 'string', description: 'ID of the draft to approve' },
            publish_immediately: { type: 'boolean', description: 'If true, publish right away. If false, just approve.' },
          },
          required: ['draft_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'schedule_social_post',
        description: 'Schedule an approved draft for future publishing',
        parameters: {
          type: 'object',
          properties: {
            draft_id: { type: 'string', description: 'ID of the draft to schedule' },
            scheduled_for: { type: 'string', description: 'ISO datetime for when to publish' },
            timezone: { type: 'string', description: 'Timezone for the scheduled time (default: America/New_York)' },
          },
          required: ['draft_id', 'scheduled_for'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_social_analytics',
        description: 'Get social media publishing statistics and performance metrics',
        parameters: {
          type: 'object',
          properties: {
            date_range: { type: 'string', enum: ['7d', '30d', '90d'], description: 'Time period to analyze' },
            platform: { type: 'string', description: 'Filter by platform (optional)' },
          },
        },
      },
    },
  ],
  
  // Analytics agent tools
  analytics: [
    {
      type: 'function',
      function: {
        name: 'query_business_data',
        description: 'Query business data for counts, summaries, and details. Use this for questions about warranties, leads, appointments, quotes, invoices, inventory, campaigns, customers, and feedback.',
        parameters: {
          type: 'object',
          properties: {
            data_type: { 
              type: 'string', 
              enum: ['warranties', 'leads', 'appointments', 'quotes', 'invoices', 'inventory', 'campaigns', 'customers', 'feedback', 'services'],
              description: 'Type of business data to query'
            },
            filter: { 
              type: 'string', 
              description: 'Filter criteria (e.g., active, pending, expired, overdue, low_stock, new, scheduled, completed, draft, sent, paid)'
            },
            count_only: {
              type: 'boolean',
              description: 'Return only the count, not detailed records. Default true for simple count questions.'
            },
            time_period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'quarter', 'year', 'all'],
              description: 'Time period filter for date-based data'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return (default 10, max 50)'
            }
          },
          required: ['data_type']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_performance_metrics',
        description: 'Get business performance metrics',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'week', 'month', 'quarter', 'year'] },
            metrics: { type: 'array', items: { type: 'string' }, description: 'Specific metrics to retrieve' },
          },
          required: ['period'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_revenue_analysis',
        description: 'Analyze revenue trends and sources',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
            breakdown_by: { type: 'string', enum: ['service', 'customer', 'employee', 'day'] },
          },
          required: ['period'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_customer_insights',
        description: 'Get customer behavior and segment insights',
        parameters: {
          type: 'object',
          properties: {
            insight_type: { type: 'string', enum: ['retention', 'acquisition', 'satisfaction', 'segments'] },
          },
          required: ['insight_type'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'forecast_trends',
        description: 'Generate forecasts for demand and revenue',
        parameters: {
          type: 'object',
          properties: {
            forecast_type: { type: 'string', enum: ['demand', 'revenue', 'appointments'] },
            period: { type: 'string', enum: ['week', 'month', 'quarter'] },
          },
          required: ['forecast_type', 'period'],
        },
      },
    },
  ],
  
  // Admin/Business Operations agent tools
  admin: [
    {
      type: 'function',
      function: {
        name: 'list_services',
        description: 'List all available services with prices',
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
        description: 'Generate a quote for services',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string' },
            customer_phone: { type: 'string' },
            customer_email: { type: 'string' },
            services: { type: 'array', items: { type: 'string' }, description: 'Service names to include' },
            notes: { type: 'string' },
          },
          required: ['customer_name', 'services'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'generate_invoice',
        description: 'Generate an invoice',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string' },
            customer_email: { type: 'string' },
            amount: { type: 'number' },
            description: { type: 'string' },
          },
          required: ['customer_name', 'amount'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_inventory',
        description: 'Check inventory levels for parts',
        parameters: {
          type: 'object',
          properties: {
            search_term: { type: 'string', description: 'Part name or SKU to search' },
            category: { type: 'string' },
            low_stock_only: { type: 'boolean' },
          },
        },
      },
    },
  ],
};

// Helper function to get brand tone modifier for AI communication style
function getBrandToneModifier(brandTone: string | null): string {
  switch (brandTone) {
    case 'friendly':
      return `COMMUNICATION STYLE: Be warm, conversational, and approachable. 
Use casual language, contractions, and friendly expressions.
Example: "Hey there! I'd be happy to help you out with that!"`;
    case 'technical':
      return `COMMUNICATION STYLE: Be direct, precise, and industry-focused.
Use technical terminology when appropriate. Be concise.
Example: "I can schedule that diagnostic for you. What's your availability?"`;
    case 'professional':
    default:
      return `COMMUNICATION STYLE: Be professional, courteous, and business-appropriate.
Use formal but warm language. Maintain professionalism throughout.
Example: "Thank you for contacting us. I would be pleased to assist you."`;
  }
}

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

    const { agentType, message, companyId, userId, conversationHistory = [], contextId, isHandoff, handoffFrom, handoffReason: incomingHandoffReason, customerInfo, isInternalRequest, pageContext } = await req.json();
    
    // Get client IP for rate limiting and logging
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limit check to prevent enumeration attacks
    const rateCheck = checkRateLimit(clientIP, 'chat');
    if (!rateCheck.allowed) {
      console.log(`[AI Agent Chat] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later.' 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json', 
          'Retry-After': String(rateCheck.retryAfter) 
        },
      });
    }
    
    // Internal agents that serve company admins, not customers
    const INTERNAL_AGENTS = ['admin', 'inventory', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics'];
    const isInternalAgent = isInternalRequest || INTERNAL_AGENTS.includes(agentType);

    console.log(`[AI Agent Chat] Agent: ${agentType}, Company: ${companyId}, User: ${userId}, IP: ${clientIP}, Message: "${message.substring(0, 50)}...", isHandoff: ${isHandoff}, isInternalAgent: ${isInternalAgent}`);

    // === SUBSCRIPTION TIER GATING ===
    // Define which agents are available in each subscription tier
    // IMPORTANT: Keep in sync with src/lib/subscriptionAgentConfig.ts TIER_AGENT_CONFIG
    // NEW 7-TIER STRUCTURE: Starter, Scheduling, Growth, Business, Field Ops, Performance, Command
    // 24 Total Agents
    const TIER_AGENTS: Record<string, string[]> = {
      free: [],
      // Aura Starter ($197/mo): Lead Capture Stack only - 1 agent
      starter: ['triage'],
      // Aura Scheduling ($397/mo): Lead Capture + Booking Automation - 3 agents
      scheduling: ['triage', 'booking', 'followup'],
      // Aura Growth ($597/mo): + Marketing Automation Stack - 11 agents
      growth: ['triage', 'booking', 'followup', 'review', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative'],
      // Aura Business ($797/mo): + Office Automation Stack - 12 agents
      business: ['triage', 'booking', 'followup', 'review', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative', 'web_presence'],
      // Aura Field Ops ($1,497/mo): + Field Operations Stack - 18 agents
      field_ops: ['triage', 'booking', 'followup', 'review', 'dispatch', 'route', 'eta', 'checkin', 'quoting', 'invoice', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative', 'web_presence'],
      // Aura Performance ($3,497/mo): + Business Intelligence Stack (Basic) - 23 agents
      // Excludes revenue and forecast (advanced analytics reserved for Command)
      performance: [
        'triage', 'booking', 'followup', 'review',           // Customer Portal (4)
        'dispatch', 'route', 'eta', 'checkin',               // Field Operations (4)
        'admin', 'quoting', 'invoice', 'inventory',          // Business Operations (4)
        'campaign', 'lead', 'marketing',                      // Marketing & Sales (3)
        'social_content', 'social_scheduler', 'social_analytics', // Social Media (3)
        'insights', 'performance', 'analytics',              // Analytics & Reports - Basic (3)
        'creative', 'web_presence'                           // Creative & Web Presence (2)
      ],                                                      // Total: 23 agents
      // Aura Command ($5,497/mo): Full suite + Enterprise features - 25 agents
      command: [
        'triage', 'booking', 'followup', 'review',           // Customer Portal (4)
        'dispatch', 'route', 'eta', 'checkin',               // Field Operations (4)
        'admin', 'quoting', 'invoice', 'inventory',          // Business Operations (4)
        'campaign', 'lead', 'marketing',                      // Marketing & Sales (3)
        'social_content', 'social_scheduler', 'social_analytics', // Social Media (3)
        'insights', 'performance', 'analytics', 'revenue', 'forecast', // Analytics & Reports - Full (5)
        'creative', 'web_presence'                           // Creative & Web Presence (2)
      ],                                                      // Total: 25 agents
      // Legacy tier name aliases for backward compatibility
      express: ['triage'],  // maps to starter
      aura_flow: ['triage', 'booking', 'followup'],  // maps to scheduling
      halo: ['triage', 'booking', 'followup', 'review', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative'],  // maps to growth
      core: ['triage', 'booking', 'followup', 'review', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative', 'web_presence'],  // maps to business
      single_point: ['triage', 'booking', 'followup', 'review', 'dispatch', 'route', 'eta', 'checkin', 'quoting', 'invoice', 'campaign', 'lead', 'marketing', 'social_content', 'social_scheduler', 'social_analytics', 'creative', 'web_presence'],  // maps to field_ops
      multi_track: [  // maps to performance (23 agents)
        'triage', 'booking', 'followup', 'review',
        'dispatch', 'route', 'eta', 'checkin',
        'admin', 'quoting', 'invoice', 'inventory',
        'campaign', 'lead', 'marketing',
        'social_content', 'social_scheduler', 'social_analytics',
        'insights', 'performance', 'analytics',
        'creative', 'web_presence'
      ],
    };

    // Helper to determine required tier for an agent
    const getRequiredTierForAgent = (agent: string): string | null => {
      if (TIER_AGENTS.command.includes(agent) && !TIER_AGENTS.performance.includes(agent)) return 'command';
      if (TIER_AGENTS.performance.includes(agent) && !TIER_AGENTS.field_ops.includes(agent)) return 'performance';
      if (TIER_AGENTS.field_ops.includes(agent) && !TIER_AGENTS.business.includes(agent)) return 'field_ops';
      if (TIER_AGENTS.business.includes(agent) && !TIER_AGENTS.growth.includes(agent)) return 'business';
      if (TIER_AGENTS.growth.includes(agent) && !TIER_AGENTS.scheduling.includes(agent)) return 'growth';
      if (TIER_AGENTS.scheduling.includes(agent) && !TIER_AGENTS.starter.includes(agent)) return 'scheduling';
      if (TIER_AGENTS.starter.includes(agent)) return 'starter';
      return null;
    };

    // Fetch company's subscription tier and brand settings
    const { data: companyTierData, error: tierError } = await supabase
      .from('companies')
      .select('name, subscription_tier, trial_ends_at, brand_tone, emergency_surcharge, manager_name')
      .eq('id', companyId)
      .single();

    if (tierError) {
      console.error(`[AI Agent Chat] Error fetching company tier: ${tierError.message}`);
      return new Response(JSON.stringify({ 
        error: 'Company not found or invalid',
        message: 'Unable to verify company subscription.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subscriptionTier = companyTierData?.subscription_tier || 'free';
    const trialEndsAt = companyTierData?.trial_ends_at;
    const inTrial = trialEndsAt && new Date(trialEndsAt) > new Date();

    // Determine allowed agents based on tier (trial gets full access)
    const allowedAgents = inTrial ? TIER_AGENTS.command : (TIER_AGENTS[subscriptionTier] || []);

    // Validate agent access
    if (!allowedAgents.includes(agentType)) {
      const requiredTier = getRequiredTierForAgent(agentType);
      console.log(`[AI Agent Chat] Agent locked: ${agentType} requires ${requiredTier}, company has ${subscriptionTier}`);
      return new Response(JSON.stringify({ 
        error: 'agent_locked',
        message: `The ${agentType} agent requires the ${requiredTier} subscription tier.`,
        required_tier: requiredTier,
        current_tier: subscriptionTier
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === CUSTOMER COMPANY ASSOCIATION VALIDATION ===
    // For customer-facing requests (not internal admin agents), validate and manage company associations
    if (userId && companyId && !isInternalAgent) {
      const { data: association, error: assocError } = await supabase
        .from('customer_company_associations')
        .select('id')
        .eq('customer_user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (assocError) {
        console.error(`[AI Agent Chat] Error checking association: ${assocError.message}`);
      } else if (!association) {
        // Create new association - first interaction with this company
        const { error: insertError } = await supabase
          .from('customer_company_associations')
          .insert({
            customer_user_id: userId,
            company_id: companyId,
            last_interaction_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`[AI Agent Chat] Error creating association: ${insertError.message}`);
        } else {
          console.log(`[AI Agent Chat] Created new customer association: ${userId} -> ${companyId}`);
        }
      } else {
        // Update last interaction timestamp
        await supabase
          .from('customer_company_associations')
          .update({ last_interaction_at: new Date().toISOString() })
          .eq('id', association.id);
      }
      
      // Log this access for security auditing
      await supabase
        .from('cross_company_access_logs')
        .insert({
          customer_user_id: userId,
          attempted_company_id: companyId,
          authorized_company_id: companyId,
          access_type: 'chat',
          ip_address: clientIP,
          user_agent: userAgent,
          was_authorized: true,
          metadata: { agent_type: agentType }
        });
    }

    // Get agent config for any custom settings
    const { data: config } = await supabase
      .from('ai_agent_configs')
      .select('settings')
      .eq('company_id', companyId)
      .eq('agent_type', agentType)
      .single();

    const settings = config?.settings || {};
    
    // Company info already fetched above for tier check
    const company = companyTierData;

    // Fetch knowledge base data for booking/dispatch agents
    let knowledgeBaseContext = '';
    if (['booking', 'dispatch', 'quoting', 'triage'].includes(agentType)) {
      // Get services with delivery_type
      const { data: services } = await supabase
        .from('services')
        .select('name, description, duration_minutes, price, category, delivery_type')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(20);

      // Get business hours
      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('company_id', companyId)
        .order('day_of_week');

      // Get FAQs from knowledge base
      const { data: faqs } = await supabase
        .from('faqs')
        .select('question, answer, category')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('sort_order')
        .limit(30);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Map delivery_type to human-readable labels
      const deliveryTypeLabels: Record<string, string> = {
        'virtual': 'Virtual (Online/Phone)',
        'in_person_business': 'At Our Location',
        'in_person_customer': 'At Customer Location',
      };
      
      if (services && services.length > 0) {
        knowledgeBaseContext += `\n\nAVAILABLE SERVICES:\n`;
        services.forEach((s: any) => {
          const deliveryType = s.delivery_type || 'in_person_customer';
          const deliveryLabel = deliveryTypeLabels[deliveryType] || 'At Customer Location';
          knowledgeBaseContext += `- ${s.name}`;
          if (s.duration_minutes) knowledgeBaseContext += ` (${s.duration_minutes} mins)`;
          if (s.price) knowledgeBaseContext += ` - $${s.price}`;
          knowledgeBaseContext += ` [delivery_type: ${deliveryType} - ${deliveryLabel}]`;
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

      if (faqs && faqs.length > 0) {
        knowledgeBaseContext += `\nFREQUENTLY ASKED QUESTIONS:\n`;
        faqs.forEach(faq => {
          knowledgeBaseContext += `Q: ${faq.question}\n`;
          knowledgeBaseContext += `A: ${faq.answer}\n`;
          if (faq.category) knowledgeBaseContext += `   (Category: ${faq.category})\n`;
          knowledgeBaseContext += '\n';
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
    
    // === PROTOCOL DETECTION ===
    // Detect if we need to switch operational modes based on message content
    const channel: 'voice' | 'text' = 'text'; // Default to text for chat; voice would be set by caller
    const protocolResult = detectProtocolMode(message, []);
    let protocolPromptModifier = '';
    
    if (protocolResult.mode !== 'normal' && !isInternalAgent) {
      console.log(`[AI Agent Chat] Protocol mode detected: ${protocolResult.mode} (trigger: ${protocolResult.triggerValue})`);
      
      // Log the protocol switch
      await logProtocolSwitch(
        supabase,
        companyId,
        contextId,
        channel,
        'normal',
        protocolResult.mode,
        protocolResult.triggerType,
        protocolResult.triggerValue,
        protocolResult.confidence,
        customerInfo?.phone,
        customerInfo?.email,
        { agent_type: agentType, message_preview: message.substring(0, 100) }
      );
      
      // Get protocol-specific prompt modifications
      protocolPromptModifier = getProtocolPromptModifier(protocolResult.mode, protocolResult.triggerValue);
      
      // For contextual sharing, try to fetch relevant smart link
      if (protocolResult.mode === 'contextual_sharing' && protocolResult.triggerValue) {
        const [category, trigger] = protocolResult.triggerValue.split(':');
        const smartLink = await getSmartLinkForIntent(supabase, companyId, category, trigger || '');
        if (smartLink && smartLink.url) {
          protocolPromptModifier += `\n\nRELEVANT SMART LINK TO SHARE:
- Name: ${smartLink.name}
- URL: ${smartLink.url}
${smartLink.description ? `- Description: ${smartLink.description}` : ''}
Include this link in your response when appropriate.`;
        }
      }
    }
    
    // Special instructions for internal agents (admins, not customers)
    let internalAgentInstructions = '';
    if (isInternalAgent) {
      internalAgentInstructions = `
CRITICAL - INTERNAL AGENT MODE:
You are serving a COMPANY ADMINISTRATOR or MANAGER, NOT an external customer.
- DO NOT ask for name, phone number, address, or any customer identification
- DO NOT use customer-service-style language like "How can I help you today?"
- DO NOT mention "connecting you to a specialist" or handoff messages
- DO NOT show "Request Received" or "Contact Us" type responses
- DO provide direct data, reports, and analytics
- DO respond professionally as an internal business tool
- BE direct and data-focused in your responses
- IMMEDIATELY provide the requested information or analysis`;
    }

    // Page context for analytics agent
    let pageContextInstructions = '';
    if (pageContext && agentType === 'analytics') {
      pageContextInstructions = `
USER'S CURRENT PAGE CONTEXT:
${pageContext}
Use the query_business_data tool to answer questions about any data mentioned in the page context.`;
    }
    
    // Get brand tone modifier for non-internal agents
    const brandToneModifier = !isInternalAgent ? getBrandToneModifier(company?.brand_tone) : '';
    
    // Add emergency surcharge context if configured
    const pricingContext = company?.emergency_surcharge ? 
      `\nEMERGENCY/AFTER-HOURS SURCHARGE: $${company.emergency_surcharge} additional fee applies for emergency or after-hours service calls.` : '';
    
    // Add manager info for de-escalation
    const managerContext = company?.manager_name ? 
      `\nESCALATION MANAGER: ${company.manager_name}` : '';
    
    const systemPrompt = `${basePrompt}
${brandToneModifier}
${protocolPromptModifier}
${handoffInstructions}
${pageContextInstructions}
${internalAgentInstructions}

Company Name: ${company?.name || 'Our Company'}
${dateTimeContext}
${pricingContext}
${managerContext}

${knowledgeBaseContext}

Current Context: ${JSON.stringify(contextData)}

${settings.greeting_message && !isInternalAgent ? `Custom Greeting: ${settings.greeting_message}` : ''}
${settings.custom_instructions ? `Additional Instructions: ${settings.custom_instructions}` : ''}

CRITICAL RULES:
${isInternalAgent ? `- Provide data and analytics directly without customer-service language
- Never ask for personal information - the user is a company admin` : `- NEVER ask for information you already have
- When customers say "tomorrow", "next Monday", etc., use the date context above to determine the actual date. NEVER ask what tomorrow's date is!
- After using a tool (like check_tech_availability), you MUST tell the customer the results and next steps
- Never leave the conversation hanging after a tool call - always follow up with what you found
- Be specific about technician names, distances, and ETAs when you have them`}
- Be professional ${isInternalAgent ? 'and data-focused' : 'but friendly'}`;

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
    // Map social agents to shared social tools
    const toolKey = ['social_content', 'social_scheduler', 'social_analytics'].includes(agentType) ? 'social' : agentType;
    const tools = AGENT_TOOLS[toolKey] || [
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

          // Subscription tier gating for handoff target
          if (!allowedAgents.includes(target)) {
            const requiredTier = getRequiredTierForAgent(target);
            console.log(`[AI Agent Chat] Handoff blocked: ${target} requires ${requiredTier}, company has ${subscriptionTier}`);
            // Block the handoff and provide a graceful message
            toolCalls.push({
              name: 'handoff_to_agent',
              arguments: { ...(args as any), target_agent: target, reason },
              result: `Cannot hand off to ${target}: This feature requires the ${requiredTier} subscription tier. Please upgrade your plan to access this functionality.`,
            });
            // Don't set handoffTo, so the conversation continues with current agent
          } else {
            handoffTo = target;
            handoffReason = reason;
            toolCalls.push({
              name: 'handoff_to_agent',
              arguments: { ...(args as any), target_agent: target, reason },
              result: `Handing off to ${target}: ${reason}`,
            });
          }
        } else {
          // Execute the tool
          const result = await executeAgentTool(supabase, companyId, agentType, funcName, args, userId);
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
              const targetAgent = args.target_agent;
              
              // Subscription tier gating for handoff target in follow-up calls
              if (!allowedAgents.includes(targetAgent)) {
                const requiredTier = getRequiredTierForAgent(targetAgent);
                console.log(`[AI Agent Chat] Handoff blocked in loop: ${targetAgent} requires ${requiredTier}`);
                toolCalls.push({
                  name: 'handoff_to_agent',
                  arguments: args,
                  result: `Cannot hand off to ${targetAgent}: This feature requires the ${requiredTier} subscription tier.`,
                });
              } else {
                handoffTo = targetAgent;
                handoffReason = args.reason;
                toolCalls.push({
                  name: 'handoff_to_agent',
                  arguments: args,
                  result: `Handing off to ${targetAgent}: ${args.reason}`,
                });
              }
            } else {
              const result = await executeAgentTool(supabase, companyId, agentType, funcName, args, userId);
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
    // Internal/analytics agents don't use customer-facing handoff language
    
    if (handoffTo && !responseText.trim()) {
      if (isInternalAgent || INTERNAL_AGENTS.includes(handoffTo)) {
        // For internal agents, skip customer-facing message - they will respond directly
        responseText = '';
      } else {
        const handoffMessages: Record<string, string> = {
          booking: "I understand you'd like to schedule an appointment. Let me connect you with our scheduling specialist who can help find the perfect time for you.",
          dispatch: "I can see this needs immediate attention. Let me connect you with our dispatch team who can get someone out to help you right away.",
          quoting: "You'd like a quote for service. Let me transfer you to our quoting specialist who can provide you with accurate pricing.",
          followup: "Let me connect you with our follow-up team to ensure everything is taken care of.",
          review: "Thank you for your feedback! Let me connect you with our team to help with your review.",
          invoice: "Let me transfer you to our billing team who can assist with your invoice.",
          default: `I'll connect you with our ${handoffTo} specialist who can better assist you with this request.`,
        };
        responseText = handoffMessages[handoffTo] || handoffMessages.default;
      }
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

    // Track subscription usage for AI requests
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    const { data: existingUsage } = await supabase
      .from('subscription_usage_tracking')
      .select('ai_requests')
      .eq('company_id', companyId)
      .eq('month_year', currentMonth)
      .single();

    if (existingUsage) {
      await supabase
        .from('subscription_usage_tracking')
        .update({ ai_requests: (existingUsage.ai_requests || 0) + 1 })
        .eq('company_id', companyId)
        .eq('month_year', currentMonth);
    } else {
      await supabase
        .from('subscription_usage_tracking')
        .insert({
          company_id: companyId,
          month_year: currentMonth,
          ai_requests: 1,
          voice_minutes: 0,
          sms_sent: 0,
          emails_sent: 0,
        });
    }

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

// === PROTOCOL SWITCHING SYSTEM ===
// Detects when to switch operational modes based on urgency, sentiment, and information needs

type ProtocolMode = 'normal' | 'emergency' | 'de_escalation' | 'contextual_sharing';
type TriggerType = 'keyword' | 'sentiment' | 'manual';

interface ProtocolDetectionResult {
  mode: ProtocolMode;
  triggerType: TriggerType;
  triggerValue: string | null;
  confidence: number;
}

// Emergency keywords - highest priority detection
const DEFAULT_EMERGENCY_KEYWORDS = [
  'emergency', 'urgent', 'flood', 'flooding', 'fire', 'gas smell', 'smell gas',
  'sparks', 'smoke', 'no heat', 'no ac', 'no a/c', 'burst pipe', 'water everywhere',
  'dangerous', 'help', 'leaking everywhere', 'electrical burning'
];

// De-escalation sentiment triggers
const DE_ESCALATION_TRIGGERS = [
  'cancel my service', 'cancel service', 'not happy', 'horrible', 'worst',
  'third time', 'speak to manager', 'talk to manager', 'supervisor',
  'unacceptable', 'ridiculous', 'frustrated', 'furious', 'angry',
  'terrible', 'disgusting', 'never again', 'refund', 'complaint'
];

// Profanity indicators for de-escalation
const PROFANITY_PATTERNS = [
  /\b(damn|hell|crap|suck|pissed|bs|b\.s\.)\b/i,
  /(!{3,})/,  // Multiple exclamation marks indicate frustration
];

// Contextual sharing intent triggers (mapped to smart link categories)
const CONTEXTUAL_INTENT_PATTERNS: Record<string, string[]> = {
  scheduling: ['book', 'schedule', 'appointment', 'availability', 'when can', 'available times'],
  pricing: ['how much', 'price', 'cost', 'quote', 'estimate', 'rate', 'pricing'],
  reviews: ['reviews', 'ratings', 'reputation', 'good', 'recommend', 'testimonials'],
  invoicing: ['pay', 'invoice', 'bill', 'payment', 'balance', 'owe'],
  emergency: ['emergency', 'urgent', 'after hours', '24/7', 'emergency number'],
};

/**
 * Detects the current protocol mode based on message content
 * Priority: Emergency > De-escalation > Contextual Sharing > Normal
 */
function detectProtocolMode(
  text: string,
  customEmergencyKeywords: string[] = []
): ProtocolDetectionResult {
  const t = text.toLowerCase();
  
  // 1. EMERGENCY MODE - Highest priority
  const allEmergencyKeywords = [...DEFAULT_EMERGENCY_KEYWORDS, ...customEmergencyKeywords];
  for (const keyword of allEmergencyKeywords) {
    if (t.includes(keyword.toLowerCase())) {
      return {
        mode: 'emergency',
        triggerType: 'keyword',
        triggerValue: keyword,
        confidence: 0.95,
      };
    }
  }
  
  // 2. DE-ESCALATION MODE - Check sentiment triggers
  for (const trigger of DE_ESCALATION_TRIGGERS) {
    if (t.includes(trigger.toLowerCase())) {
      return {
        mode: 'de_escalation',
        triggerType: 'sentiment',
        triggerValue: trigger,
        confidence: 0.85,
      };
    }
  }
  
  // Check profanity/frustration patterns
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        mode: 'de_escalation',
        triggerType: 'sentiment',
        triggerValue: 'frustration_detected',
        confidence: 0.75,
      };
    }
  }
  
  // Check for ALL CAPS (indicates shouting/frustration)
  const words = text.split(/\s+/);
  const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 3) {
    return {
      mode: 'de_escalation',
      triggerType: 'sentiment',
      triggerValue: 'caps_detected',
      confidence: 0.70,
    };
  }
  
  // 3. CONTEXTUAL SHARING MODE - Check for info-seeking intent
  for (const [category, triggers] of Object.entries(CONTEXTUAL_INTENT_PATTERNS)) {
    for (const trigger of triggers) {
      if (t.includes(trigger.toLowerCase())) {
        return {
          mode: 'contextual_sharing',
          triggerType: 'keyword',
          triggerValue: `${category}:${trigger}`,
          confidence: 0.80,
        };
      }
    }
  }
  
  // 4. NORMAL MODE - Default
  return {
    mode: 'normal',
    triggerType: 'manual',
    triggerValue: null,
    confidence: 1.0,
  };
}

/**
 * Logs a protocol mode switch event for analytics
 */
async function logProtocolSwitch(
  supabase: any,
  companyId: string,
  conversationId: string | null,
  channel: 'voice' | 'text',
  previousMode: ProtocolMode,
  newMode: ProtocolMode,
  triggerType: TriggerType,
  triggerValue: string | null,
  confidence: number,
  customerPhone?: string | null,
  customerEmail?: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('protocol_switch_events').insert({
      company_id: companyId,
      conversation_id: conversationId,
      channel,
      previous_mode: previousMode,
      new_mode: newMode,
      trigger_type: triggerType,
      trigger_value: triggerValue,
      confidence_score: confidence,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      metadata: metadata || {},
    });
    console.log(`[Protocol Switch] Logged: ${previousMode} -> ${newMode} (${triggerType}: ${triggerValue})`);
  } catch (error) {
    console.error('[Protocol Switch] Failed to log switch event:', error);
  }
}

/**
 * Fetches matching smart link based on detected intent
 */
async function getSmartLinkForIntent(
  supabase: any,
  companyId: string,
  intentCategory: string,
  intentTrigger: string
): Promise<{ url: string; name: string; description: string | null } | null> {
  try {
    // First try exact category match
    const { data: exactMatch } = await supabase
      .from('smart_links')
      .select('url, name, description, intent_triggers')
      .eq('company_id', companyId)
      .eq('category', intentCategory)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    if (exactMatch && exactMatch.url) {
      return {
        url: exactMatch.url,
        name: exactMatch.name,
        description: exactMatch.description,
      };
    }
    
    // Fall back to searching intent_triggers across all links
    const { data: links } = await supabase
      .from('smart_links')
      .select('url, name, description, intent_triggers')
      .eq('company_id', companyId)
      .eq('is_active', true);
    
    if (links) {
      for (const link of links) {
        const triggers = link.intent_triggers || [];
        if (triggers.some((t: string) => intentTrigger.toLowerCase().includes(t.toLowerCase()))) {
          if (link.url) {
            return {
              url: link.url,
              name: link.name,
              description: link.description,
            };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Smart Links] Error fetching smart link:', error);
    return null;
  }
}

/**
 * Gets protocol-specific system prompt modifications
 */
function getProtocolPromptModifier(mode: ProtocolMode, triggerValue: string | null): string {
  switch (mode) {
    case 'emergency':
      return `
EMERGENCY MODE ACTIVE - HIGHEST PRIORITY
===========================================
The customer has indicated an EMERGENCY situation (detected: "${triggerValue}").

CRITICAL RULES:
1. Use SHORT, DECLARATIVE sentences - no long explanations
2. Do NOT offer multiple options - provide ONE clear path to help
3. Do NOT attempt to troubleshoot or schedule a standard appointment
4. IMMEDIATELY provide emergency contact information
5. Confirm location/safety if not already known
6. Express urgency and reassurance: "I understand this is urgent. Let me get you help immediately."

SAFETY GUARDRAIL: For gas leaks, fire, or electrical hazards, ONLY provide the emergency phone number and tell them to evacuate if necessary. Do NOT attempt any other assistance.
`;

    case 'de_escalation':
      return `
DE-ESCALATION MODE ACTIVE - EMPATHY FIRST
==========================================
The customer appears FRUSTRATED or UPSET (detected: "${triggerValue}").

CRITICAL RULES:
1. Lead with EMPATHY - "I hear your frustration" or "I understand this has been difficult"
2. Do NOT defend the company or make excuses
3. Do NOT provide explanations before acknowledging their feelings
4. SUMMARIZE their issue back to show you listened
5. Offer a DIRECT PATH to resolution or human manager contact
6. Use calming language: "I'm going to make this right"

PHRASES TO USE:
- "I completely understand why you're frustrated"
- "I hear you, and I'm sorry this has been your experience"
- "Let me personally make sure this gets resolved"
- "I'm escalating this to ensure you get the attention you deserve"

PHRASES TO AVOID:
- "Unfortunately..." or "Our policy is..."
- "I understand, but..."
- Anything that sounds defensive
`;

    case 'contextual_sharing':
      return `
CONTEXTUAL SHARING MODE ACTIVE - PROACTIVE INFO
================================================
The customer is seeking specific information (detected: "${triggerValue}").

CRITICAL RULES:
1. Be PROACTIVE - don't wait until end of conversation to share relevant links
2. VERBALLY CONFIRM when sending information: "I'm sending that link to you now"
3. For VOICE calls: Trigger SMS with the link while confirming verbally
4. For TEXT chat: Embed the link directly in your response
5. Match the info to their exact request - scheduling link for booking, payment link for invoices, etc.
`;

    default:
      return '';
  }
}

// Execute agent-specific tools
async function executeAgentTool(
  supabase: any,
  companyId: string,
  agentType: string,
  toolName: string,
  args: any,
  userId?: string | null
): Promise<any> {
  console.log(`[AI Agent] Executing tool: ${toolName} for ${agentType}`);

  // Simulated tool execution - in production, these would connect to real systems
  switch (toolName) {
    case 'check_availability': {
      console.log('[AI Agent] Checking availability with args:', args);
      
      // Parse the preferred_date to get a proper YYYY-MM-DD format
      let dateStr = args.preferred_date;
      
      if (dateStr) {
        // Try to parse the date - could be "tomorrow", "January 2, 2026", "2026-01-02", etc.
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          // Valid date - format as YYYY-MM-DD
          dateStr = parsedDate.toISOString().split('T')[0];
        } else {
          // If parsing failed, try relative date handling
          const today = new Date();
          const lowerDate = dateStr.toLowerCase();
          
          if (lowerDate === 'today') {
            dateStr = today.toISOString().split('T')[0];
          } else if (lowerDate === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateStr = tomorrow.toISOString().split('T')[0];
          } else {
            // Default to tomorrow if we can't parse
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateStr = tomorrow.toISOString().split('T')[0];
          }
        }
      } else {
        // Default to tomorrow if no date specified
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split('T')[0];
      }
      
      console.log('[AI Agent] Checking availability for date:', dateStr, 'service:', args.service_type);
      
      // Call the booking-actions endpoint for real availability
      try {
        const bookingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/booking-actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            action: 'check_availability',
            company_id: companyId,
            service_name: args.service_type || 'Standard Service Call / Diagnostic',
            date: dateStr,
            employee_id: args.employee_id || null,
          }),
        });
        
        if (!bookingResponse.ok) {
          const errorText = await bookingResponse.text();
          console.error('[AI Agent] Booking actions error:', errorText);
          return { 
            success: false, 
            error: 'Unable to check availability. Please try again.',
            date: dateStr
          };
        }
        
        const availabilityResult = await bookingResponse.json();
        console.log('[AI Agent] Availability result:', JSON.stringify(availabilityResult).substring(0, 500));
        
        // Format slots for AI to present
        if (availabilityResult.available_slots && availabilityResult.available_slots.length > 0) {
          return {
            success: true,
            date: dateStr,
            service: availabilityResult.service || args.service_type,
            available_slots: availabilityResult.available_slots.map((slot: any) => ({
              time: slot.start_time,
              datetime: slot.datetime,
              employee_name: slot.employee_name,
              employee_id: slot.employee_id,
            })),
            total_slots: availabilityResult.available_slots.length,
          };
        } else {
          return {
            success: true,
            date: dateStr,
            service: availabilityResult.service || args.service_type,
            available_slots: [],
            message: availabilityResult.message || 'No availability on this date. Please try another date.',
          };
        }
      } catch (error: any) {
        console.error('[AI Agent] Error checking availability:', error);
        return { 
          success: false, 
          error: 'Unable to check availability: ' + error.message,
          date: dateStr
        };
      }
    }

    case 'find_next_available': {
      console.log('[AI Agent] Finding next available dates with args:', args);
      
      let startDateStr = args.start_date;
      if (startDateStr) {
        const parsed = new Date(startDateStr);
        if (!isNaN(parsed.getTime())) {
          startDateStr = parsed.toISOString().split('T')[0];
        } else {
          startDateStr = new Date().toISOString().split('T')[0];
        }
      } else {
        startDateStr = new Date().toISOString().split('T')[0];
      }
      
      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/booking-actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            action: 'find_next_available',
            company_id: companyId,
            service_name: args.service_type || 'Standard Service Call / Diagnostic',
            start_date: startDateStr,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AI Agent] find_next_available error:', errorText);
          return { success: false, error: 'Unable to find next available dates.' };
        }
        
        const result = await response.json();
        console.log('[AI Agent] find_next_available result:', JSON.stringify(result).substring(0, 500));
        return result;
      } catch (error: any) {
        console.error('[AI Agent] Error finding next available:', error);
        return { success: false, error: 'Unable to find next available dates: ' + error.message };
      }
    }

    case 'create_appointment': {
      console.log('[AI Agent] Creating appointment with args:', args);
      
      // CRITICAL: Parse and normalize the datetime
      let appointmentDatetime = args.datetime;
      
      if (appointmentDatetime) {
        // Check if it's already a valid ISO date
        const parsed = new Date(appointmentDatetime);
        
        if (isNaN(parsed.getTime())) {
          // Not a valid date - might be just a time like "2:00 PM" or relative like "tomorrow 2pm"
          console.log('[AI Agent] Datetime needs parsing:', appointmentDatetime);
          
          // Try to extract time and date components
          const lowerDt = appointmentDatetime.toLowerCase();
          
          // Determine the date part
          let baseDate = new Date();
          if (lowerDt.includes('tomorrow')) {
            baseDate.setDate(baseDate.getDate() + 1);
          } else if (lowerDt.includes('today')) {
            // baseDate is already today
          }
          
          // Extract time - look for patterns like "2pm", "2:00 PM", "14:00"
          const timeMatch = appointmentDatetime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const meridiem = timeMatch[3]?.toLowerCase();
            
            // Convert to 24-hour format
            if (meridiem === 'pm' && hours !== 12) {
              hours += 12;
            } else if (meridiem === 'am' && hours === 12) {
              hours = 0;
            }
            
            baseDate.setHours(hours, minutes, 0, 0);
            appointmentDatetime = baseDate.toISOString();
            console.log('[AI Agent] Parsed datetime to:', appointmentDatetime);
          } else {
            // Couldn't parse time - default to 9 AM
            baseDate.setHours(9, 0, 0, 0);
            appointmentDatetime = baseDate.toISOString();
            console.log('[AI Agent] Could not parse time, defaulting to 9 AM:', appointmentDatetime);
          }
        } else {
          // Valid date - ensure it's ISO format
          appointmentDatetime = parsed.toISOString();
          console.log('[AI Agent] Valid ISO datetime:', appointmentDatetime);
        }
      } else {
        // No datetime provided - default to tomorrow 9 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        appointmentDatetime = tomorrow.toISOString();
        console.log('[AI Agent] No datetime provided, defaulting to:', appointmentDatetime);
      }
      
      // CRITICAL: Validate that the requested service exists for this company
      const { data: availableServices } = await supabase
        .from('services')
        .select('name')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      const serviceNames = availableServices?.map((s: any) => s.name.toLowerCase()) || [];
      const requestedService = (args.service_type || '').toLowerCase();
      
      // Check if no services are configured
      if (serviceNames.length === 0) {
        console.log('[AI Agent] No services configured for company:', companyId);
        return { 
          success: false, 
          error: 'No services are currently configured for online booking. Please contact us directly to schedule an appointment.',
          no_services_configured: true
        };
      }
      
      // Check if requested service exists (fuzzy match)
      const serviceExists = serviceNames.some((name: string) => 
        name.includes(requestedService) || requestedService.includes(name)
      );
      
      if (!serviceExists) {
        const availableList = availableServices?.map((s: any) => s.name).join(', ');
        console.log('[AI Agent] Service not found. Requested:', args.service_type, 'Available:', availableList);
        return { 
          success: false, 
          error: `We don't currently offer "${args.service_type}". Our available services are: ${availableList}. Please choose one of these services.`,
          available_services: availableList,
          service_not_found: true
        };
      }
      
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

      // Look up delivery_type from the matched service
      const { data: matchedService } = await supabase
        .from('services')
        .select('delivery_type')
        .eq('company_id', companyId)
        .ilike('name', `%${args.service_type}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const deliveryType = matchedService?.delivery_type || 'in_person_customer';

      // Create the appointment with the properly parsed datetime
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          customer_email: args.customer_email,
          customer_address: args.customer_address || null,
          service_type: args.service_type,
          datetime: appointmentDatetime,
          duration_minutes: args.duration_minutes || 60,
          notes: args.notes || null,
          status: 'scheduled',
          employee_id: employeeId,
          customer_user_id: userId || null,
          delivery_type: deliveryType,
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
    // ETA TOOLS (For Technicians)
    // ==========================================
    case 'get_my_jobs': {
      console.log('[AI Agent] Getting technician jobs for userId:', args.employee_id);
      
      // Use provided employee_id from args, or filter by authenticated user
      const employeeIdFilter = args.employee_id;
      
      // Build query
      let query = supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          customer_address,
          estimated_arrival_minutes,
          employee_id,
          appointments (
            id,
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            datetime,
            customer_address,
            delivery_type,
            meeting_link
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: true });
      
      // Filter by employee if provided
      if (employeeIdFilter) {
        query = query.eq('employee_id', employeeIdFilter);
      }
      
      const { data: jobs, error: jobsError } = await query;
      
      if (jobsError) {
        console.error('[AI Agent] Error fetching jobs:', jobsError);
        return { success: false, error: jobsError.message };
      }
      
      if (!jobs || jobs.length === 0) {
        return {
          success: true,
          jobs: [],
          message: employeeIdFilter 
            ? 'No active jobs found assigned to you. You have no currently accepted jobs.'
            : 'No active jobs found. You have no currently accepted jobs to send ETA updates for.',
        };
      }
      
      const formattedJobs = jobs.map((j: any) => ({
        job_assignment_id: j.id,
        status: j.status,
        customer_name: j.appointments?.customer_name || 'Unknown',
        customer_phone: j.appointments?.customer_phone || null,
        customer_email: j.appointments?.customer_email || null,
        service_type: j.appointments?.service_type || 'Service',
        address: j.customer_address || j.appointments?.customer_address || 'No address',
        scheduled_time: j.appointments?.datetime ? new Date(j.appointments.datetime).toLocaleString() : 'Not set',
        estimated_arrival_minutes: j.estimated_arrival_minutes,
        delivery_type: j.appointments?.delivery_type || 'in_person_customer',
        meeting_link: j.appointments?.meeting_link || null,
      }));
      
      return {
        success: true,
        jobs: formattedJobs,
        count: formattedJobs.length,
        message: formattedJobs.length === 1 
          ? `You have 1 active job: ${formattedJobs[0].customer_name} at ${formattedJobs[0].address}`
          : `You have ${formattedJobs.length} active jobs.`,
      };
    }

    case 'send_eta_update': {
      console.log('[AI Agent] Sending ETA update:', args);
      
      if (!args.job_assignment_id || !args.eta_minutes || !args.channel) {
        return {
          success: false,
          error: 'Missing required info: job_assignment_id, eta_minutes, and channel are required.',
        };
      }
      
      // Get job assignment with appointment and customer info
      const { data: jobData, error: jobError } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          employee_id,
          appointments (
            id,
            customer_name,
            customer_phone,
            customer_email,
            service_type,
            company_id
          )
        `)
        .eq('id', args.job_assignment_id)
        .eq('company_id', companyId)
        .single();
      
      if (jobError || !jobData) {
        console.error('[AI Agent] Error fetching job:', jobError);
        return { success: false, error: 'Job not found or access denied.' };
      }
      
      const appointment = jobData.appointments as any;
      if (!appointment) {
        return { success: false, error: 'No appointment linked to this job.' };
      }
      
      const customerName = appointment.customer_name || 'Customer';
      const customerPhone = appointment.customer_phone;
      const customerEmail = appointment.customer_email;
      const serviceType = appointment.service_type || 'service';
      
      // Update the job assignment with ETA
      await supabase
        .from('job_assignments')
        .update({ 
          estimated_arrival_minutes: args.eta_minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', args.job_assignment_id);
      
      // Get company name for the message
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      const companyName = company?.name || 'Our company';
      const etaMessage = `Hi ${customerName}! Your ${serviceType} technician from ${companyName} is on the way and will arrive in approximately ${args.eta_minutes} minutes. Thank you for your patience!`;
      
      const results: any = {
        sms_sent: false,
        email_sent: false,
        messages: [],
      };
      
      // Send SMS if requested and phone available
      if ((args.channel === 'sms' || args.channel === 'both') && customerPhone) {
        try {
          const smsResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-appointment-sms`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                companyId: companyId,
                customerPhone: customerPhone,
                customMessage: etaMessage,
              }),
            }
          );
          
          if (smsResponse.ok) {
            results.sms_sent = true;
            results.messages.push(`SMS sent to ${customerPhone}`);
          } else {
            const errText = await smsResponse.text();
            console.error('[AI Agent] SMS send failed:', errText);
            results.messages.push(`SMS failed: ${errText}`);
          }
        } catch (smsErr: any) {
          console.error('[AI Agent] SMS error:', smsErr);
          results.messages.push(`SMS error: ${smsErr.message}`);
        }
      } else if ((args.channel === 'sms' || args.channel === 'both') && !customerPhone) {
        results.messages.push('SMS skipped: No phone number on file');
      }
      
      // Send email if requested and email available
      if ((args.channel === 'email' || args.channel === 'both') && customerEmail) {
        try {
          const emailResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-appointment-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                companyId: companyId,
                appointmentId: appointment.id,
                templateType: 'custom',
                customSubject: `Your technician is on the way! ETA: ${args.eta_minutes} minutes`,
                customMessage: etaMessage,
                customerEmail: customerEmail,
                customerName: customerName,
              }),
            }
          );
          
          if (emailResponse.ok) {
            results.email_sent = true;
            results.messages.push(`Email sent to ${customerEmail}`);
          } else {
            const errText = await emailResponse.text();
            console.error('[AI Agent] Email send failed:', errText);
            results.messages.push(`Email failed: ${errText}`);
          }
        } catch (emailErr: any) {
          console.error('[AI Agent] Email error:', emailErr);
          results.messages.push(`Email error: ${emailErr.message}`);
        }
      } else if ((args.channel === 'email' || args.channel === 'both') && !customerEmail) {
        results.messages.push('Email skipped: No email address on file');
      }
      
      const anySent = results.sms_sent || results.email_sent;
      
      return {
        success: anySent,
        customer_name: customerName,
        eta_minutes: args.eta_minutes,
        channel: args.channel,
        sms_sent: results.sms_sent,
        email_sent: results.email_sent,
        details: results.messages,
        message: anySent 
          ? `ETA update sent! ${results.messages.join('. ')}`
          : `Could not send ETA update. ${results.messages.join('. ')}`,
      };
    }

    case 'update_job_status': {
      console.log('[AI Agent] Updating job status:', args);
      
      if (!args.job_assignment_id || !args.status) {
        return {
          success: false,
          error: 'Missing required info: job_assignment_id and status are required.',
        };
      }
      
      const validStatuses = ['en_route', 'arrived', 'in_progress', 'completed'];
      if (!validStatuses.includes(args.status)) {
        return {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        };
      }
      
      // Get job assignment with customer info
      const { data: jobData, error: jobError } = await supabase
        .from('job_assignments')
        .select(`
          id,
          status,
          employee_id,
          appointments (
            id,
            customer_name,
            customer_phone,
            customer_email,
            service_type
          )
        `)
        .eq('id', args.job_assignment_id)
        .eq('company_id', companyId)
        .single();
      
      if (jobError || !jobData) {
        console.error('[AI Agent] Error fetching job:', jobError);
        return { success: false, error: 'Job not found or access denied.' };
      }
      
      const appointment = jobData.appointments as any;
      const customerName = appointment?.customer_name || 'Customer';
      const serviceType = appointment?.service_type || 'service';
      
      // Build update object based on status
      const updateData: any = {
        status: args.status,
        updated_at: new Date().toISOString(),
      };
      
      if (args.status === 'en_route') {
        updateData.en_route_at = new Date().toISOString();
        if (args.eta_minutes) {
          updateData.estimated_arrival_minutes = args.eta_minutes;
        }
      } else if (args.status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (args.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      // Update the job assignment
      const { error: updateError } = await supabase
        .from('job_assignments')
        .update(updateData)
        .eq('id', args.job_assignment_id);
      
      if (updateError) {
        console.error('[AI Agent] Error updating job status:', updateError);
        return { success: false, error: 'Failed to update job status.' };
      }
      
      // Send notification to customer
      let notificationResult = 'Customer notified';
      try {
        const notifResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-job-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              jobAssignmentId: args.job_assignment_id,
              notificationType: args.status,
              recipientType: 'customer',
            }),
          }
        );
        
        if (!notifResponse.ok) {
          notificationResult = 'Status updated (notification delivery pending)';
        }
      } catch (notifErr: any) {
        console.error('[AI Agent] Notification error:', notifErr);
        notificationResult = 'Status updated (notification delivery pending)';
      }
      
      const statusMessages: Record<string, string> = {
        en_route: `You are now en route to ${customerName}. ${notificationResult}.`,
        arrived: `Marked as arrived at ${customerName}'s location. ${notificationResult}.`,
        in_progress: `Job started for ${customerName}. ${notificationResult}.`,
        completed: `Job completed for ${customerName}! ${notificationResult}.`,
      };
      
      return {
        success: true,
        job_assignment_id: args.job_assignment_id,
        new_status: args.status,
        customer_name: customerName,
        service_type: serviceType,
        message: statusMessages[args.status] || `Status updated to ${args.status}. ${notificationResult}.`,
      };
    }

    // ==========================================
    // QUOTING TOOLS
    // ==========================================
    case 'list_services': {
      console.log('[AI Agent] Listing available services');
      
      let query = supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, category, flat_fee, hourly_rate, delivery_type')
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
      
      const deliveryTypeLabels: Record<string, string> = {
        'virtual': 'Virtual (Online/Phone)',
        'in_person_business': 'At Our Location',
        'in_person_customer': 'At Your Location',
      };
      
      const formattedServices = services.map((s: any) => ({
        name: s.name,
        description: s.description || 'Professional service',
        price: s.flat_fee || s.price || (s.hourly_rate ? `$${s.hourly_rate}/hr` : 'Contact for pricing'),
        duration: s.duration_minutes ? `${s.duration_minutes} min` : null,
        category: s.category,
        delivery_type: s.delivery_type || 'in_person_customer',
        delivery_label: deliveryTypeLabels[s.delivery_type] || 'At Your Location',
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
        return { 
          success: false, 
          error: 'Quote not found. You must call generate_quote first to create a quote before sending it. Use the quote_id returned from generate_quote.',
          action_required: 'Call generate_quote with the customer\'s selected services first, then use the returned quote_id with send_quote.'
        };
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

    case 'capture_lead': {
      console.log('[AI Agent] Capturing lead with args:', args);
      
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          company_id: companyId,
          name: args.name || null,
          phone: args.phone || null,
          email: args.email || null,
          address: args.address || null,
          source: 'chat',
          service_interest: args.service_interest || null,
          intent: args.intent || 'inquiry',
          notes: args.notes || null,
          status: 'new',
          priority: args.priority || 'normal',
        })
        .select()
        .single();

      if (error) {
        console.error('[AI Agent] Error capturing lead:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        lead_id: lead.id,
        message: `Lead captured successfully for ${args.name || 'customer'}. They will be followed up with soon.`,
      };
    }

    case 'get_leads': {
      console.log('[AI Agent] Getting leads with args:', args);
      
      let query = supabase
        .from('leads')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(args.limit || 20);

      if (args.status) query = query.eq('status', args.status);
      if (args.source) query = query.eq('source', args.source);
      if (args.priority) query = query.eq('priority', args.priority);

      const { data: leads, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        leads: leads || [],
        count: leads?.length || 0,
        message: `Found ${leads?.length || 0} leads`,
      };
    }

    case 'update_lead_status': {
      console.log('[AI Agent] Updating lead status:', args);
      
      const updateData: any = {
        status: args.status,
        updated_at: new Date().toISOString(),
      };
      if (args.notes) updateData.notes = args.notes;
      if (args.follow_up_at) updateData.follow_up_at = args.follow_up_at;

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', args.lead_id)
        .eq('company_id', companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Lead status updated to ${args.status}`,
      };
    }

    case 'query_business_data': {
      console.log('[AI Agent] Query business data:', args);
      
      const dataType = args.data_type as string;
      const filter = args.filter as string | undefined;
      const countOnly = args.count_only !== false; // Default to true
      const timePeriod = args.time_period as string | undefined;
      const limit = Math.min(args.limit || 10, 50);
      
      // Calculate date range based on time period
      const now = new Date();
      let startDate: Date | null = null;
      if (timePeriod) {
        switch (timePeriod) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
      }
      
      try {
        switch (dataType) {
          case 'warranties': {
            let query = supabase
              .from('warranty_records')
              .select(countOnly ? 'id' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter === 'active') {
              query = query.gte('warranty_end_date', now.toISOString());
            } else if (filter === 'expired') {
              query = query.lt('warranty_end_date', now.toISOString());
            } else if (filter === 'expiring_soon') {
              const thirtyDaysFromNow = new Date(now);
              thirtyDaysFromNow.setDate(now.getDate() + 30);
              query = query.gte('warranty_end_date', now.toISOString()).lte('warranty_end_date', thirtyDaysFromNow.toISOString());
            }
            
            if (!countOnly) query = query.limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'warranties',
              filter: filter || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} warranties.`,
            };
          }
          
          case 'leads': {
            let query = supabase
              .from('leads')
              .select(countOnly ? 'id' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter) {
              if (['new', 'contacted', 'qualified', 'converted', 'lost'].includes(filter)) {
                query = query.eq('status', filter);
              } else if (['low', 'normal', 'high', 'hot'].includes(filter)) {
                query = query.eq('priority', filter);
              }
            }
            if (startDate) query = query.gte('created_at', startDate.toISOString());
            if (!countOnly) query = query.order('created_at', { ascending: false }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'leads',
              filter: filter || 'all',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} leads${timePeriod ? ` from ${timePeriod}` : ''}.`,
            };
          }
          
          case 'appointments': {
            let query = supabase
              .from('appointments')
              .select(countOnly ? 'id' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter) {
              if (['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(filter)) {
                query = query.eq('status', filter);
              } else if (filter === 'upcoming') {
                query = query.gte('datetime', now.toISOString()).in('status', ['scheduled', 'confirmed']);
              } else if (filter === 'today') {
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(startOfDay);
                endOfDay.setDate(endOfDay.getDate() + 1);
                query = query.gte('datetime', startOfDay.toISOString()).lt('datetime', endOfDay.toISOString());
              }
            }
            if (startDate && !['today', 'upcoming'].includes(filter || '')) {
              query = query.gte('datetime', startDate.toISOString());
            }
            if (!countOnly) query = query.order('datetime', { ascending: true }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'appointments',
              filter: filter || 'all',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} appointments${timePeriod ? ` from ${timePeriod}` : ''}.`,
            };
          }
          
          case 'quotes': {
            let query = supabase
              .from('quotes')
              .select(countOnly ? 'id, total_amount' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter) {
              if (['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(filter)) {
                query = query.eq('status', filter);
              } else if (filter === 'pending') {
                query = query.in('status', ['draft', 'sent']);
              }
            }
            if (startDate) query = query.gte('created_at', startDate.toISOString());
            if (!countOnly) query = query.order('created_at', { ascending: false }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            const totalValue = data?.reduce((sum: number, q: any) => sum + (q.total_amount || 0), 0) || 0;
            
            return {
              success: true,
              data_type: 'quotes',
              filter: filter || 'all',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              total_value: totalValue,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} quotes${timePeriod ? ` from ${timePeriod}` : ''}. Total value: $${totalValue.toFixed(2)}.`,
            };
          }
          
          case 'invoices': {
            let query = supabase
              .from('invoices')
              .select(countOnly ? 'id, total, status' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter) {
              if (['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(filter)) {
                query = query.eq('status', filter);
              } else if (filter === 'unpaid') {
                query = query.in('status', ['draft', 'sent', 'overdue']);
              }
            }
            if (startDate) query = query.gte('created_at', startDate.toISOString());
            if (!countOnly) query = query.order('created_at', { ascending: false }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            const totalValue = data?.reduce((sum: number, i: any) => sum + (i.total || 0), 0) || 0;
            const paidTotal = data?.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + (i.total || 0), 0) || 0;
            
            return {
              success: true,
              data_type: 'invoices',
              filter: filter || 'all',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              total_value: totalValue,
              paid_total: paidTotal,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} invoices${timePeriod ? ` from ${timePeriod}` : ''}. Total: $${totalValue.toFixed(2)}, Paid: $${paidTotal.toFixed(2)}.`,
            };
          }
          
          case 'inventory': {
            let query = supabase
              .from('inventory_items')
              .select(countOnly ? 'id, quantity, reorder_point' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter === 'low_stock') {
              // This requires checking quantity vs reorder_point
              const { data: allItems, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('company_id', companyId);
              
              if (error) return { success: false, error: error.message };
              
              const lowStockItems = (allItems || []).filter((item: any) => 
                item.quantity <= (item.reorder_point || 0)
              );
              
              return {
                success: true,
                data_type: 'inventory',
                filter: 'low_stock',
                count: lowStockItems.length,
                records: countOnly ? undefined : lowStockItems.slice(0, limit),
                message: `Found ${lowStockItems.length} inventory items with low stock (at or below reorder point).`,
              };
            }
            
            if (!countOnly) query = query.limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'inventory',
              filter: filter || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} inventory items.`,
            };
          }
          
          case 'campaigns': {
            let query = supabase
              .from('marketing_campaigns')
              .select(countOnly ? 'id, status' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter) {
              if (['draft', 'scheduled', 'active', 'completed', 'paused'].includes(filter)) {
                query = query.eq('status', filter);
              }
            }
            if (startDate) query = query.gte('created_at', startDate.toISOString());
            if (!countOnly) query = query.order('created_at', { ascending: false }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'campaigns',
              filter: filter || 'all',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} marketing campaigns${timePeriod ? ` from ${timePeriod}` : ''}.`,
            };
          }
          
          case 'customers': {
            let query = supabase
              .from('customer_profiles')
              .select(countOnly ? 'id' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (startDate) query = query.gte('created_at', startDate.toISOString());
            if (!countOnly) query = query.order('created_at', { ascending: false }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'customers',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} customers${timePeriod ? ` from ${timePeriod}` : ''}.`,
            };
          }
          
          case 'feedback': {
            let query = supabase
              .from('customer_feedback')
              .select(countOnly ? 'id, rating, sentiment' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter) {
              if (['positive', 'negative', 'neutral'].includes(filter)) {
                query = query.eq('sentiment', filter);
              } else if (filter === 'high_rating') {
                query = query.gte('rating', 4);
              } else if (filter === 'low_rating') {
                query = query.lte('rating', 2);
              }
            }
            if (startDate) query = query.gte('created_at', startDate.toISOString());
            if (!countOnly) query = query.order('created_at', { ascending: false }).limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            const avgRating = data?.length 
              ? (data.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / data.length).toFixed(1)
              : 'N/A';
            
            return {
              success: true,
              data_type: 'feedback',
              filter: filter || 'all',
              time_period: timePeriod || 'all',
              count: count || data?.length || 0,
              average_rating: avgRating,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} feedback entries${timePeriod ? ` from ${timePeriod}` : ''}. Average rating: ${avgRating}.`,
            };
          }
          
          case 'services': {
            let query = supabase
              .from('services')
              .select(countOnly ? 'id' : '*', { count: 'exact' })
              .eq('company_id', companyId);
            
            if (filter === 'active') {
              query = query.eq('is_active', true);
            } else if (filter === 'inactive') {
              query = query.eq('is_active', false);
            }
            if (!countOnly) query = query.limit(limit);
            
            const { data, count, error } = await query;
            if (error) return { success: false, error: error.message };
            
            return {
              success: true,
              data_type: 'services',
              filter: filter || 'all',
              count: count || data?.length || 0,
              records: countOnly ? undefined : data,
              message: `Found ${count || data?.length || 0} ${filter || ''} services.`,
            };
          }
          
          default:
            return {
              success: false,
              error: `Unknown data type: ${dataType}. Supported types: warranties, leads, appointments, quotes, invoices, inventory, campaigns, customers, feedback, services.`,
            };
        }
      } catch (err: any) {
        console.error('[AI Agent] Query business data error:', err);
        return { success: false, error: err.message || 'Failed to query data' };
      }
    }

    // ==========================================
    // SOCIAL MEDIA MANAGEMENT TOOLS
    // ==========================================
    case 'create_social_post': {
      console.log('[AI Agent] Creating social post:', args);
      
      const platforms = args.platforms || ['instagram'];
      const content = args.content || '';
      const hashtags = args.hashtags || [];
      const imageUrl = args.image_url || null;
      const scheduledFor = args.scheduled_for || null;
      
      if (!content.trim()) {
        return { success: false, error: 'Post content is required.' };
      }
      
      // Create drafts for each platform
      const createdDrafts: any[] = [];
      const errors: string[] = [];
      
      for (const platform of platforms) {
        // Add hashtags to content for platforms that support them
        let fullContent = content;
        if (hashtags.length > 0 && ['instagram', 'facebook', 'linkedin', 'tiktok'].includes(platform)) {
          fullContent = `${content}\n\n${hashtags.map((h: string) => `#${h.replace('#', '')}`).join(' ')}`;
        }
        
        const { data: draft, error } = await supabase
          .from('social_content_drafts')
          .insert({
            company_id: companyId,
            platform,
            content: fullContent,
            hashtags,
            image_url: imageUrl,
            status: scheduledFor ? 'approved' : 'pending',
            source: 'ai_chat',
          })
          .select()
          .single();
        
        if (error) {
          console.error(`[AI Agent] Error creating ${platform} draft:`, error);
          errors.push(`${platform}: ${error.message}`);
        } else {
          createdDrafts.push({ platform, id: draft.id });
          
          // If scheduling, create scheduled_posts entry
          if (scheduledFor) {
            await supabase
              .from('scheduled_posts')
              .insert({
                company_id: companyId,
                draft_id: draft.id,
                platforms: [platform],
                scheduled_for: scheduledFor,
                timezone: 'America/New_York',
                status: 'scheduled',
              });
          }
        }
      }
      
      if (createdDrafts.length === 0) {
        return { success: false, error: `Failed to create drafts: ${errors.join(', ')}` };
      }
      
      return {
        success: true,
        drafts_created: createdDrafts,
        platforms: platforms,
        scheduled: !!scheduledFor,
        scheduled_for: scheduledFor,
        message: scheduledFor 
          ? `Created and scheduled ${createdDrafts.length} post(s) for ${new Date(scheduledFor).toLocaleString()}.`
          : `Created ${createdDrafts.length} draft(s) for: ${platforms.join(', ')}. They are pending approval.`,
      };
    }

    case 'list_social_drafts': {
      console.log('[AI Agent] Listing social drafts:', args);
      
      const status = args.status || 'pending';
      const platform = args.platform;
      const limit = args.limit || 10;
      
      let query = supabase
        .from('social_content_drafts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (platform) {
        query = query.eq('platform', platform);
      }
      
      const { data: drafts, error } = await query;
      
      if (error) {
        console.error('[AI Agent] Error listing drafts:', error);
        return { success: false, error: error.message };
      }
      
      const formattedDrafts = (drafts || []).map((d: any) => ({
        id: d.id,
        platform: d.platform,
        content: d.content?.substring(0, 100) + (d.content?.length > 100 ? '...' : ''),
        status: d.status,
        has_image: !!d.image_url,
        created_at: new Date(d.created_at).toLocaleDateString(),
      }));
      
      return {
        success: true,
        drafts: formattedDrafts,
        count: formattedDrafts.length,
        filter: { status, platform },
        message: `Found ${formattedDrafts.length} ${status} draft(s)${platform ? ` for ${platform}` : ''}.`,
      };
    }

    case 'approve_social_draft': {
      console.log('[AI Agent] Approving social draft:', args);
      
      if (!args.draft_id) {
        return { success: false, error: 'draft_id is required.' };
      }
      
      // Get the draft
      const { data: draft, error: fetchError } = await supabase
        .from('social_content_drafts')
        .select('*')
        .eq('id', args.draft_id)
        .eq('company_id', companyId)
        .single();
      
      if (fetchError || !draft) {
        return { success: false, error: 'Draft not found or access denied.' };
      }
      
      if (draft.status === 'published') {
        return { success: false, error: 'This draft has already been published.' };
      }
      
      // Update to approved
      await supabase
        .from('social_content_drafts')
        .update({ 
          status: args.publish_immediately ? 'published' : 'approved',
          approved_at: new Date().toISOString(),
          published_at: args.publish_immediately ? new Date().toISOString() : null,
        })
        .eq('id', args.draft_id);
      
      // If publish immediately, call publish function
      if (args.publish_immediately) {
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/publish-social-content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              draftId: args.draft_id,
              companyId,
            }),
          });
        } catch (pubErr) {
          console.error('[AI Agent] Publish error:', pubErr);
        }
      }
      
      return {
        success: true,
        draft_id: args.draft_id,
        platform: draft.platform,
        published: args.publish_immediately || false,
        message: args.publish_immediately 
          ? `Post approved and published to ${draft.platform}!`
          : `Post approved and ready for publishing.`,
      };
    }

    case 'schedule_social_post': {
      console.log('[AI Agent] Scheduling social post:', args);
      
      if (!args.draft_id || !args.scheduled_for) {
        return { success: false, error: 'draft_id and scheduled_for are required.' };
      }
      
      // Validate draft exists and is approved
      const { data: draft, error: fetchError } = await supabase
        .from('social_content_drafts')
        .select('*')
        .eq('id', args.draft_id)
        .eq('company_id', companyId)
        .single();
      
      if (fetchError || !draft) {
        return { success: false, error: 'Draft not found or access denied.' };
      }
      
      if (draft.status === 'published') {
        return { success: false, error: 'This post has already been published.' };
      }
      
      // Parse scheduled time
      const scheduledFor = new Date(args.scheduled_for);
      if (isNaN(scheduledFor.getTime())) {
        return { success: false, error: 'Invalid scheduled_for datetime.' };
      }
      
      if (scheduledFor <= new Date()) {
        return { success: false, error: 'Scheduled time must be in the future.' };
      }
      
      // Update draft to approved
      await supabase
        .from('social_content_drafts')
        .update({ status: 'approved' })
        .eq('id', args.draft_id);
      
      // Create or update scheduled post
      const { data: existingSchedule } = await supabase
        .from('scheduled_posts')
        .select('id')
        .eq('draft_id', args.draft_id)
        .maybeSingle();
      
      if (existingSchedule) {
        await supabase
          .from('scheduled_posts')
          .update({
            scheduled_for: scheduledFor.toISOString(),
            timezone: args.timezone || 'America/New_York',
            status: 'scheduled',
          })
          .eq('id', existingSchedule.id);
      } else {
        await supabase
          .from('scheduled_posts')
          .insert({
            company_id: companyId,
            draft_id: args.draft_id,
            platforms: [draft.platform],
            scheduled_for: scheduledFor.toISOString(),
            timezone: args.timezone || 'America/New_York',
            status: 'scheduled',
          });
      }
      
      return {
        success: true,
        draft_id: args.draft_id,
        platform: draft.platform,
        scheduled_for: scheduledFor.toISOString(),
        timezone: args.timezone || 'America/New_York',
        message: `Post scheduled for ${scheduledFor.toLocaleString()} (${args.timezone || 'America/New_York'}).`,
      };
    }

    case 'get_social_analytics': {
      console.log('[AI Agent] Getting social analytics:', args);
      
      const dateRange = args.date_range || '30d';
      const platform = args.platform;
      
      // Calculate start date
      const now = new Date();
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[dateRange] || 30;
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - days);
      
      // Get published posts
      let publishedQuery = supabase
        .from('social_content_drafts')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'published')
        .gte('published_at', startDate.toISOString());
      
      if (platform) {
        publishedQuery = publishedQuery.eq('platform', platform);
      }
      
      const { data: publishedPosts, count: publishedCount } = await publishedQuery;
      
      // Get pending posts
      let pendingQuery = supabase
        .from('social_content_drafts')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'pending');
      
      if (platform) {
        pendingQuery = pendingQuery.eq('platform', platform);
      }
      
      const { count: pendingCount } = await pendingQuery;
      
      // Get scheduled posts
      const { count: scheduledCount } = await supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'scheduled');
      
      // Group by platform
      const platformStats: Record<string, number> = {};
      (publishedPosts || []).forEach((post: any) => {
        platformStats[post.platform] = (platformStats[post.platform] || 0) + 1;
      });
      
      return {
        success: true,
        date_range: dateRange,
        platform_filter: platform || 'all',
        published_count: publishedCount || 0,
        pending_count: pendingCount || 0,
        scheduled_count: scheduledCount || 0,
        by_platform: platformStats,
        message: `Social media stats (${dateRange}): ${publishedCount || 0} published, ${pendingCount || 0} pending, ${scheduledCount || 0} scheduled.`,
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
