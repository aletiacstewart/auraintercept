import { Megaphone, Users, Star } from 'lucide-react';
import type { WorkflowChain } from '@/components/ui/workflow-chain-buttons';
import type { IndustryPack } from '@/hooks/useIndustryPack';

/** Substitute {{customer}} / {{customers}} using pack terminology. */
function applyTerminology(input: string, pack: IndustryPack): string {
  const term = pack.terminology ?? {};
  return input
    .replace(/\{\{customer\}\}/g, term.customer ?? 'customer')
    .replace(/\{\{customers\}\}/g, (term.customer ?? 'customer') + 's');
}

const MARKETING_WORKFLOWS: WorkflowChain[] = [
  {
    id: 'lead-nurture',
    label: 'Lead Nurture Campaign',
    description: 'Warm up new leads with a multi-touch outreach sequence',
    icon: Users,
    steps: ['Identify Leads', 'Draft Outreach', 'Schedule Sends'],
    command: 'Draft a 3-touch nurture campaign for my newest {{customers}} across SMS and email, and schedule the sends for my approval',
    targetRoute: '/dashboard/leads',
  },
  {
    id: 'review-drive',
    label: 'Review Drive',
    description: 'Request reviews from recently served customers',
    icon: Star,
    steps: ['Find Served', 'Draft Ask', 'Send'],
    command: 'Find {{customers}} served in the last 14 days and draft review request messages I can approve',
    targetRoute: '/dashboard/marketing',
  },
  {
    id: 'reactivation',
    label: 'Reactivation Campaign',
    description: 'Win back inactive customers with a targeted offer',
    icon: Megaphone,
    steps: ['Segment Inactive', 'Draft Offer', 'Send'],
    command: 'Segment {{customers}} inactive for 90+ days and draft a reactivation offer I can review before it sends',
    targetRoute: '/dashboard/marketing',
  },
];

/** Resolve marketing workflow chains, applying terminology substitutions. */
export function getMarketingWorkflows(pack: IndustryPack | null | undefined): WorkflowChain[] {
  if (!pack) return MARKETING_WORKFLOWS;
  return MARKETING_WORKFLOWS.map(w => ({
    ...w,
    label: applyTerminology(w.label, pack),
    description: applyTerminology(w.description, pack),
    command: applyTerminology(w.command, pack),
  }));
}
