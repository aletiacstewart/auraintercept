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
    },
    {
      id: 'quote-to-job', label: 'Quote → Job',
      description: 'Convert an approved quote into a scheduled job',
      icon: ClipboardList, steps: ['Quote', 'Approve', 'Schedule', 'Assign'],
      command: 'Take my most recent pending quote, approve it, schedule the job, and assign the best available technician',
    },
    {
      id: 'invoice-chase', label: 'Invoice Follow-Up',
      description: 'Chase overdue invoices with smart reminders',
      icon: Receipt, steps: ['Find Overdue', 'Draft Reminder', 'Send'],
      command: 'Find all overdue invoices, draft friendly payment reminders for each, and show them for my approval before sending',
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
    },
    {
      id: 'appointment-reminders', label: '{{appointment}} Reminders',
      description: 'Send confirmations and reminders for upcoming {{appointment}}s',
      icon: Phone, steps: ['Pull Upcoming', 'Draft Reminder', 'Send'],
      command: 'Find all upcoming appointments in the next 48 hours, draft reminder messages, and send them for my approval',
    },
    {
      id: 'invoice-followup', label: 'Invoice Follow-Up',
      description: 'Chase outstanding invoices with smart reminders',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding invoices, draft friendly reminders, and show them for my approval',
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
    },
    {
      id: 'inbound-demo', label: 'Inbound → Demo → Follow-Up',
      description: 'Capture an inbound lead, book a demo, and run the follow-up',
      icon: Phone, steps: ['Capture', 'Book Demo', 'Follow-Up'],
      command: 'Take my newest inbound lead, book a product demo on my calendar, and queue a personalized follow-up sequence',
    },
    {
      id: 'renewal-churn-save', label: 'Renewal / Churn Save',
      description: 'Spot at-risk accounts and run a save play before they churn',
      icon: Star, steps: ['Score Risk', 'Draft Outreach', 'Offer'],
      command: 'Identify at-risk customers approaching renewal, draft a save-play outreach for each, and show me for approval',
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