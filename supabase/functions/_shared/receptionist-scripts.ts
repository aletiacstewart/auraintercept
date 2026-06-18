/**
 * Server-side mirror of `src/lib/receptionistScripts.ts`.
 * Keep IDs and contents aligned with the client copy.
 */

export type ReceptionistScriptId =
  | 'emergency_dispatch_intake'
  | 'recurring_route_intake'
  | 'project_estimate_intake'
  | 'appointment_intake'
  | 'real_estate_lead_intake'
  | 'delivery_window_intake'
  | 'mobile_auto_intake'
  | 'pet_services_intake'
  | 'event_intake'
  | 'sensitive_specialty_intake';

export interface ReceptionistScript {
  id: ReceptionistScriptId;
  greeting: string;
  questions: string[];
  routing: string;
  emergencyTriggers?: string[];
}

export const RECEPTIONIST_SCRIPTS: Record<ReceptionistScriptId, ReceptionistScript> = {
  emergency_dispatch_intake: {
    id: 'emergency_dispatch_intake',
    greeting: "Thanks for calling {{company_name}}, this is your AI assistant. Is this an emergency or a scheduled service request?",
    questions: [
      'What is happening right now? (leak, no heat, no power, etc.)',
      'What is the service address?',
      'How long has this been going on?',
      'Is anyone in danger or is there active property damage?',
      'What is the best phone number to reach you?',
    ],
    routing: 'If emergency: flag P0/P1, page the on-call technician via SMS, and offer the soonest dispatch window. Otherwise schedule a routine appointment.',
    emergencyTriggers: ['flood', 'no heat', 'no water', 'sparking', 'burning smell', 'gas leak', 'sewage'],
  },
  recurring_route_intake: {
    id: 'recurring_route_intake',
    greeting: "Hi, thanks for calling {{company_name}}. Are you a current subscription customer, or looking to start service?",
    questions: [
      'What is the service address?',
      'What service frequency are you looking for? (weekly, biweekly, monthly)',
      'Property size or rough square footage?',
      'Any pets, gates, or access notes for our crew?',
      'Preferred day of the week, if any?',
    ],
    routing: 'Add to the next available route cluster, send a subscription quote, and confirm the first stop date.',
  },
  project_estimate_intake: {
    id: 'project_estimate_intake',
    greeting: "Thanks for calling {{company_name}}. I can help you book a free estimate — what kind of project are you planning?",
    questions: [
      'Project type and scope (rough description)?',
      'Service address?',
      'Ideal start window?',
      'Have you gotten other quotes already?',
      'Best time for a site visit this week or next?',
    ],
    routing: 'Schedule a site visit with the estimator and send a confirmation text.',
  },
  appointment_intake: {
    id: 'appointment_intake',
    greeting: "Hi, you've reached {{company_name}}. Would you like to book a new appointment or change an existing one?",
    questions: [
      'Which service are you interested in?',
      'First-time client or returning?',
      'Preferred date and time window?',
      'Best email for the confirmation?',
    ],
    routing: 'Offer the next two open slots from the live calendar and confirm via email + SMS.',
  },
  real_estate_lead_intake: {
    id: 'real_estate_lead_intake',
    greeting: "Thanks for calling {{company_name}}. Are you looking to buy, sell, or rent?",
    questions: [
      'Buying, selling, or renting?',
      'Target neighborhoods or zip codes?',
      'Price range or budget?',
      'Timeline to move?',
      'Best email for listings and follow-up?',
    ],
    routing: 'Create a scored lead, assign to the on-duty agent, and schedule a callback within 5 minutes.',
  },
  delivery_window_intake: {
    id: 'delivery_window_intake',
    greeting: "Thanks for calling {{company_name}}. Are you scheduling a new delivery or checking on an existing one?",
    questions: [
      'Pickup address?',
      'Drop-off address?',
      'What are we moving / delivering (size, weight, special handling)?',
      'Preferred delivery date and time window?',
      'Best mobile number for ETA texts?',
    ],
    routing: 'Quote based on distance and item size, lock the time window, and enable ETA notifications.',
  },
  mobile_auto_intake: {
    id: 'mobile_auto_intake',
    greeting: "Hi, thanks for calling {{company_name}}. Which service are you interested in today?",
    questions: [
      'Service requested (detail, oil change, tint, glass, etc.)?',
      'Year / make / model of the vehicle?',
      'Service address — where will the vehicle be?',
      'Preferred date and time?',
    ],
    routing: 'Apply menu pricing, assign the nearest mobile unit, and confirm with an ETA window.',
  },
  pet_services_intake: {
    id: 'pet_services_intake',
    greeting: "Thanks for calling {{company_name}}, the pet care team. New client or returning?",
    questions: [
      'Pet name, breed, and size?',
      'Service needed (grooming, walking, vet visit)?',
      'Any temperament or medical notes we should know?',
      'Preferred recurring cadence, if any?',
      'Best date and time?',
    ],
    routing: 'Create the pet profile, book the appointment, and queue recurring care reminders.',
  },
  event_intake: {
    id: 'event_intake',
    greeting: "Thanks for calling {{company_name}}. Are you planning a new event or following up on a quote?",
    questions: [
      'Event type and date?',
      'Venue or location?',
      'Guest count?',
      'Hours of service needed?',
      'Budget range?',
    ],
    routing: 'Hold the date on the calendar, send a custom package quote, and request a 25% deposit.',
  },
  sensitive_specialty_intake: {
    id: 'sensitive_specialty_intake',
    greeting: "Thank you for calling {{company_name}}. I'm here to help — we handle every situation with discretion. Can you tell me a little about what's going on?",
    questions: [
      'What kind of situation are we helping with?',
      'Service address?',
      'Approximate square footage or scope?',
      'Any biohazard, hoarding, or sensitive conditions we should prepare for?',
      'Best contact for the on-site walkthrough?',
    ],
    routing: 'Schedule a discreet on-site walkthrough, dispatch a vetted crew, and capture before/after documentation.',
  },
};

