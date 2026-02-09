/**
 * Parses a UTC datetime string and returns a Date object where the local time
 * components match the UTC values. This prevents JavaScript's automatic timezone
 * conversion from shifting displayed times.
 * 
 * Example: "2025-01-15T12:30:00+00" stored in DB as UTC 12:30
 * Without this: displays as 6:30 AM in CST (UTC-6)
 * With this: displays as 12:30 PM regardless of timezone
 */
export function parseUTCDateTime(datetime: string): Date {
  const d = new Date(datetime);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}
