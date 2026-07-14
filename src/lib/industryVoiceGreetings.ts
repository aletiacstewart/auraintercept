/**
 * Industry-aware Aura voice greetings.
 *
 * Returns a short, natural opening line for inbound voice calls,
 * tailored per industry pack so callers immediately hear their
 * vertical reflected. Used by the Fast Start launch step to seed
 * `companies.ai_voice_greeting` and exposed via a "Reset to industry
 * default" button in AI Agent Settings.
 */

const DEFAULT_GREETING = 'Thanks for calling {company}. This is Aura — how can I help today?';
const DEFAULT_GREETING_ES = 'Gracias por llamar a {company}. Soy Aura, ¿en qué puedo ayudarle hoy?';

const PER_INDUSTRY: Record<string, string> = {
  hvac: 'Thanks for calling {company}. This is Aura — are you calling about a service issue, a quote, or scheduling a tune-up?',
  plumbing: 'Thanks for calling {company}. This is Aura — is this an emergency, or are you scheduling something for later?',
  electrical: 'Thanks for calling {company}. This is Aura — are you calling about a repair, a panel upgrade, or a new install?',
  appliance_repair: 'Thanks for calling {company}. This is Aura — what appliance can I help you get fixed today?',
  solar: 'Thanks for calling {company}. This is Aura — are you exploring solar for your home, or following up on an existing project?',
  roofing: 'Thanks for calling {company}. This is Aura — are you calling about a leak, an inspection, or storm damage?',
  fencing: 'Thanks for calling {company}. This is Aura — are you looking at a new fence, a repair, or a quote?',
  landscape: 'Thanks for calling {company}. This is Aura — are you looking for recurring service, a one-time cleanup, or a quote?',
  pest_control: 'Thanks for calling {company}. This is Aura — are you calling about an active pest issue or recurring service?',
  pool_spa: 'Thanks for calling {company}. This is Aura — are you calling about your pool, your spa, or scheduling service?',
  auto_care: 'Thanks for calling {company}. This is Aura — what kind of service does your vehicle need today?',
  construction: 'Thanks for calling {company}. This is Aura — are you calling about a project quote or an existing job?',
  handyman: 'Thanks for calling {company}. This is Aura — what would you like to get fixed or installed?',
  security_systems: 'Thanks for calling {company}. This is Aura — are you calling about your existing system or a new install?',
  real_estate: 'Thanks for calling {company}. This is Aura — are you buying, selling, or following up on a listing?',
  beauty_wellness: 'Thanks for calling {company}. This is Aura — would you like to book, reschedule, or check on an appointment?',
  salon: 'Thanks for calling {company}. This is Aura — would you like to book, reschedule, or check on an appointment?',
  fitness: 'Thanks for calling {company}. This is Aura — are you a member, or would you like to learn about classes and trials?',
  restaurants: 'Thanks for calling {company}. This is Aura — I can text you a link to book a table, view our menu, hours, or catering info. What would you like?',
  personal_assistant: 'Thanks for calling {company}. This is Aura — how can I help you today?',
  professional: 'Thanks for calling {company}. This is Aura — how can I direct your call today?',
  saas_platform: 'Thanks for contacting {company}. This is Aura — are you a customer needing support, or exploring our platform?',
  home_health: 'Thanks for calling {company}. This is Aura — are you calling to schedule a visit, check on a current patient, or speak with our care team?',
  physical_therapy: 'Thanks for calling {company}. This is Aura — are you calling to schedule a therapy session, check on your plan of care, or speak with our team?',
  occupational_therapy: 'Thanks for calling {company}. This is Aura — are you calling to schedule a session, check on your plan of care, or speak with our team?',
  hospice: 'Thanks for calling {company}. This is Aura — are you calling about a current patient, exploring services, or trying to reach our care team?',
  veterinary: 'Thanks for calling {company}. This is Aura — are you calling to schedule an exam, check on your pet, or speak with our team?',
  medical_practice: 'Thanks for calling {company}. This is Aura — are you calling to schedule a visit, check your results, or speak with our office?',
  medical_office: 'Thanks for calling {company}. This is Aura — are you calling to schedule a visit, check your results, or speak with our office?',
  dental: 'Thanks for calling {company}. This is Aura — would you like to book a cleaning, follow up on a treatment plan, or reach our office?',
  chiropractic: 'Thanks for calling {company}. This is Aura — are you booking an adjustment, following up on care, or a new patient?',
  optometry: 'Thanks for calling {company}. This is Aura — are you scheduling an eye exam, following up on eyewear, or a new patient?',
};

export function getIndustryVoiceGreeting(
  industryId: string | null | undefined,
  companyName?: string | null,
): string {
  const tmpl = (industryId && PER_INDUSTRY[industryId]) || DEFAULT_GREETING;
  return tmpl.replace('{company}', companyName?.trim() || 'us');
}

