import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Sparkles, ExternalLink, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SignupRow {
  id: string;
  name: string;
  subscription_tier: string | null;
  industry_vertical: string | null;
  trial_ends_at: string | null;
  created_at: string;
  is_demo: boolean | null;
}

function trialDay(trialEndsAt: string | null): string {
  if (!trialEndsAt) return '—';
  const end = new Date(trialEndsAt).getTime();
  const daysRemaining = Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
  const day = Math.min(60, Math.max(1, 60 - daysRemaining));
  return `Day ${day}/60`;
}

export function NewSignupsWidget() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-recent-signups'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, subscription_tier, industry_vertical, trial_ends_at, created_at, is_demo')
        .eq('is_demo', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as SignupRow[];
    },
  });

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              New Signups (last 7 days)
            </CardTitle>
            <CardDescription>Live feed of companies joining the platform.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/companies')}>
            <Building2 className="w-4 h-4 mr-1.5" />
            All companies
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No new signups yet this week. They'll appear here automatically the moment someone joins.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {c.subscription_tier ?? 'starter'}
                    </Badge>
                    {c.industry_vertical && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.industry_vertical}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {trialDay(c.trial_ends_at)} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/dashboard/companies?focus=${c.id}`)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}