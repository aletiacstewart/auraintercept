// ICS Calendar Utilities
import { parseUTCDateTime } from '@/lib/dateUtils';

/**
 * Generate a webcal:// URL for subscribing to a calendar feed
 */
export function getCalendarSubscribeUrl(token: string, type: 'employee' | 'company'): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Convert https:// to webcal:// for calendar subscription
  const baseUrl = supabaseUrl.replace('https://', 'webcal://');
  return `${baseUrl}/functions/v1/calendar-feed?token=${token}&type=${type}`;
}

/**
 * Generate an HTTP URL for viewing the calendar feed in a browser
 */
export function getCalendarFeedUrl(token: string, type: 'employee' | 'company'): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/calendar-feed?token=${token}&type=${type}`;
}

/**
 * Generate a URL for downloading a single appointment as ICS
 */
export function getAppointmentIcsUrl(appointmentId: string, customerToken: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/calendar-feed?type=appointment&appointment_id=${appointmentId}&token=${customerToken}`;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ)
 */
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Escape special characters for ICS content
 */
function escapeICS(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate ICS content for a single appointment (client-side)
 * Used for quick "Add to Calendar" button without server round-trip
 */
export function generateAppointmentICS(appointment: {
  id: string;
  datetime: string;
  duration_minutes?: number;
  service_type: string;
  customer_name?: string;
  customer_address?: string;
  notes?: string;
  created_at?: string;
}, companyName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lovable//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
  ];

  const startDate = parseUTCDateTime(appointment.datetime);
  const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);
  const createdDate = appointment.created_at ? new Date(appointment.created_at) : new Date();

  lines.push(`UID:${appointment.id}@lovable.app`);
  lines.push(`DTSTAMP:${formatDateToICS(createdDate)}`);
  lines.push(`DTSTART:${formatDateToICS(startDate)}`);
  lines.push(`DTEND:${formatDateToICS(endDate)}`);
  lines.push(`SUMMARY:${escapeICS(appointment.service_type)} with ${escapeICS(companyName)}`);
  
  if (appointment.customer_address) {
    lines.push(`LOCATION:${escapeICS(appointment.customer_address)}`);
  }
  
  const description = [
    `Service: ${appointment.service_type}`,
    `Provider: ${companyName}`,
    appointment.notes ? `Notes: ${appointment.notes}` : null,
  ].filter(Boolean).join("\\n");
  
  lines.push(`DESCRIPTION:${escapeICS(description)}`);
  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Download ICS file for an appointment
 */
export function downloadAppointmentICS(appointment: {
  id: string;
  datetime: string;
  duration_minutes?: number;
  service_type: string;
  customer_name?: string;
  customer_address?: string;
  notes?: string;
  created_at?: string;
}, companyName: string): void {
  const icsContent = generateAppointmentICS(appointment, companyName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `appointment-${appointment.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
