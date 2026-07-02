import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ArrowLeft, Mail, MessageSquare, CheckCircle2, XCircle, Eye, MousePointer } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AuraEmptyState } from '@/components/ui/aura-empty-state';
import { Send } from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyId } = useAuth();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: sends } = useQuery({
    queryKey: ['campaign-sends', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_sends').select('*').eq('campaign_id', id!).order('sent_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const duplicate = async () => {
    if (!campaign) return;
    const { data, error } = await supabase.from('marketing_campaigns').insert({
      company_id: companyId,
      name: `${campaign.name} (Copy)`,
      campaign_type: campaign.campaign_type,
      channels: campaign.channels,
      email_subject: campaign.email_subject,
      message_template: campaign.message_template,
      target_segment: campaign.target_segment,
      discount_type: campaign.discount_type,
      discount_value: campaign.discount_value,
      status: 'draft',
    }).select('id').single();
    if (error) { toast.error('Failed to duplicate'); return; }
    toast.success('Campaign duplicated');
    navigate(`/dashboard/campaigns/${data.id}`);
  };

  if (isLoading) {
    return <DashboardLayout><PageContainer><Skeleton className="h-64" /></PageContainer></DashboardLayout>;
  }
  if (!campaign) {
    return <DashboardLayout><PageContainer><p>Campaign not found.</p></PageContainer></DashboardLayout>;
  }

  const totalSent = sends?.filter(s => s.status === 'sent').length || 0;
  const totalFailed = sends?.filter(s => s.status === 'failed').length || 0;
  const totalOpened = sends?.filter(s => s.opened_at).length || 0;
  const totalClicked = sends?.filter(s => s.clicked_at).length || 0;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/campaigns"><ArrowLeft className="h-4 w-4 mr-2" />Back to Campaigns</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={duplicate}>Duplicate</Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize mt-1">
                    {campaign.campaign_type} • {campaign.target_segment} • {(campaign.channels || []).join(', ')}
                  </p>
                </div>
                <Badge variant="outline">{campaign.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {campaign.email_subject && (
                <div><span className="text-muted-foreground">Subject: </span>{campaign.email_subject}</div>
              )}
              {campaign.message_template && (
                <div className="whitespace-pre-wrap rounded border p-3 bg-muted/40">{campaign.message_template}</div>
              )}
              {campaign.last_sent_at && (
                <div className="text-xs text-muted-foreground">
                  Last sent {format(new Date(campaign.last_sent_at), 'MMM d, yyyy h:mm a')}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={CheckCircle2} label="Delivered" value={totalSent} color="text-green-500" />
            <StatCard icon={XCircle} label="Failed" value={totalFailed} color="text-red-500" />
            <StatCard icon={Eye} label="Opened" value={totalOpened} color="text-blue-500" />
            <StatCard icon={MousePointer} label="Clicked" value={totalClicked} color="text-purple-500" />
          </div>

          <Card>
            <CardHeader><CardTitle>Recipients</CardTitle></CardHeader>
            <CardContent>
              {!sends || sends.length === 0 ? (
                <AuraEmptyState
                  compact
                  icon={Send}
                  title="No sends yet"
                  description='Click "Send Now" from the campaigns list to dispatch this campaign.'
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-3">Customer</th>
                        <th className="py-2 pr-3">Recipient</th>
                        <th className="py-2 pr-3">Channel</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Sent</th>
                        <th className="py-2 pr-3">Opened</th>
                        <th className="py-2 pr-3">Clicked</th>
                        <th className="py-2 pr-3">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sends.map(s => (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{s.customer_name || '—'}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{s.recipient}</td>
                          <td className="py-2 pr-3">
                            {s.channel === 'email' ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant={s.status === 'sent' ? 'default' : 'destructive'}>{s.status}</Badge>
                          </td>
                          <td className="py-2 pr-3 text-xs">{s.sent_at ? format(new Date(s.sent_at), 'MMM d, h:mm a') : '—'}</td>
                          <td className="py-2 pr-3 text-xs">{s.opened_at ? format(new Date(s.opened_at), 'MMM d, h:mm a') : '—'}</td>
                          <td className="py-2 pr-3 text-xs">{s.clicked_at ? format(new Date(s.clicked_at), 'MMM d, h:mm a') : '—'}</td>
                          <td className="py-2 pr-3 text-xs text-red-500 max-w-xs truncate">{s.error || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </CardContent></Card>
  );
}