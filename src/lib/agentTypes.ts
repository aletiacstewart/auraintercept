/**
 * Plain-English reference layer over the platform's existing AI operatives.
 *
 * This file is DESCRIPTIVE ONLY. It does not replace or gate the 24 agents
 * defined in `src/lib/agentStyles.ts` and routed through `ai-agent-chat`.
 * Each job type below lists the existing agent ids it covers, so sales,
 * onboarding and documentation can talk about five understandable jobs
 * while the platform keeps its full operative network.
 */

export interface AgentType {
  id: string;
  name: string;
  description: string;
  features: string[];
  requiredIntegrations: string[];
  industryFit: string[];
  /** Existing agent ids from src/lib/agentStyles.ts covered by this type. */
  agents: string[];
}

export const AGENT_TYPES = {
  SCHEDULING: {
    id: 'scheduling',
    name: 'Appointment Scheduler',
    description: 'Handles incoming calls, books appointments, sends reminders',
    features: ['Incoming calls', 'Appointment booking', 'Calendar sync', 'Reminders'],
    requiredIntegrations: ['voice', 'calendar'],
    industryFit: ['All'],
    agents: ['triage', 'booking', 'customer_journey'],
  },
  LEAD_QUALIFICATION: {
    id: 'lead_qualification',
    name: 'Lead Qualifier',
    description: 'Pre-qualifies inbound leads, collects info, routes to sales',
    features: ['Inbound screening', 'Info collection', 'Qualification scoring', 'Routing'],
    requiredIntegrations: ['voice', 'crm'],
    industryFit: ['All'],
    agents: ['lead', 'outreach', 'quoting'],
  },
  CUSTOMER_SERVICE: {
    id: 'customer_service',
    name: 'Customer Service Agent',
    description: 'Handles customer inquiries, appointment changes, support',
    features: ['Chat support', 'FAQs', 'Escalation', 'Ticket creation'],
    requiredIntegrations: ['sms', 'email'],
    industryFit: ['All'],
    agents: ['customer_journey', 'admin', 'review'],
  },
  FIELD_OPS: {
    id: 'field_ops',
    name: 'Field Operations Agent',
    description: 'Manages field technician dispatch, updates, customer communication',
    features: ['Job dispatch', 'Route optimization', 'Live updates', 'Photo capture'],
    requiredIntegrations: ['sms', 'calendar'],
    industryFit: ['Plumbing', 'HVAC', 'Electrical', 'Cleaning'],
    agents: ['dispatch', 'field_navigation', 'route', 'eta', 'checkin'],
  },
  FOLLOW_UP: {
    id: 'follow_up',
    name: 'Follow-Up Agent',
    description: 'Automated follow-up calls to past customers, upsells',
    features: ['Scheduled calls', 'CRM updates', 'Upsell prompts', 'Reporting'],
    requiredIntegrations: ['voice', 'crm'],
    industryFit: ['All'],
    agents: ['followup', 'review', 'campaign', 'marketing'],
  },
} satisfies Record<string, AgentType>;

export type AgentTypeKey = keyof typeof AGENT_TYPES;

/** Suggested starter sets per industry. */
export const AGENT_TEMPLATES = {
  HVAC: [AGENT_TYPES.SCHEDULING, AGENT_TYPES.FIELD_OPS, AGENT_TYPES.FOLLOW_UP],
  PLUMBING: [AGENT_TYPES.SCHEDULING, AGENT_TYPES.FIELD_OPS, AGENT_TYPES.FOLLOW_UP],
  ELECTRICAL: [AGENT_TYPES.SCHEDULING, AGENT_TYPES.FIELD_OPS, AGENT_TYPES.FOLLOW_UP],
  CLEANING: [AGENT_TYPES.SCHEDULING, AGENT_TYPES.CUSTOMER_SERVICE],
  AUTOMOTIVE: [AGENT_TYPES.SCHEDULING, AGENT_TYPES.LEAD_QUALIFICATION],
  GENERAL_SERVICE: [AGENT_TYPES.SCHEDULING, AGENT_TYPES.CUSTOMER_SERVICE],
} satisfies Record<string, AgentType[]>;

export type AgentTemplateKey = keyof typeof AGENT_TEMPLATES;

/** Which job type an existing agent id belongs to (first match wins). */
export function getAgentTypeForAgent(agentId: string): AgentType | undefined {
  return Object.values(AGENT_TYPES).find((t) => t.agents.includes(agentId));
}
