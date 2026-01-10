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
  // Lovable preview environments use *.lovableproject.com and are gated behind Lovable login.
  // Published apps typically use *.lovable.app or a custom domain.
  try {
    const host = new URL(origin).host;
    return host.endsWith('.lovableproject.com');
  } catch {
    // If caller passed a raw origin string, do a best-effort check.
    return origin.includes('lovableproject.com');
  }
}

