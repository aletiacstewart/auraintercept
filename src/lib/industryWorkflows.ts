import { ArrowRightLeft, ClipboardList, Receipt, Home, PenTool, Phone, Wrench, Map } from 'lucide-react';
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
      id: 'listing-to-marketing', label: 'Listing → Marketing → Open House',
      description: 'Promote a new listing and book the open house',
      icon: PenTool, steps: ['Listing', 'Posts', 'Book Open House'],
      command: 'For my newest listing, draft social posts and email blasts, then schedule the open house and capture RSVPs',
    },
    {
      id: 'invoice-followup', label: 'Invoice / Commission Follow-Up',
      description: 'Chase outstanding invoices and commissions',
      icon: Receipt, steps: ['Find Outstanding', 'Draft', 'Send'],
      command: 'Find all outstanding invoices and pending commissions, draft friendly reminders, and show them for my approval',
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

/** Resolve workflow chains for the given pack, applying terminology substitutions. */
export function getBusinessWorkflows(pack: IndustryPack): WorkflowChain[] {
  const base = CLUSTER_WORKFLOWS[pack.cluster] ?? CLUSTER_WORKFLOWS.trades;
  return base.map(w => ({
    ...w,
    label: applyTerminology(w.label, pack),
    description: applyTerminology(w.description, pack),
    command: applyTerminology(w.command, pack),
  }));
}