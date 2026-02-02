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
  // Lovable preview environments use:
  // 1. *.lovableproject.com (legacy)
  // 2. id-preview--*.lovable.app (current)
  // Published apps typically use *.lovable.app (without id-preview--) or a custom domain.
  try {
    const host = new URL(origin).host;
    return host.endsWith('.lovableproject.com') || host.startsWith('id-preview--');
  } catch {
    // If caller passed a raw origin string, do a best-effort check.
    return origin.includes('lovableproject.com') || origin.includes('id-preview--');
  }
}

