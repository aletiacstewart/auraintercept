import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function formatUptime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / 86400000);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainDays = days % 30;
  if (years > 0) return `${years}y ${months}m ${remainDays}d`;
  if (months > 0) return `${months}m ${remainDays}d`;
  return `${days}d`;
}

export function useCompanyUptime(companyId?: string | null) {
  const { data } = useQuery({
    queryKey: ['company-uptime', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('created_at')
        .eq('id', companyId)
        .single();
      return data?.created_at ?? null;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 60, // 1 hour — created_at never changes
  });

  return {
    companyCreatedAt: data ?? null,
    uptimeDisplay: data ? formatUptime(data) : null,
  };
}
