import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves the primary company a logged-in customer is associated with via
 * `customer_company_associations`. Returns the first association — multi-company
 * customers can switch later via the existing AIAgentConsole company picker.
 */
export function useCustomerPrimaryCompany() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('customer_company_associations')
        .select('company_id')
        .eq('customer_user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setCompanyId(data?.company_id ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { companyId, loading };
}
