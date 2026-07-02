import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { UserCog, Shield, User, Wrench, ExternalLink, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

type Role = 'admin' | 'employee' | 'customer';

const ROLES: { key: Role; label: string; icon: typeof Shield; description: string }[] = [
  { key: 'admin', label: 'Company Admin', icon: Shield, description: 'Full owner console' },
  { key: 'employee', label: 'Technician', icon: Wrench, description: 'Field / dispatch view' },
  { key: 'customer', label: 'Customer', icon: User, description: 'Portal experience' },
];

interface Pack {
  industry_id: string;
  label: string;
  cluster: string | null;
}

export default function SuperSwitcher() {
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const { data: packs, isLoading } = useQuery({
    queryKey: ['switcher-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industry_template_packs')
        .select('industry_id, label, cluster')
        .eq('is_active', true)
        .order('cluster')
        .order('label');
      if (error) throw error;
      return (data ?? []) as Pack[];
    },
  });

  const emailFor = (industryId: string, role: Role) =>
    `${industryId.replace(/_/g, '')}${role}@demo.com`;

  const openSession = async (industryId: string, role: Role) => {
    const email = emailFor(industryId, role);
    const key = `${industryId}:${role}`;
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke('super-switcher-magiclink', {
        body: { email, redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      if (!data?.success || !data?.action_link) {
        throw new Error(data?.error || 'No link returned');
      }
      window.open(data.action_link, '_blank', 'noopener,noreferrer');
      toast.success(`Opening ${email} in a new tab`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to mint magic link';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  const filtered = (packs ?? []).filter((p) =>
    !filter ||
    p.label.toLowerCase().includes(filter.toLowerCase()) ||
    p.industry_id.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={UserCog}
          title="Live Demo Superadmin"
          description="One-click sign-in to any demo account. Each card opens a fresh session in a new tab."
          featureColor="overview"
        />

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter industries…"
              className="pl-9"
            />
          </div>
          <Badge variant="outline">
            {isLoading ? '…' : `${filtered.length} industries × 3 roles`}
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((pack) => (
              <Card key={pack.industry_id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{pack.label}</CardTitle>
                    {pack.cluster && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {pack.cluster.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {pack.industry_id}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ROLES.map(({ key, label, icon: Icon, description }) => {
                    const busyKey = `${pack.industry_id}:${key}`;
                    const isBusy = busy === busyKey;
                    return (
                      <Button
                        key={key}
                        variant="outline"
                        className="w-full justify-between h-auto py-2 px-3"
                        disabled={isBusy || !!busy}
                        onClick={() => openSession(pack.industry_id, key)}
                      >
                        <span className="flex items-center gap-2 text-left">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="flex flex-col items-start">
                            <span className="text-sm">{label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {emailFor(pack.industry_id, key)}
                            </span>
                          </span>
                        </span>
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}