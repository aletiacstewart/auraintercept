/**
 * Declarative event subscriptions for the 10 consolidated operatives.
 *
 * This replaces the old inline EVENT_ROUTING map in ai-orchestrator. Each entry
 * says which agent reacts to which event and *why*, so the UI can explain it in
 * plain English ("Dispatch reacts to: a new appointment").
 *
 * Industry specialists are deliberately absent: they are request/response only,
 * invoked by operatives through the ai-agent-chat tool interface.
 */

/** Canonical dotted event names emitted anywhere in the platform. */
export const AGENT_EVENTS = [
  'appointment.created',
  'appointment.scheduled',
  'appointment.cancelled',
  'technician.assigned',
  'job.started',
  'job.completed',
  'quote.sent',
  'quote.approved',
  'invoice.paid',
  'payment.received',
  'lead.qualified',
  'lead.scored',
  'review.received',
  'inventory.low',
  'route.optimized',
  'eta.updated',
  'triage.complete',
  'followup.sent',
  'churn_risk.detected',
  'campaign.created',
  'content.generated',
  'content.published',
  'post.published',
  'blog.published',
  'seo_scan.complete',
  'agent.handoff',
] as const;

export type AgentEventName = typeof AGENT_EVENTS[number];

/**
 * Legacy underscore event names → canonical dotted names.
 * Kept so events already in flight (and older callers) keep routing correctly.
 */
export const LEGACY_EVENT_ALIASES: Record<string, AgentEventName> = {
  appointment_booked: 'appointment.created',
  appointment_created: 'appointment.created',
  appointment_scheduled: 'appointment.scheduled',
  appointment_cancelled: 'appointment.cancelled',
  tech_assigned: 'technician.assigned',
  technician_assigned: 'technician.assigned',
  tech_arrived: 'job.started',
  job_started: 'job.started',
  job_complete: 'job.completed',
  job_completed: 'job.completed',
  quote_sent: 'quote.sent',
  quote_approved: 'quote.approved',
  invoice_paid: 'invoice.paid',
  payment_received: 'payment.received',
  lead_qualified: 'lead.qualified',
  lead_scored: 'lead.scored',
  review_received: 'review.received',
  inventory_low: 'inventory.low',
  route_optimized: 'route.optimized',
  eta_updated: 'eta.updated',
  triage_complete: 'triage.complete',
  followup_sent: 'followup.sent',
  churn_risk_detected: 'churn_risk.detected',
  campaign_created: 'campaign.created',
  content_generated: 'content.generated',
  content_published: 'content.published',
  post_published: 'post.published',
  blog_published: 'blog.published',
  seo_scan_complete: 'seo_scan.complete',
  agent_handoff: 'agent.handoff',
  content_engine_output: 'content.generated',
  seasonal_trigger: 'campaign.created',
};

/** Resolve any event name (legacy or canonical) to its canonical form. */
export function normalizeEventName(name: string): string {
  if ((AGENT_EVENTS as readonly string[]).includes(name)) return name;
  return LEGACY_EVENT_ALIASES[name] || name;
}

export interface EventSubscription {
  /** Operative that reacts to the event. */
  agentType: string;
  /** Canonical event it listens for. */
  event: AgentEventName;
  /** Plain-English reason, shown in the Agents screen. */
  reason: string;
}

