/**
 * Normalize phone number to E.164 format for consistent matching with SignalWire.
 * 
 * SignalWire requires E.164 format (+14847372424) but the database may store
 * human-readable formats (+1 (484) 737-2424).
 * 
 * @param phone - Phone number in any format
 * @returns Phone number in E.164 format (e.g., +14847372424)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Ensure E.164 format
  if (!normalized.startsWith('+') && normalized.length === 11 && normalized.startsWith('1')) {
    // 11 digits starting with 1 (US number without +)
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+') && normalized.length === 10) {
    // 10 digits (US number without country code)
    normalized = '+1' + normalized;
  }
  
  return normalized;
}
