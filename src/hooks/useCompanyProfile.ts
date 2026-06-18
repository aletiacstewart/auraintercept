import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProfileKey,
  ProfileSpec,
  getProfileSpec,
  PROFILE_SPECS,
} from '@/lib/industryProfiles';
import { getProfileForBusinessType } from '@/lib/businessTypeProfileMap';

/**
 * Resolves the company's profile key with this priority:
 *   1. `companies.profile_key`  (explicit override)
 *   2. `getProfileForBusinessType(companies.industry_vertical)`
 *   3. PROFILE_D (safe default)
 */

const cache = new Map<string, ProfileKey>();

interface UseCompanyProfileResult {
  profileKey: ProfileKey;
  spec: ProfileSpec;
  loading: boolean;
}

export function useCompanyProfile(
  companyIdOverride?: string | null,
): UseCompanyProfileResult {
  const { companyId: authCompanyId } = useAuth();
  const companyId = companyIdOverride ?? authCompanyId;

  const initial: ProfileKey =
    (companyId && cache.get(companyId)) || 'PROFILE_D';
  const [profileKey, setProfileKey] = useState<ProfileKey>(initial);
  const [loading, setLoading] = useState<boolean>(
    !!companyId && !cache.has(companyId),
  );

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setProfileKey('PROFILE_D');
      setLoading(false);
      return;
    }
    const cached = cache.get(companyId);
    if (cached) {
      setProfileKey(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('profile_key, industry_vertical')
        .eq('id', companyId)
        .maybeSingle();
      if (cancelled) return;
      const row = data as { profile_key?: string | null; industry_vertical?: string | null } | null;
      let resolved: ProfileKey = 'PROFILE_D';
      if (row?.profile_key && row.profile_key in PROFILE_SPECS) {
        resolved = row.profile_key as ProfileKey;
      } else if (row?.industry_vertical) {
        resolved = getProfileForBusinessType(row.industry_vertical);
      }
      cache.set(companyId, resolved);
      setProfileKey(resolved);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { profileKey, spec: getProfileSpec(profileKey), loading };
}

/** Test-only: reset the in-memory cache between specs. */
export function __resetCompanyProfileCache() {
  cache.clear();
}