export interface CalendarEventMapping {
  google_event_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
}

export interface Appointment {
  id: string;
  company_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: string;
  datetime: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  intake_data?: unknown;
  job_status?: string;
  job_id?: string;
  job_employee_id?: string | null;
  job_employee_name?: string | null;
  calendar_sync?: CalendarEventMapping | null;
}

export interface CalendarSyncSummary {
  synced: number;
  notSynced: number;
  failed: number;
}

export const APPOINTMENTS_QUERY_KEY = 'employee-calendar-appointments';
