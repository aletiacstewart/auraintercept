export function normalizePublicBaseUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.origin;
  } catch {
    return null;
  }
}

export function isLovablePreviewOrigin(origin: string): boolean {
  // Preview / staging environments used during development. Production
  // traffic is served from auraintercept.ai (see published-domain standard).
  try {
    const host = new URL(origin).host;
    return host.endsWith('.lovableproject.com') || host.startsWith('id-preview--');
  } catch {
    // If caller passed a raw origin string, do a best-effort check.
    return origin.includes('lovableproject.com') || origin.includes('id-preview--');
  }
}

/**
 * Detects if the current page is running in a Lovable preview environment.
 * Preview environments cannot complete OAuth flows due to iframe/proxy restrictions.
 */
export function isLovablePreviewDomain(): boolean {
  const host = window.location.hostname;
  return host.endsWith('.lovableproject.com') || host.includes('id-preview--');
}

/**
 * Returns the published domain for this project.
 * Used to redirect users to the correct domain for OAuth flows.
 */
export function getPublishedDomain(): string {
  return 'https://auraintercept.ai';
}

