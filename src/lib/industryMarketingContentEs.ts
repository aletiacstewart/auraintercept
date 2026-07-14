import type { IndustryContent } from './industryMarketingContent';

/**
 * Spanish overrides for the highest-traffic industry packs.
 * Only fields present here are translated; anything missing falls back to English.
 * Expand this map as funnel data reveals which verticals are converting.
 */
type IndustryEsOverride = Partial<Pick<IndustryContent, 'hero' | 'painPoints' | 'sampleCalls' | 'sampleServices'>>;

export const INDUSTRY_CONTENT_ES: Record<string, IndustryEsOverride> = {
  default: {
    hero: {
      headline: 'Agentes inteligentes. Servicio automatizado.',
      subheadline: 'Aura contesta cada llamada, mensaje y chat 24/7 — agenda trabajos, despacha a la persona correcta y hace seguimiento automáticamente. Elige tu industria arriba para ver una demo hecha para ti.',
    },
    painPoints: [
      { title: 'Nunca pierdas un lead', description: 'Aura contesta cada llamada, texto y chat al instante — incluso a las 2 AM, fines de semana o mientras trabajas.' },
      { title: 'Agenda mientras trabajas', description: 'Cotiza, agenda y confirma citas en la misma llamada — sin ir y venir con el cliente.' },
      { title: 'Hecha para tu industria', description: 'Elige tu oficio arriba y Aura ajusta al instante la demo, los servicios y las conversaciones.' },
    ],
  },
  hvac: {
    hero: {
      headline: 'Cada llamada de emergencia contestada. Cada cita reservada.',
      subheadline: 'Aura contesta cuando el AC se descompone a las 11 PM, cotiza el reemplazo y agenda al técnico correcto — mientras estás en otro trabajo.',
    },
    painPoints: [
      { title: 'Emergencias 24/7', description: 'Contesta llamadas de "sin aire" fuera de horario y despacha al técnico correcto.' },
      { title: 'Cotizaciones al instante', description: 'Convierte la llamada en una estimación aprobable — sin regresar a la oficina.' },
      { title: 'Rutas más cortas', description: 'Ordena las visitas del día para menos tiempo en el tráfico y más trabajos completados.' },
    ],
  },
  auto_repair: {
    hero: {
      headline: 'Cada auto en el calendario. Cada cliente informado.',
      subheadline: 'Aura contesta el teléfono del taller, cotiza el diagnóstico y agenda al cliente — mientras tú estás bajo un capó.',
    },
    painPoints: [
      { title: 'Sin llamadas perdidas', description: 'Contesta mientras estás con las manos ocupadas en el taller.' },
      { title: 'Estimados claros', description: 'Cotiza servicios comunes al instante para que los clientes decidan rápido.' },
      { title: 'Recordatorios de mantenimiento', description: 'Trae de vuelta a los clientes cuando toca cambio de aceite o servicio.' },
    ],
  },
  plumbing: {
    hero: {
      headline: 'Fugas contestadas. Trabajos agendados. Reseñas pedidas.',
      subheadline: 'Aura contesta la emergencia de plomería a medianoche, califica la urgencia y agenda al plomero correcto para mañana temprano.',
    },
    painPoints: [
      { title: 'Emergencias primero', description: 'Detecta fugas activas y coloca al cliente al frente de la fila.' },
      { title: 'Cotizaciones en el teléfono', description: 'Estima trabajos comunes sin visita previa.' },
      { title: 'Seguimiento sin esfuerzo', description: 'Confirma, recuerda y pide reseñas — todo en automático.' },
    ],
  },
  electrical: {
    hero: {
      headline: 'Cada llamada eléctrica contestada, cotizada y agendada.',
      subheadline: 'Aura contesta cuando se va la luz, califica el trabajo y despacha al electricista con licencia correcto — sin que dejes tu trabajo actual.',
    },
    painPoints: [
      { title: 'Trabajos calificados por Aura', description: 'Filtra emergencias, actualizaciones de panel y proyectos grandes por separado.' },
      { title: 'Cotización rápida', description: 'Da un rango de precio en la llamada para reservar antes de que llamen al competidor.' },
      { title: 'Cumplimiento de permisos', description: 'Recuerda documentar permisos, inspecciones y firmas de cliente.' },
    ],
  },
  salon: {
    hero: {
      headline: 'Sillas llenas. Clientes felices. Cero llamadas perdidas.',
      subheadline: 'Aura contesta cuando estás con un cliente en la silla — reserva citas, confirma con recordatorios y llena las cancelaciones de último minuto.',
    },
    painPoints: [
      { title: 'Reservas sin interrumpir', description: 'Contesta y agenda mientras estás cortando o coloreando.' },
      { title: 'Rellenar huecos', description: 'Cuando alguien cancela, Aura ofrece el espacio a la lista de espera.' },
      { title: 'Recordatorios que reducen no-shows', description: 'Textos y correos automáticos antes de cada cita.' },
    ],
  },
  restaurant: {
    hero: {
      headline: 'Reservas contestadas. Órdenes anotadas. Preguntas resueltas.',
      subheadline: 'Aura contesta el teléfono durante el rush — toma reservas, responde horarios y comparte el menú sin distraer a tu equipo.',
    },
    painPoints: [
      { title: 'Sin llamadas ignoradas', description: 'Ninguna reserva se pierde por estar en el rush del servicio.' },
      { title: 'Preguntas frecuentes al instante', description: 'Horarios, ubicación, estacionamiento y menú — respondidos automáticamente.' },
      { title: 'Confirmaciones automáticas', description: 'Recordatorios de reserva por SMS para reducir mesas vacías.' },
    ],
  },
};

export function mergeEsOverride(base: IndustryContent, id: string): IndustryContent {
  const es = INDUSTRY_CONTENT_ES[id];
  if (!es) return base;
  return {
    ...base,
    ...(es.hero ? { hero: es.hero } : {}),
    ...(es.painPoints ? { painPoints: es.painPoints } : {}),
    ...(es.sampleCalls ? { sampleCalls: es.sampleCalls } : {}),
    ...(es.sampleServices ? { sampleServices: es.sampleServices } : {}),
  };
}