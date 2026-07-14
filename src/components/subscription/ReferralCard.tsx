import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Gift, MessageSquare, Loader2 } from 'lucide-react';

interface ReferralRow {
  id: string;
  referral_code: string;
  referred_email: string | null;
  status: string;
  created_at: string;
}

interface Props {
  companyId: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  signed_up: 'Signed up',
  converted: 'Converted',
  rewarded: 'Rewarded',
};

export function ReferralCard({ companyId }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);

  const shareLink = code ? `https://auraintercept.ai/for-business?ref=${code}` : '';
  const smsBody = code
    ? `I've been using Aura Intercept to run my business — thought you'd want to see it. Free 60-day trial: ${shareLink}`
    : '';

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: codeData, error: codeErr } = await supabase.rpc('get_or_create_referral_code', {
          p_company_id: companyId,
        });
        if (codeErr) throw codeErr;
        if (cancelled) return;
        setCode(codeData as unknown as string);

        const { data: rows, error: rowsErr } = await supabase
          .from('referrals')
          .select('id, referral_code, referred_email, status, created_at')
          .eq('referring_company_id', companyId)
          .order('created_at', { ascending: false });
        if (rowsErr) throw rowsErr;
        if (!cancelled) setReferrals((rows ?? []) as ReferralRow[]);
      } catch (err) {
        console.error('Referral load failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success('Referral link copied');
  };

  // Filter out the seed row (the one we own with no referred party) from the list display.
  const visibleReferrals = referrals.filter((r) => r.referred_email || r.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/15 p-2">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Refer a business, get a free month</CardTitle>
            <CardDescription>
              When another business signs up and completes checkout using your link, we credit
              you a free month and waive their onboarding fee.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your code…
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={shareLink} className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`sms:?&body=${encodeURIComponent(smsBody)}`}>
                    <MessageSquare className="h-4 w-4 mr-1.5" /> Text it
                  </a>
                </Button>
              </div>
            </div>

            {visibleReferrals.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Your referrals
                </p>
                <div className="divide-y rounded-md border">
                  {visibleReferrals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="truncate text-muted-foreground">
                        {r.referred_email ?? 'Anonymous signup'}
                      </span>
                      <Badge variant="secondary">{STATUS_LABEL[r.status] ?? r.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}