export const EVENT_SUBSCRIPTIONS: EventSubscription[] = [
  // Dispatch — gets work onto the board
  { agentType: 'dispatch', event: 'appointment.created', reason: 'assigns the right person to a new appointment' },
  { agentType: 'dispatch', event: 'appointment.scheduled', reason: 'fits the confirmed time into the day plan' },
  { agentType: 'dispatch', event: 'appointment.cancelled', reason: 'frees the slot and reshuffles the day' },
  { agentType: 'dispatch', event: 'triage.complete', reason: 'picks up work the receptionist qualified' },
  { agentType: 'dispatch', event: 'inventory.low', reason: 'avoids sending someone without the parts' },

  // Field navigation — the travel side of the job
  { agentType: 'field_navigation', event: 'technician.assigned', reason: 'plans the route and the arrival time' },
  { agentType: 'field_navigation', event: 'appointment.created', reason: 'checks the new stop fits the route' },
  { agentType: 'field_navigation', event: 'job.started', reason: 'tracks progress and updates the next ETA' },
  { agentType: 'field_navigation', event: 'route.optimized', reason: 'applies the new route order' },
  { agentType: 'field_navigation', event: 'eta.updated', reason: 'keeps arrival times current' },

  // Customer journey — everything the customer hears
  { agentType: 'customer_journey', event: 'appointment.scheduled', reason: 'sends the confirmation and reminders' },
  { agentType: 'customer_journey', event: 'appointment.cancelled', reason: 'follows up to rebook' },
  { agentType: 'customer_journey', event: 'job.completed', reason: 'thanks the customer and asks for a review' },
  { agentType: 'customer_journey', event: 'triage.complete', reason: 'starts the relationship after first contact' },
  { agentType: 'customer_journey', event: 'review.received', reason: 'responds to the review' },
  { agentType: 'customer_journey', event: 'payment.received', reason: 'sends the receipt and a thank you' },
  { agentType: 'customer_journey', event: 'invoice.paid', reason: 'closes the loop after payment' },
  { agentType: 'customer_journey', event: 'lead.qualified', reason: 'starts nurturing a promising lead' },
  { agentType: 'customer_journey', event: 'followup.sent', reason: 'tracks the follow-up thread' },

  // Business finance — money
  { agentType: 'business_finance', event: 'job.completed', reason: 'raises the invoice for finished work' },
  { agentType: 'business_finance', event: 'appointment.created', reason: 'prepares the quote for the new job' },
  { agentType: 'business_finance', event: 'quote.sent', reason: 'chases the quote for a decision' },
  { agentType: 'business_finance', event: 'quote.approved', reason: 'turns the approved quote into an invoice' },
  { agentType: 'business_finance', event: 'job.started', reason: 'tracks parts and time used on site' },
  { agentType: 'business_finance', event: 'inventory.low', reason: 'reorders stock before it runs out' },

  // Outreach — demand
  { agentType: 'outreach', event: 'job.completed', reason: 'asks for a referral while the job is fresh' },
  { agentType: 'outreach', event: 'triage.complete', reason: 'picks up enquiries that did not book' },
  { agentType: 'outreach', event: 'lead.qualified', reason: 'works the qualified lead' },
  { agentType: 'outreach', event: 'lead.scored', reason: 'prioritises the strongest leads' },
  { agentType: 'outreach', event: 'churn_risk.detected', reason: 'reaches out before a customer drifts away' },
  { agentType: 'outreach', event: 'review.received', reason: 'reuses good reviews in marketing' },
  { agentType: 'outreach', event: 'payment.received', reason: 'times the next offer well' },
  { agentType: 'outreach', event: 'campaign.created', reason: 'runs the campaign' },
  { agentType: 'outreach', event: 'content.generated', reason: 'puts new content to work in campaigns' },

  // Analytics — the numbers
  { agentType: 'analytics_intelligence', event: 'job.completed', reason: 'updates job and revenue figures' },
  { agentType: 'analytics_intelligence', event: 'invoice.paid', reason: 'updates cash collected' },
  { agentType: 'analytics_intelligence', event: 'payment.received', reason: 'tracks payment trends' },
  { agentType: 'analytics_intelligence', event: 'review.received', reason: 'tracks satisfaction over time' },
  { agentType: 'analytics_intelligence', event: 'post.published', reason: 'measures how posts perform' },
  { agentType: 'analytics_intelligence', event: 'seo_scan.complete', reason: 'reports on search visibility' },

  // Creative content + web presence
  { agentType: 'creative_content', event: 'blog.published', reason: 'shares the new article on social' },
  { agentType: 'creative_content', event: 'content.generated', reason: 'schedules the new content' },
  { agentType: 'web_presence', event: 'content.generated', reason: 'publishes the content to the website' },
  { agentType: 'web_presence', event: 'content.published', reason: 'keeps the website in step' },
  { agentType: 'web_presence', event: 'blog.published', reason: 'refreshes site pages and sitemap' },
  { agentType: 'web_presence', event: 'seo_scan.complete', reason: 'fixes what the scan found' },

  // Admin
  { agentType: 'admin', event: 'inventory.low', reason: 'flags the shortage to the owner' },
];

/** Agents subscribed to an event (accepts legacy names). */
export function subscribersForEvent(eventName: string): string[] {
  const canonical = normalizeEventName(eventName);
  return EVENT_SUBSCRIPTIONS.filter((s) => s.event === canonical).map((s) => s.agentType);
}

/** Events an agent reacts to, with the plain-English reason. */
export function subscriptionsForAgent(agentType: string): EventSubscription[] {
  return EVENT_SUBSCRIPTIONS.filter((s) => s.agentType === agentType);
}
