import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * Surface-aware field label/placeholder/helper resolution driven by the
 * active industry pack. Used by Add* forms so labels stay vertical-correct
 * (e.g. salon "Stylist" vs trades "Technician", real-estate "Property
 * Address" vs trades "Service Address").
 *
 * Resolution order: industry_id → cluster → generic fallback (which mirrors
 * the wording the forms shipped with so nothing regresses for unmapped
 * verticals).
 */

export type FieldSurface =
  | 'appointment'
  | 'customer'
  | 'lead'
  | 'quote'
  | 'job';

export type FieldKey =
  | 'service_type'
  | 'service_address'
  | 'customer_name'
  | 'notes'
  | 'technician';

export interface FieldLabel {
  label: string;
  placeholder?: string;
  helper?: string;
}

type SurfaceMap = Partial<Record<FieldSurface, Partial<Record<FieldKey, FieldLabel>>>>;

const GENERIC: Required<SurfaceMap> = {
  appointment: {
    service_type:    { label: 'Service Type',    placeholder: 'Select a service' },
    service_address: { label: 'Service Address', placeholder: 'Where the work happens' },
    customer_name:   { label: 'Customer Name',   placeholder: 'Full name' },
    notes:           { label: 'Notes',           placeholder: 'Anything the team should know' },
    technician:      { label: 'Assign Technician' },
  },
  customer: {
    customer_name:   { label: 'Customer',        placeholder: 'Full name' },
    service_address: { label: 'Address',         placeholder: '123 Main St, City, State' },
    notes:           { label: 'Notes' },
  },
  lead:  { notes: { label: 'Notes' } },
  quote: { notes: { label: 'Scope of Work' } },
  job:   { notes: { label: 'Job Notes' } },
};

const BY_CLUSTER: Partial<Record<IndustryPack['cluster'], SurfaceMap>> = {
  outdoor: {
    appointment: {
      service_type:    { label: 'Visit Type',     placeholder: 'Select a visit type' },
      service_address: { label: 'Property Address' },
      technician:      { label: 'Assign Crew' },
    },
  },
  repair: {
    appointment: {
      service_type:    { label: 'Repair Type',    placeholder: 'Select a repair' },
      service_address: { label: 'Drop-off / Pickup Address' },
      technician:      { label: 'Assign Technician' },
    },
  },
  booking: {
    appointment: {
      service_type:    { label: 'Appointment Type', placeholder: 'Select an appointment type' },
      service_address: { label: 'Location' },
      technician:      { label: 'Assign Team Member' },
    },
  },
};

const BY_INDUSTRY: Record<string, SurfaceMap> = {
  real_estate: {
    appointment: {
      service_type:    { label: 'Showing Type',  placeholder: 'Select a showing type' },
      service_address: { label: 'Property Address', placeholder: 'Listing address' },
      customer_name:   { label: 'Buyer / Renter Name' },
      technician:      { label: 'Assign Agent' },
      notes:           { label: 'Showing Notes' },
    },
    customer:   { customer_name: { label: 'Client' } },
  },
  salon: {
    appointment: {
      service_type:    { label: 'Service',        placeholder: 'Cut, color, blowout…' },
      service_address: { label: 'Salon Location' },
      technician:      { label: 'Assign Stylist' },
      notes:           { label: 'Stylist Notes' },
    },
  },
  beauty_wellness: {
    appointment: {
      service_type:    { label: 'Service',        placeholder: 'Treatment or service' },
      technician:      { label: 'Assign Provider' },
    },
  },
  fitness: {
    appointment: {
      service_type:    { label: 'Class / Session', placeholder: 'Select a class or session' },
      service_address: { label: 'Studio Location' },
      customer_name:   { label: 'Member Name' },
      technician:      { label: 'Assign Trainer' },
    },
    customer:   { customer_name: { label: 'Member' } },
  },
  restaurants: {
    appointment: {
      service_type:    { label: 'Reservation Type', placeholder: 'Dine-in, private event…' },
      service_address: { label: 'Restaurant' },
      customer_name:   { label: 'Guest Name' },
      technician:      { label: 'Assign Host / Server' },
      notes:           { label: 'Reservation Notes', placeholder: 'Allergies, occasion, seating preference' },
    },
    customer:   { customer_name: { label: 'Guest' } },
  },
  auto_care: {
    appointment: {
      service_type:    { label: 'Repair Order Type' },
      service_address: { label: 'Drop-off Address' },
      technician:      { label: 'Assign Technician' },
    },
  },
  professional: {
    appointment: {
      service_type:    { label: 'Meeting Type' },
      service_address: { label: 'Meeting Location' },
      customer_name:   { label: 'Client Name' },
      technician:      { label: 'Assign Consultant' },
    },
    customer:   { customer_name: { label: 'Client' } },
  },
  personal_assistant: {
    appointment: {
      service_type:    { label: 'Errand Type' },
      service_address: { label: 'Errand Location' },
      technician:      { label: 'Assign Concierge' },
    },
  },
  landscape: {
    appointment: {
      service_type:    { label: 'Visit Type' },
      service_address: { label: 'Property Address' },
      technician:      { label: 'Assign Crew' },
    },
  },
  pool_spa: {
    appointment: {
      service_type:    { label: 'Service Visit Type' },
      service_address: { label: 'Property Address' },
      technician:      { label: 'Assign Pool Tech' },
    },
  },
  pest_control: {
    appointment: {
      service_type:    { label: 'Treatment Type' },
      service_address: { label: 'Property Address' },
      technician:      { label: 'Assign Pest Tech' },
    },
  },
};

export function getIndustryFieldLabel(
  surface: FieldSurface,
  field: FieldKey,
  pack: IndustryPack | null | undefined,
): FieldLabel {
  const industryId = pack?.industry_id ?? 'generic';
  const cluster = pack?.cluster;
  return (
    BY_INDUSTRY[industryId]?.[surface]?.[field] ??
    (cluster ? BY_CLUSTER[cluster]?.[surface]?.[field] : undefined) ??
    GENERIC[surface]?.[field] ??
    { label: field }
  );
}

/**
 * Convenience hook — resolves the active company's pack and returns a
 * label-fetcher bound to the given surface.
 */
import { useIndustryPack } from '@/hooks/useIndustryPack';

export function useIndustryFieldLabel(surface: FieldSurface) {
  const { pack } = useIndustryPack();
  return (field: FieldKey): FieldLabel =>
    getIndustryFieldLabel(surface, field, pack);
}