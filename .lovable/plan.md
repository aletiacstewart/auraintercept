
# Fix Public App URL and Preview Detection

## Summary
Update the preview URL detection to catch the `id-preview--*.lovable.app` pattern and provide a database update to fix the current company's Public App URL.

---

## Current Issues

| Issue | Current Value | Expected |
|-------|--------------|----------|
| Public App URL | `https://id-preview--99d7b46d-c78f-4a80-b304-345e37b67f40.lovable.app` | `https://auraintercept.lovable.app` |
| Preview Detection | Only checks `.lovableproject.com` | Should also check `id-preview--*.lovable.app` |

---

## Changes

### 1. Update `src/lib/url.ts`

**Fix `isLovablePreviewOrigin` to detect both preview patterns:**

```typescript
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
```

---

### 2. Update Company's Public App URL

**Run SQL to update the Aura Intercept company:**

```sql
UPDATE companies 
SET public_app_url = 'https://auraintercept.lovable.app'
WHERE id = '04c57cbe-358e-4036-a3ad-b777a55f5be0';
```

This will immediately fix the QR codes for all three app installation pages.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/url.ts` | Add `id-preview--` pattern detection |
| Database | Update `public_app_url` for Aura Intercept company |

---

## Result

After these changes:
- The validation in `PublicAppUrlSettings.tsx` will reject any `id-preview--*.lovable.app` URLs
- The QR codes will point to `https://auraintercept.lovable.app/field-ops-app`, etc.
- Users can install the apps without needing a Lovable account