const PER_INDUSTRY_ES: Record<string, string> = {
  hvac: 'Gracias por llamar a {company}. Soy Aura, ¿llama por un servicio, un presupuesto o para agendar un mantenimiento?',
  plumbing: 'Gracias por llamar a {company}. Soy Aura, ¿es una emergencia o quiere agendar para más tarde?',
  electrical: 'Gracias por llamar a {company}. Soy Aura, ¿llama por una reparación, una actualización del panel o una nueva instalación?',
  appliance_repair: 'Gracias por llamar a {company}. Soy Aura, ¿qué electrodoméstico necesita reparar hoy?',
  solar: 'Gracias por llamar a {company}. Soy Aura, ¿está explorando energía solar para su casa o dando seguimiento a un proyecto?',
  roofing: 'Gracias por llamar a {company}. Soy Aura, ¿llama por una gotera, una inspección o daños por tormenta?',
  fencing: 'Gracias por llamar a {company}. Soy Aura, ¿le interesa una cerca nueva, una reparación o un presupuesto?',
  landscape: 'Gracias por llamar a {company}. Soy Aura, ¿busca servicio recurrente, una limpieza puntual o un presupuesto?',
  pest_control: 'Gracias por llamar a {company}. Soy Aura, ¿llama por una plaga activa o por servicio recurrente?',
  pool_spa: 'Gracias por llamar a {company}. Soy Aura, ¿llama por su piscina, su spa o para agendar servicio?',
  auto_care: 'Gracias por llamar a {company}. Soy Aura, ¿qué servicio necesita su vehículo hoy?',
  construction: 'Gracias por llamar a {company}. Soy Aura, ¿llama por un presupuesto de proyecto o por una obra en curso?',
  handyman: 'Gracias por llamar a {company}. Soy Aura, ¿qué le gustaría reparar o instalar?',
  security_systems: 'Gracias por llamar a {company}. Soy Aura, ¿llama por su sistema actual o por una nueva instalación?',
  real_estate: 'Gracias por llamar a {company}. Soy Aura, ¿está comprando, vendiendo o dando seguimiento a una propiedad?',
  beauty_wellness: 'Gracias por llamar a {company}. Soy Aura, ¿desea reservar, reprogramar o confirmar una cita?',
  salon: 'Gracias por llamar a {company}. Soy Aura, ¿desea reservar, reprogramar o confirmar una cita?',
  fitness: 'Gracias por llamar a {company}. Soy Aura, ¿es miembro o quiere información sobre clases y pruebas gratis?',
  restaurants: 'Gracias por llamar a {company}. Soy Aura, puedo enviarle un enlace para reservar mesa, ver el menú, horarios o catering. ¿Qué prefiere?',
  personal_assistant: 'Gracias por llamar a {company}. Soy Aura, ¿en qué puedo ayudarle hoy?',
  professional: 'Gracias por llamar a {company}. Soy Aura, ¿a quién le gustaría contactar?',
  saas_platform: 'Gracias por contactar a {company}. Soy Aura, ¿es cliente y necesita soporte, o quiere conocer nuestra plataforma?',
  home_health: 'Gracias por llamar a {company}. Soy Aura, ¿llama para agendar una visita, consultar sobre un paciente o hablar con el equipo de atención?',
  physical_therapy: 'Gracias por llamar a {company}. Soy Aura, ¿llama para agendar una sesión, consultar su plan de cuidados o hablar con el equipo?',
  occupational_therapy: 'Gracias por llamar a {company}. Soy Aura, ¿llama para agendar una sesión, consultar su plan de cuidados o hablar con el equipo?',
  hospice: 'Gracias por llamar a {company}. Soy Aura, ¿llama por un paciente actual, para conocer nuestros servicios o para hablar con el equipo de atención?',
  veterinary: 'Gracias por llamar a {company}. Soy Aura, ¿llama para agendar un examen, consultar sobre su mascota o hablar con el equipo?',
  medical_practice: 'Gracias por llamar a {company}. Soy Aura, ¿llama para agendar una consulta, revisar resultados o hablar con la oficina?',
  medical_office: 'Gracias por llamar a {company}. Soy Aura, ¿llama para agendar una consulta, revisar resultados o hablar con la oficina?',
  dental: 'Gracias por llamar a {company}. Soy Aura, ¿desea reservar una limpieza, dar seguimiento a un tratamiento o hablar con la oficina?',
  chiropractic: 'Gracias por llamar a {company}. Soy Aura, ¿desea reservar un ajuste, dar seguimiento a su cuidado o es un paciente nuevo?',
  optometry: 'Gracias por llamar a {company}. Soy Aura, ¿desea agendar un examen visual, dar seguimiento a sus lentes o es un paciente nuevo?',
};

export function getIndustryVoiceGreetingEs(
  industryId: string | null | undefined,
  companyName?: string | null,
): string {
  const tmpl = (industryId && PER_INDUSTRY_ES[industryId]) || DEFAULT_GREETING_ES;
  return tmpl.replace('{company}', companyName?.trim() || 'nosotros');
}