/** Map ProfileKey -> default receptionist script id. Mirrors PROFILE_SPECS. */
const PROFILE_TO_SCRIPT: Record<string, ReceptionistScriptId> = {
  PROFILE_A: 'emergency_dispatch_intake',
  PROFILE_B: 'recurring_route_intake',
  PROFILE_C: 'project_estimate_intake',
  PROFILE_D: 'appointment_intake',
  PROFILE_E: 'real_estate_lead_intake',
  PROFILE_F: 'delivery_window_intake',
  PROFILE_G: 'mobile_auto_intake',
  PROFILE_H: 'pet_services_intake',
  PROFILE_I: 'event_intake',
  PROFILE_J: 'sensitive_specialty_intake',
};

export function getScriptForProfileKey(profileKey: string | null | undefined): ReceptionistScript {
  const id = (profileKey && PROFILE_TO_SCRIPT[profileKey]) || 'appointment_intake';
  return RECEPTIONIST_SCRIPTS[id];
}

/** Build the prompt addon a receptionist agent should follow for this profile. */
export function buildReceptionistPromptAddon(profileKey: string | null | undefined, companyName: string): string {
  const script = getScriptForProfileKey(profileKey);
  const questionList = script.questions.map((q, i) => `  ${i + 1}. ${q}`).join('\n');
  const triggers = script.emergencyTriggers?.length
    ? `\nEMERGENCY TRIGGERS — if the caller mentions any of these, treat as urgent and route immediately: ${script.emergencyTriggers.join(', ')}.`
    : '';
  return `\n\nINTAKE SCRIPT (profile: ${profileKey || 'default'}):
When the caller wants service, naturally collect the following — one at a time, in conversation:
${questionList}

ROUTING AFTER INTAKE: ${script.routing}${triggers}`;
}

export function renderScriptGreeting(profileKey: string | null | undefined, companyName: string): string {
  return getScriptForProfileKey(profileKey).greeting.replace(/\{\{company_name\}\}/g, companyName);
}