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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Megaphone, Plus, Send, TrendingUp, Eye, MousePointer, Users, Mail, MessageSquare } from 'lucide-react';

export default function Campaigns() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Marketing Campaigns
            </h1>
            <p className="text-muted-foreground">
              Create and track marketing campaigns
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
                <DialogDescription>Set up a new marketing campaign</DialogDescription>
              </DialogHeader>
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
                  <Label>Email Subject</Label>
                  <Input
                    value={formData.email_subject}
                    onChange={(e) => setFormData(p => ({ ...p, email_subject: e.target.value }))}
                    placeholder="Special offer just for you!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message Template</Label>
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
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Campaigns</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Messages Sent</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                {stats.totalSent}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Opened</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-500" />
                {stats.totalOpened}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Clicked</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-purple-500" />
                {stats.totalClicked}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversions</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                {stats.totalConverted}
              </CardTitle>
            </CardHeader>
          </Card>
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
    </DashboardLayout>
  );
}
