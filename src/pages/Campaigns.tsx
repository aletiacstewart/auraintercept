import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { FormShell } from '@/components/ui/form-shell';
import { InlineFormProvider, InlineFormHost } from '@/components/ui/inline-form-tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Megaphone, Plus, Send, TrendingUp, Eye, MousePointer, Users, Mail, MessageSquare, Sparkles, Loader2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { getPageHeader } from '@/lib/industryNavLabels';
import { MetricCard } from '@/components/ui/metric-card';
import { PageContainer } from '@/components/ui/page-container';
import { CampaignSeriesWizard } from '@/components/marketing/CampaignSeriesWizard';

export default function Campaigns() {
  const { companyId } = useAuth();
  const { pack } = useIndustryPack();
  const campaignsHeader = getPageHeader('campaigns', pack);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSeriesWizard, setShowSeriesWizard] = useState(false);
  const [generatingSubject, setGeneratingSubject] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'promotional',
    channels: ['email'],
    email_subject: '',
    message_template: '',
    target_segment: 'all',
    discount_type: '',
    discount_value: 0,
  });

  const generateContent = async (field: 'subject' | 'message') => {
    const setLoading = field === 'subject' ? setGeneratingSubject : setGeneratingMessage;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          campaignType: formData.campaign_type,
          targetSegment: formData.target_segment,
          companyName: 'our company',
          field,
          companyId,
        },
      });
      if (error) throw error;
      if (data?.content) {
        if (field === 'subject') {
          setFormData(p => ({ ...p, email_subject: data.content }));
        } else {
          setFormData(p => ({ ...p, message_template: data.content }));
        }
        toast.success('Content generated!');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const stats = {
    total: campaigns?.length || 0,
    active: campaigns?.filter(c => c.status === 'active').length || 0,
    totalSent: campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0,
    totalOpened: campaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0,
    totalClicked: campaigns?.reduce((sum, c) => sum + (c.total_clicked || 0), 0) || 0,
    totalConverted: campaigns?.reduce((sum, c) => sum + (c.total_converted || 0), 0) || 0,
  };

  const createCampaign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('marketing_campaigns').insert({
        company_id: companyId,
        name: formData.name,
        campaign_type: formData.campaign_type,
        channels: formData.channels,
        email_subject: formData.email_subject || null,
        message_template: formData.message_template || null,
        target_segment: formData.target_segment,
        discount_type: formData.discount_type || null,
        discount_value: formData.discount_value || null,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
      setDialogOpen(false);
      setFormData({
        name: '',
        campaign_type: 'promotional',
        channels: ['email'],
        email_subject: '',
        message_template: '',
        target_segment: 'all',
        discount_type: '',
        discount_value: 0,
      });
    },
    onError: () => toast.error('Failed to create campaign'),
  });

  const sendCampaign = async (campaignId: string, name: string) => {
    const ok = window.confirm(
      `Send "${name}" now?\n\n` +
      `This will dispatch the campaign to matching customers via the channels you selected (email and/or SMS). ` +
      `Email and SMS usage is billed by your own Resend / SignalWire accounts.`
    );
    if (!ok) return;
    setSendingId(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: { campaignId },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const failed = (data as any)?.failed ?? 0;
      toast.success(`Campaign sent: ${sent} delivered${failed ? `, ${failed} failed` : ''}.`);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (e: any) {
      toast.error('Failed to send campaign: ' + (e?.message || 'unknown error'));
    } finally {
      setSendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getChannelIcons = (channels: string[]) => {
    return (
      <div className="flex items-center gap-1">
        {channels?.includes('email') && <Mail className="h-3 w-3 text-muted-foreground" />}
        {channels?.includes('sms') && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <InlineFormProvider>
        {showSeriesWizard && companyId ? (
          <CampaignSeriesWizard
            companyId={companyId}
            onCancel={() => setShowSeriesWizard(false)}
            onSuccess={() => setShowSeriesWizard(false)}
          />
        ) : (
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={Megaphone}
          title={campaignsHeader.title}
          description={campaignsHeader.description}
          showAuraBar
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSeriesWizard(true)}>
                <Layers className="h-4 w-4 mr-2" /> Batch Series
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Campaign
              </Button>
              <FormShell
                id="create-campaign"
                title="Create Campaign"
                description="Set up a new marketing campaign"
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                className="max-w-lg"
              >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Summer Promotion"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.campaign_type}
                      onValueChange={(v) => setFormData(p => ({ ...p, campaign_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="winback">Win-back</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Segment</Label>
                    <Select
                      value={formData.target_segment}
                      onValueChange={(v) => setFormData(p => ({ ...p, target_segment: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        <SelectItem value="new">New Customers</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email Subject</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateContent('subject')}
                      disabled={generatingSubject}
                      className="h-7 text-xs gap-1"
                    >
                      {generatingSubject ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI Generate
                    </Button>
                  </div>
                  <Input
                    value={formData.email_subject}
                    onChange={(e) => setFormData(p => ({ ...p, email_subject: e.target.value }))}
                    placeholder="Special offer just for you!"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message Template</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateContent('message')}
                      disabled={generatingMessage}
                      className="h-7 text-xs gap-1"
                    >
                      {generatingMessage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      AI Generate
                    </Button>
                  </div>
                  <Textarea
                    value={formData.message_template}
                    onChange={(e) => setFormData(p => ({ ...p, message_template: e.target.value }))}
                    placeholder="Hi {customer_name}, we have an exclusive offer..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(v) => setFormData(p => ({ ...p, discount_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData(p => ({ ...p, discount_value: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createCampaign.mutate()}
                  disabled={!formData.name || createCampaign.isPending}
                  className="w-full"
                >
                  Create Campaign
                </Button>
              </div>
              </FormShell>
            </div>
          }
        />
        <InlineFormHost />

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <MetricCard
            icon={Megaphone}
            value={stats.total}
            label="Total Campaigns"
          />
          <MetricCard
            icon={Send}
            value={stats.totalSent}
            label="Messages Sent"
            iconColor="text-secondary"
          />
          <MetricCard
            icon={Eye}
            value={stats.totalOpened}
            label="Opened"
            iconColor="text-warning"
          />
          <MetricCard
            icon={MousePointer}
            value={stats.totalClicked}
            label="Clicked"
            iconColor="text-purple-400"
          />
          <MetricCard
            icon={TrendingUp}
            value={stats.totalConverted}
            label="Conversions"
            valueColor="success"
            iconColor="text-green-400"
          />
        </div>

        {/* Campaigns List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : campaigns?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No campaigns yet</h3>
              <p className="text-muted-foreground text-sm">Create your first marketing campaign</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns?.map(campaign => {
              const openRate = campaign.total_sent > 0 
                ? ((campaign.total_opened || 0) / campaign.total_sent * 100).toFixed(1) 
                : 0;
              const clickRate = campaign.total_opened > 0 
                ? ((campaign.total_clicked || 0) / campaign.total_opened * 100).toFixed(1) 
                : 0;

              return (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          {getChannelIcons(campaign.channels || [])}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {campaign.campaign_type} • {campaign.target_segment}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => sendCampaign(campaign.id, campaign.name)}
                        disabled={sendingId === campaign.id || !(campaign.channels?.length)}
                      >
                        {sendingId === campaign.id ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" />{campaign.status === 'draft' ? 'Send Now' : 'Send Again'}</>
                        )}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/dashboard/campaigns/${campaign.id}`}>View Details</Link>
                      </Button>
                      {campaign.last_sent_at && (
                        <span className="self-center text-xs text-muted-foreground">
                          Last sent {format(new Date(campaign.last_sent_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Sent</p>
                        <p className="font-medium">{campaign.total_sent || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Open Rate</p>
                        <p className="font-medium">{openRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Click Rate</p>
                        <p className="font-medium">{clickRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversions</p>
                        <p className="font-medium">{campaign.total_converted || 0}</p>
                      </div>
                    </div>
                    {campaign.total_sent > 0 && (
                      <div className="mt-3">
                        <Progress value={Number(openRate)} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
        )}
        </InlineFormProvider>
      </PageContainer>
    </DashboardLayout>
  );
}
