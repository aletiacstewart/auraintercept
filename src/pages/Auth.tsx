import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * /auth — legacy entry point.
 * Splits into /signin and /signup based on query params.
 *   ?tab=login           → /signin
 *   ?source=qr           → /signin (QR install flows always sign in)
 *   ?mode=employee       → /signin (employees join via registration code, not public signup)
 *   ?mode=platform_admin → /signin (PA accounts are created manually)
 *   ?mode=reset          → /signin (forgot-password redirect)
 *   else                 → /signup
 * All other query params (mode, tier, industry, source) are preserved.
 */
export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const mode = searchParams.get('mode');
    const source = searchParams.get('source');

    const goSignIn =
      tab === 'login' ||
      source === 'qr' ||
      mode === 'employee' ||
      mode === 'platform_admin' ||
      mode === 'reset';

    // Strip the `tab` param (no longer needed); keep everything else.
    const params = new URLSearchParams(searchParams);
    params.delete('tab');
    const qs = params.toString();
    const target = `${goSignIn ? '/signin' : '/signup'}${qs ? `?${qs}` : ''}`;
    navigate(target, { replace: true });
  }, [searchParams, navigate]);

  return null;
}
