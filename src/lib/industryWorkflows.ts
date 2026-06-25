import { ArrowRightLeft, ClipboardList, Receipt, Home, PenTool, Phone, Wrench, Map, Link2, MessageSquare, Star } from 'lucide-react';
import type { WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import type { IndustryPack } from '@/hooks/useIndustryPack';

/** Substitute {{job}} / {{customer}} / {{appointment}} using pack terminology. */
function applyTerminology(input: string, pack: IndustryPack): string {
  const term = pack.terminology ?? {};
  return input
    .replace(/\{\{job\}\}/g, term.job ?? 'job')
    .replace(/\{\{jobs\}\}/g, (term.job ?? 'job') + 's')
    .replace(/\{\{customer\}\}/g, term.customer ?? 'customer')
    .replace(/\{\{customers\}\}/g, (term.customer ?? 'customer') + 's')
    .replace(/\{\{appointment\}\}/g, term.appointment ?? 'appointment');
}

const CLUSTER_WORKFLOWS: Record<IndustryPack['cluster'], WorkflowChain[]> = {
  trades: [
    {
      id: 'lead-to-invoice', label: 'Lead → Invoice',
      description: 'Full job lifecycle from new lead to paid invoice',
      icon: ArrowRightLeft, steps: ['Lead', 'Quote', 'Schedule', 'Invoice'],
      command: 'Run the full job flow: create a quote from my latest lead, schedule the appointment, and generate an invoice when done',
      actions: [
        {
          agent_id: 'outreach', action_type: 'draft_sms', channel: 'sms', label: 'Quote SMS to lead',
          risk_tier: 'low', confidence: 0.9, est_value_usd: 0,
          payload: { to: '{{lead_phone}}', message: 'Hi {{lead_name}}, this is {{company_name}}. Thanks for reaching out — here is a quick quote for the work. Reply YES and we will get you on the schedule.' },
        },
        {
          agent_id: 'scheduler', action_type: 'create_appointment', channel: 'appointment', label: 'On-site visit',
          risk_tier: 'low', confidence: 0.82, est_value_usd: 0,
          payload: { customer_name: '{{customer_name}}', service_type: 'On-site visit', notes: 'Auto-scheduled from Lead → Invoice workflow.' },
        },
        {
          agent_id: 'billing', action_type: 'draft_invoice', channel: 'invoice', label: 'Draft invoice',
          risk_tier: 'medium', confidence: 0.78, est_value_usd: 350,
          payload: { customer_name: '{{customer_name}}', total: 350, notes: 'Draft from Lead → Invoice workflow — adjust before sending.' },
        },
      ],
    },
    {
      id: 'quote-to-job', label: 'Quote → Job',
      description: 'Convert an approved quote into a scheduled job',
      icon: ClipboardList, steps: ['Quote', 'Approve', 'Schedule', 'Assign'],
      command: 'Take my most recent pending quote, approve it, schedule the job, and assign the best available technician',
      actions: [
        {
          agent_id: 'scheduler', action_type: 'create_appointment', channel: 'appointment', label: 'Job appointment',
          risk_tier: 'low', confidence: 0.85,
          payload: { customer_name: '{{customer_name}}', service_type: 'Scheduled job', notes: 'Auto-scheduled from approved quote.' },
        },
        {
          agent_id: 'outreach', action_type: 'draft_sms', channel: 'sms', label: 'Confirmation SMS',
          risk_tier: 'low', confidence: 0.92,
          payload: { to: '{{lead_phone}}', message: 'Hi {{customer_name}}, your job with {{company_name}} is scheduled for {{appointment_time}}. Reply C to confirm.' },
        },
      ],
    },
    {
      id: 'invoice-chase', label: 'Invoice Follow-Up',
      description: 'Chase overdue invoices with smart reminders',
      icon: Receipt, steps: ['Find Overdue', 'Draft Reminder', 'Send'],
      command: 'Find all overdue invoices, draft friendly payment reminders for each, and show them for my approval before sending',
      actions: [
        {
          agent_id: 'billing', action_type: 'draft_sms', channel: 'sms', label: 'Payment reminder SMS',
          risk_tier: 'low', confidence: 0.88,
          payload: { to: '{{lead_phone}}', message: 'Hi {{customer_name}}, quick reminder from {{company_name}} — your invoice is past due. Pay here when convenient. Thank you!' },
        },
        {
          agent_id: 'billing', action_type: 'draft_email', channel: 'email', label: 'Payment reminder email',
          risk_tier: 'low', confidence: 0.85,
          payload: {
            to: '{{lead_email}}',
            from_name: '{{from_name}}',
            from_email: '{{from_email}}',
            reply_to: '{{reply_to}}',
            subject: 'Friendly payment reminder from {{company_name}}',
            cta_url: '{{invoice_url}}',
            cta_label: 'View & pay invoice',
            body: 'Hi {{customer_name}},\n\nFriendly reminder that your invoice is past due. You can review and pay it online in one click.\n\nQuestions? Just reply to this email.\n\nThanks,\n{{company_name}}',
          },
        },
      ],
    },
  ],

  outdoor: [
    {
      id: 'route-service-invoice', label: 'Route → Service → Invoice',
      description: 'Complete a recurring route and invoice each stop',
      icon: Map, steps: ['Route', 'Service', 'Photos', 'Invoice'],
      command: 'Run today’s recurring route: confirm completion at each stop, attach service photos, and generate invoices',
    },
    {
      id: 'quote-to-recurring', label: 'Quote → Recurring Plan',
      description: 'Turn a one-time quote into a recurring service plan',
      icon: ClipboardList, steps: ['Quote', 'Approve', 'Recurring', 'Schedule'],
      command: 'Take my latest approved quote and convert it into a recurring service plan with scheduled visits',
    },
    {
      id: 'seasonal-campaign', label: 'Seasonal Campaign',
      description: 'Launch a seasonal upsell campaign to repeat {{customers}}',
      icon: PenTool, steps: ['Segment', 'Draft', 'Send', 'Track'],
      command: 'Build a seasonal campaign: segment recurring customers due for the next service, draft the offer, and send it for approval',
    },
  ],

  repair: [
    {
      id: 'intake-diagnose-quote', label: 'Intake → Diagnose → Quote',
      description: 'Take in a {{job}}, diagnose, and send a quote',
      icon: ClipboardList, steps: ['Intake', 'Diagnose', 'Quote'],
      command: 'Run the repair intake flow: log a new ticket, draft a diagnostic checklist, and send a quote for approval',
    },
    {
      id: 'parts-repair-invoice', label: 'Parts → Repair → Invoice',
      description: 'Order parts, complete the repair, and invoice the {{customer}}',
      icon: Wrench, steps: ['Parts', 'Repair', 'QC', 'Invoice'],
      command: 'For my latest approved repair quote: order the needed parts, schedule the repair, and generate the invoice when complete',
    },
    {
      id: 'customer-update-loop', label: 'Customer Update Loop',
      description: 'Keep {{customers}} informed at each repair stage',
      icon: Phone, steps: ['Status', 'Notify', 'Confirm'],
      command: 'For all open repair tickets, draft status update messages for each customer and send them for my approval',
    },
  ],

  booking: [
    {
      id: 'lead-to-booking', label: 'Lead → {{appointment}} → Close',
      description: 'Convert a new lead into a booked {{appointment}} and close the deal',
      icon: Home, steps: ['Lead', 'Schedule', 'Follow-Up', 'Close'],
      command: 'Take my newest lead: book the next available appointment, send a confirmation, and queue follow-up messages until close',
      actions: [
        {
          agent_id: 'scheduler', action_type: 'create_appointment', channel: 'appointment', label: 'Book appointment',
          risk_tier: 'low', confidence: 0.87,
          payload: { customer_name: '{{customer_name}}', service_type: 'Consultation', notes: 'Auto-booked from new lead.' },
        },
        {
          agent_id: 'outreach', action_type: 'draft_sms', channel: 'sms', label: 'Confirmation SMS',
          risk_tier: 'low', confidence: 0.92,
          payload: { to: '{{lead_phone}}', message: 'Hi {{customer_name}}, you are booked with {{company_name}} for {{appointment_time}}. Reply C to confirm.' },
        },
        {
          agent_id: 'outreach', action_type: 'draft_email', channel: 'email', label: 'Welcome email',
          risk_tier: 'low', confidence: 0.85,
          payload: {
            to: '{{lead_email}}',
            from_name: '{{from_name}}',
            from_email: '{{from_email}}',
            reply_to: '{{reply_to}}',
            subject: 'Welcome to {{company_name}}',
            cta_url: '{{company_portal_url}}',
            cta_label: 'Open my customer portal',
            body: 'Hi {{customer_name}},\n\nThanks for booking with us — we are looking forward to seeing you at {{appointment_time}}.\n\nYou can manage your appointment, see updates, and message us anytime from your portal.\n\n— {{company_name}}',
          },
        },
      ],
    },
    {
      id: 'appointment-reminders', label: '{{appointment}} Reminders',
      description: 'Send confirmations and reminders for upcoming {{appointment}}s',
      icon: Phone, steps: ['Pull Upcoming', 'Draft Reminder', 'Send'],
      command: 'Find all upcoming appointments in the next 48 hours, draft reminder messages, and send them for my approval',
      actions: [
        {
          agent_id: 'outreach', action_type: 'draft_sms', channel: 'sms', label: '24h reminder SMS',
          risk_tier: 'low', confidence: 0.95,
          payload: { to: '{{lead_phone}}', message: 'Reminder from {{company_name}}: your appointment is {{appointment_time}}. Reply C to confirm or R to reschedule.' },
        },
      ],
    },
    {
      id: 'invoice-followup', label: 'Invoice Follow-Up',
      description: 'Chase outstanding invoices with smart reminders',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding invoices, draft friendly reminders, and show them for my approval',
      actions: [
        {
          agent_id: 'billing', action_type: 'draft_sms', channel: 'sms', label: 'Payment reminder SMS',
          risk_tier: 'low', confidence: 0.88,
          payload: { to: '{{lead_phone}}', message: 'Hi {{customer_name}}, a quick reminder from {{company_name}} — your invoice is outstanding. Reply if you need help.' },
        },
      ],
    },
  ],

  home_health: [
    {
      id: 'referral-to-visit', label: 'Referral → Visit → Plan of Care',
      description: 'Turn a new referral into a scheduled visit and start a plan of care',
      icon: Home, steps: ['Referral', 'Verify Insurance', 'Schedule Visit', 'Open POC'],
      command: 'Take my newest referral: verify insurance, schedule the first visit, and open a plan of care',
    },
    {
      id: 'visit-route', label: 'Build Today\u2019s Visit Route',
      description: 'Sequence patient visits for the day and notify therapists',
      icon: Phone, steps: ['Pull Visits', 'Optimize Route', 'Notify Therapists'],
      command: 'Build today\u2019s optimized visit route and send each therapist their stops',
    },
    {
      id: 'statement-followup', label: 'Statement / Copay Follow-Up',
      description: 'Chase outstanding patient balances after insurance adjudication',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding patient statements, draft compassionate reminders, and show them for my approval',
    },
  ],
};

/**
 * Per-industry overrides. Keyed by `industry_id`. When present, completely
 * replaces the cluster default (so e.g. restaurants don't see real-estate
 * listing / commission workflows from the shared `booking` cluster).
 */
const INDUSTRY_WORKFLOWS: Partial<Record<string, WorkflowChain[]>> = {
  real_estate: [
    {
      id: 'lead-to-showing', label: 'Lead → Showing → Close',
      description: 'Convert a new lead into a showing and close the deal',
      icon: Home, steps: ['Lead', 'Schedule', 'Follow-Up', 'Close'],
      command: 'Take my newest lead: book the next available showing, send a confirmation, and queue follow-up messages until close',
    },
    {
      id: 'listing-to-marketing', label: 'Listing → Marketing → Open House',
      description: 'Promote a new listing and book the open house',
      icon: PenTool, steps: ['Listing', 'Posts', 'Book Open House'],
      command: 'For my newest listing, draft social posts and email blasts, then schedule the open house and capture RSVPs',
    },
    {
      id: 'commission-followup', label: 'Invoice / Commission Follow-Up',
      description: 'Chase outstanding invoices and commissions',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding invoices and pending commissions, draft friendly reminders, and show them for my approval',
    },
  ],

  saas_platform: [
    {
      id: 'trial-to-activation', label: 'Trial → Activation → Upgrade',
      description: 'Move new trial signups toward activation and a paid upgrade',
      icon: ArrowRightLeft, steps: ['Trial', 'Onboard', 'Activate', 'Upgrade'],
      command: 'For my newest trial signups, send the onboarding sequence, track activation milestones, and queue upgrade offers when ready',
      actions: [
        {
          agent_id: 'outreach', action_type: 'draft_email', channel: 'email', label: 'Onboarding email',
          risk_tier: 'low', confidence: 0.9,
          payload: {
            to: '{{lead_email}}',
            from_name: '{{from_name}}',
            from_email: '{{from_email}}',
            reply_to: '{{reply_to}}',
            subject: 'Get started with {{company_name}}',
            cta_url: '{{activation_url}}',
            cta_label: 'Activate my account',
            body: 'Hi {{customer_name}},\n\nWelcome to your 60-day Live Demo with {{company_name}}.\n\nTo finish activation:\n  1. Sign in: {{login_url}}\n  2. Connect your billing: {{billing_url}}\n  3. Walk through onboarding: {{onboarding_url}}\n\nClick the button below to jump straight to activation & billing.\n\nP.S. A few features require your own SignalWire, ElevenLabs, Resend and Stripe accounts (each billed directly by the provider). Our concierge will help set them up.\n\n— {{company_name}}',
          },
        },
        {
          agent_id: 'outreach', action_type: 'draft_sms', channel: 'sms', label: 'Day-2 nudge SMS',
          risk_tier: 'low', confidence: 0.85,
          payload: {
            to: '{{lead_phone}}',
            from: '{{from_name}}',
            from_number: '{{from_number}}',
            message: 'Hi {{customer_name}}, this is {{company_name}}. Need a hand activating your Live Demo? Sign in here: {{login_url}} or reply HELP. Reply STOP to opt out.',
          },
        },
        {
          agent_id: 'billing', action_type: 'draft_email', channel: 'email', label: 'Upgrade offer',
          risk_tier: 'medium', confidence: 0.78, est_value_usd: 99,
          payload: {
            to: '{{lead_email}}',
            from_name: '{{from_name}}',
            from_email: '{{from_email}}',
            reply_to: '{{reply_to}}',
            subject: 'Ready to upgrade {{company_name}}?',
            cta_url: '{{billing_url}}',
            cta_label: 'Choose my plan',
            body: 'Hi {{customer_name}},\n\nGreat news — you hit your activation milestones during your Live Demo. Here is a tailored plan for you.\n\nReview your options and upgrade in one click.\n\n— {{company_name}}',
          },
        },
      ],
    },
    {
      id: 'inbound-demo', label: 'Inbound → Demo → Follow-Up',
      description: 'Capture an inbound lead, book a demo, and run the follow-up',
      icon: Phone, steps: ['Capture', 'Book Demo', 'Follow-Up'],
      command: 'Take my newest inbound lead, book a product demo on my calendar, and queue a personalized follow-up sequence',
      actions: [
        {
          agent_id: 'scheduler', action_type: 'create_appointment', channel: 'appointment', label: 'Product demo',
          risk_tier: 'low', confidence: 0.86,
          payload: { customer_name: '{{customer_name}}', service_type: 'Product demo', notes: 'Auto-booked from inbound lead.' },
        },
        {
          agent_id: 'outreach', action_type: 'draft_email', channel: 'email', label: 'Demo confirmation',
          risk_tier: 'low', confidence: 0.92,
          payload: {
            to: '{{lead_email}}',
            from_name: '{{from_name}}',
            from_email: '{{from_email}}',
            reply_to: '{{reply_to}}',
            subject: 'Your demo with {{company_name}} is confirmed',
            cta_url: '{{dashboard_url}}',
            cta_label: 'Open my dashboard',
            body: 'Hi {{customer_name}},\n\nYour demo with {{company_name}} is confirmed for {{appointment_time}}.\n\nNeed to reschedule? Reply to this email and we will sort it out.\n\nTalk soon,\n{{company_name}}',
          },
        },
      ],
    },
    {
      id: 'renewal-churn-save', label: 'Renewal / Churn Save',
      description: 'Spot at-risk accounts and run a save play before they churn',
      icon: Star, steps: ['Score Risk', 'Draft Outreach', 'Offer'],
      command: 'Identify at-risk customers approaching renewal, draft a save-play outreach for each, and show me for approval',
      actions: [
        {
          agent_id: 'retention', action_type: 'draft_email', channel: 'email', label: 'Save-play email',
          risk_tier: 'medium', confidence: 0.8, est_value_usd: 200,
          payload: {
            to: '{{lead_email}}',
            from_name: '{{from_name}}',
            from_email: '{{from_email}}',
            reply_to: '{{reply_to}}',
            subject: 'A note from {{company_name}}',
            cta_url: '{{billing_url}}',
            cta_label: 'Manage my plan',
            body: 'Hi {{customer_name}},\n\nWe noticed your usage has dipped recently. Here is a tailored offer to keep you on board — and a 1-click way to manage your plan if anything needs adjusting.\n\n— {{company_name}}',
          },
        },
        {
          agent_id: 'retention', action_type: 'draft_sms', channel: 'sms', label: 'Save-play SMS',
          risk_tier: 'medium', confidence: 0.78,
          payload: {
            to: '{{lead_phone}}',
            from: '{{from_name}}',
            from_number: '{{from_number}}',
            message: 'Hi {{customer_name}}, this is {{company_name}}. Just checking in before your renewal — anything we can help with? Manage your plan: {{billing_url}}. Reply STOP to opt out.',
          },
        },
      ],
    },
  ],

  salon: [
    {
      id: 'lead-to-appointment', label: 'Lead → Appointment → Rebook',
      description: 'Convert a new lead into a booked appointment and queue rebook',
      icon: Home, steps: ['Lead', 'Book', 'Confirm', 'Rebook'],
      command: 'Take my newest lead: book the next available appointment, send confirmation, and queue a rebook reminder',
    },
    {
      id: 'appointment-reminders', label: 'Appointment Reminders',
      description: 'Send 48-hour and same-day reminders to reduce no-shows',
      icon: Phone, steps: ['Pull Upcoming', 'Draft', 'Send'],
      command: 'Find all appointments in the next 48 hours, draft reminder texts, and send them for approval',
    },
    {
      id: 'review-pulse', label: 'Review Pulse',
      description: 'Reply to new reviews and request more from happy clients',
      icon: Star, steps: ['Pull Reviews', 'Draft Replies', 'Request More'],
      command: 'Pull the latest reviews, draft replies, and text recent happy clients a review request link',
    },
  ],

  beauty_wellness: [
    {
      id: 'lead-to-appointment', label: 'Lead → Appointment → Rebook',
      description: 'Convert a new lead into a booked session and queue rebook',
      icon: Home, steps: ['Lead', 'Book', 'Confirm', 'Rebook'],
      command: 'Take my newest lead: book the next available session, send confirmation, and queue a rebook reminder',
    },
    {
      id: 'appointment-reminders', label: 'Session Reminders',
      description: 'Send 48-hour and same-day reminders to reduce no-shows',
      icon: Phone, steps: ['Pull Upcoming', 'Draft', 'Send'],
      command: 'Find all sessions in the next 48 hours, draft reminder texts, and send them for approval',
    },
    {
      id: 'review-pulse', label: 'Review Pulse',
      description: 'Reply to new reviews and request more from happy clients',
      icon: Star, steps: ['Pull Reviews', 'Draft Replies', 'Request More'],
      command: 'Pull the latest reviews, draft replies, and text happy clients a review request link',
    },
  ],

  fitness: [
    {
      id: 'lead-to-class', label: 'Lead → Class → Membership',
      description: 'Convert a lead into a booked class and a membership',
      icon: Home, steps: ['Lead', 'Book Class', 'Follow-Up', 'Membership'],
      command: 'Take my newest lead: book a trial class, send confirmation, and queue follow-up until they sign up for a membership',
    },
    {
      id: 'class-reminders', label: 'Class Reminders',
      description: 'Send class reminders to reduce no-shows',
      icon: Phone, steps: ['Pull Upcoming', 'Draft', 'Send'],
      command: 'Find all classes in the next 24 hours, draft reminder messages, and send for approval',
    },
    {
      id: 'win-back', label: 'Win-Back Inactive Members',
      description: 'Re-engage members who have stopped showing up',
      icon: Star, steps: ['Find Inactive', 'Draft Offer', 'Send'],
      command: 'Find members who have not visited in 30+ days, draft a personalized win-back offer, and send for approval',
    },
  ],

  professional: [
    {
      id: 'lead-to-consult', label: 'Lead → Consult → Engagement',
      description: 'Move a lead from inquiry to a paid engagement',
      icon: Home, steps: ['Lead', 'Consult', 'Proposal', 'Engagement'],
      command: 'Take my newest lead, book a consult, draft a proposal, and queue follow-up until engagement starts',
    },
    {
      id: 'invoice-followup', label: 'Invoice Follow-Up',
      description: 'Chase overdue invoices with smart reminders',
      icon: Receipt, steps: ['Find Overdue', 'Draft', 'Send'],
      command: 'Find all overdue invoices, draft friendly payment reminders, and show them for my approval',
    },
    {
      id: 'consult-reminders', label: 'Consult Reminders',
      description: 'Send reminders for upcoming consults',
      icon: Phone, steps: ['Pull Upcoming', 'Draft', 'Send'],
      command: 'Find all consults scheduled in the next 48 hours, draft reminders, and send for approval',
    },
  ],

  personal_assistant: [
    {
      id: 'lead-to-engagement', label: 'Lead → Intake → Engagement',
      description: 'Onboard a new client from inquiry to active engagement',
      icon: Home, steps: ['Lead', 'Intake', 'Schedule', 'Engagement'],
      command: 'Take my newest lead, complete intake, schedule the first session, and queue follow-up',
    },
    {
      id: 'appointment-reminders', label: 'Appointment Reminders',
      description: 'Send reminders for upcoming client appointments',
      icon: Phone, steps: ['Pull Upcoming', 'Draft', 'Send'],
      command: 'Find all appointments in the next 48 hours, draft reminders, and send for approval',
    },
    {
      id: 'invoice-followup', label: 'Invoice Follow-Up',
      description: 'Chase outstanding invoices',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding invoices, draft friendly reminders, and show for approval',
    },
  ],

  restaurants: [
    {
      id: 'smart-link-send', label: 'Inbound → Smart Link',
      description: 'Text guests a link to your booking page, menu, hours, or catering form',
      icon: Link2, steps: ['Detect Intent', 'Pick Link', 'Send SMS'],
      command: 'For the latest inbound call or chat, detect what the guest wants and text them the right Smart Link (booking, menu, hours, or catering)',
    },
    {
      id: 'missed-call-recovery', label: 'Missed Call Recovery',
      description: 'Auto-text guests who hung up before reaching us',
      icon: Phone, steps: ['Find Missed', 'Draft SMS', 'Send Smart Link'],
      command: 'Find recent missed calls and text each guest a friendly recovery message with our booking and menu Smart Links',
    },
    {
      id: 'review-pulse', label: 'Review Pulse',
      description: 'Reply to new Google reviews and request more from happy guests',
      icon: Star, steps: ['Pull Reviews', 'Draft Replies', 'Request More'],
      command: 'Pull the latest Google reviews, draft replies for each, and text recent happy guests a review request link',
    },
    {
      id: 'catering-inquiry', label: 'Catering / Private Event Inquiry',
      description: 'Capture catering and private-event leads from voice & chat',
      icon: MessageSquare, steps: ['Capture Lead', 'Send Catering Link', 'Follow-Up'],
      command: 'For new catering or private-event inquiries, capture the lead, send the catering Smart Link, and queue a follow-up',
    },
  ],

  veterinary: [
    {
      id: 'recall-to-exam', label: 'Recall \u2192 Exam \u2192 Follow-Up',
      description: 'Bring pets in for due wellness, vaccines, or follow-up exams',
      icon: Phone, steps: ['Find Due Pets', 'Send Recall', 'Book Exam', 'Follow-Up'],
      command: 'Find pets due for vaccines or wellness exams, send recall messages, and book the next available slot',
    },
    {
      id: 'new-client-intake', label: 'New Client Intake',
      description: 'Onboard a new pet owner, capture history, and schedule a first exam',
      icon: Home, steps: ['Capture Info', 'Pet History', 'Schedule First Exam'],
      command: 'Onboard a new pet owner: capture contact + pet info, request prior records, and book a first exam',
    },
    {
      id: 'invoice-followup', label: 'Invoice Follow-Up',
      description: 'Chase outstanding invoices with friendly reminders',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding invoices, draft friendly reminders, and show them for my approval',
    },
  ],

  medical_practice: [
    {
      id: 'new-patient-intake', label: 'New Patient \u2192 Intake \u2192 Visit',
      description: 'Convert a new patient inquiry into a verified, scheduled visit',
      icon: Home, steps: ['Inquiry', 'Insurance Verification', 'Intake Form', 'Schedule Visit'],
      command: 'Take my newest new-patient inquiry: verify insurance, send intake forms, and schedule the first visit',
    },
    {
      id: 'annual-recall', label: 'Annual Physical Recall',
      description: 'Bring patients in for their annual wellness visit',
      icon: Phone, steps: ['Find Due', 'Send Recall', 'Book Visit'],
      command: 'Find patients overdue for an annual physical, send a recall, and book the next available slot',
    },
    {
      id: 'statement-followup', label: 'Patient Statement Follow-Up',
      description: 'Chase outstanding patient balances after insurance adjudication',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding patient statements, draft compassionate reminders, and show them for my approval',
    },
  ],
};

/** Resolve workflow chains for the given pack, applying terminology substitutions. */
export function getBusinessWorkflows(pack: IndustryPack): WorkflowChain[] {
  const base = INDUSTRY_WORKFLOWS[pack.industry_id]
    ?? CLUSTER_WORKFLOWS[pack.cluster]
    ?? CLUSTER_WORKFLOWS.trades;
  return base.map(w => ({
    ...w,
    label: applyTerminology(w.label, pack),
    description: applyTerminology(w.description, pack),
    command: applyTerminology(w.command, pack),
  }));
}