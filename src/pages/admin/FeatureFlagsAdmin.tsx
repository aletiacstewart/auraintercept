import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeatureFlagRow {
  id: string;
  flag_name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number | null;
  company_id: string | null;
}

export default function FeatureFlagsAdmin() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: async (): Promise<FeatureFlagRow[]> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('id, flag_name, description, enabled, rollout_percentage, company_id')
        .order('flag_name');
      if (error) throw error;
      return (data ?? []) as FeatureFlagRow[];
    },
    enabled: userRole === 'platform_admin',
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<FeatureFlagRow> }) => {
      const { error } = await supabase.from('feature_flags').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (userRole !== 'platform_admin') {
    return (
      <DashboardLayout>
        <PageContainer>
          <p className="text-muted-foreground">This page is restricted to platform administrators.</p>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Flag}
          title="Feature Flags"
          description="Turn platform features on or off, globally or for a single company."
        />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {(flags ?? []).map((flag) => (
              <Card key={flag.id}>
                <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{flag.flag_name}</span>
                      <Badge variant={flag.company_id ? 'secondary' : 'outline'} className="text-[10px]">
                        {flag.company_id ? 'Company override' : 'Global default'}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      Rollout %
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="h-8 w-20"
                        value={drafts[flag.id] ?? flag.rollout_percentage ?? 100}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [flag.id]: Number(e.target.value) }))
                        }
                        onBlur={() => {
                          const value = drafts[flag.id];
                          if (value === undefined || value === (flag.rollout_percentage ?? 100)) return;
                          update.mutate({
                            id: flag.id,
                            patch: { rollout_percentage: Math.max(0, Math.min(100, value)) },
                          });
                        }}
                      />
                    </label>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(checked) =>
                        update.mutate({ id: flag.id, patch: { enabled: checked } })
                      }
                      aria-label={`Toggle ${flag.flag_name}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {(flags ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No feature flags defined yet.</p>
            )}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
