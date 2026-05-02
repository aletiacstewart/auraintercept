import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DemoCredentialsCard, DemoCredentialsResult } from '@/components/marketing/DemoCredentialsCard';

export default function DemoAccess() {
  const { trialId } = useParams<{ trialId: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DemoCredentialsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Your Aura Intercept Demo';
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!trialId) {
        setError('Missing demo link.');
        setLoading(false);
        return;
      }
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_demo_trial_access', {
          p_trial_id: trialId,
        });
        if (rpcErr) throw rpcErr;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setError('This demo link has expired or is no longer active. Start a new demo from /for-business.');
          setLoading(false);
          return;
        }
        setResult({
          success: true,
          trial_id: row.trial_id,
          expires_at: row.expires_at,
          password: 'auratrial*!',
          share_url: `${window.location.origin}/demo/${row.trial_id}`,
          admin: { email: row.admin_email, redirect: '/dashboard' },
          employee: { email: row.employee_email, redirect: '/technician' },
          customer: { email: row.customer_email, redirect: '/customer-portal' },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load demo';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trialId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-primary font-semibold">
            <Sparkles className="w-5 h-5" />
            Aura Intercept · 48-Hour Demo
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
            Your demo is ready
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            One link, three logins — try Aura as the owner, a tech, and a customer.
          </p>
        </div>
        <Card className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your demo...
            </div>
          )}
          {!loading && error && (
            <div className="flex items-start gap-3 py-6 text-sm">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-foreground">{error}</p>
            </div>
          )}
          {!loading && result && <DemoCredentialsCard result={result} />}
        </Card>
      </div>
    </div>
  );
}
