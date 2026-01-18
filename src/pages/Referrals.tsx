import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Users, Plus, Copy, Gift, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function Referrals() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    referrer_name: '',
    referrer_email: '',
    referrer_phone: '',
    reward_type: 'discount',
    reward_value: 10,
  });

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_referrals')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const stats = {
    total: referrals?.length || 0,
    pending: referrals?.filter(r => r.status === 'pending').length || 0,
    converted: referrals?.filter(r => r.status === 'converted').length || 0,
    rewardsIssued: referrals?.filter(r => r.reward_issued_at).length || 0,
  };

  const createReferral = useMutation({
    mutationFn: async () => {
      const referralCode = `REF-${Date.now().toString(36).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const { error } = await supabase.from('customer_referrals').insert({
        company_id: companyId,
        referrer_name: formData.referrer_name,
        referrer_email: formData.referrer_email || null,
        referrer_phone: formData.referrer_phone || null,
        referral_code: referralCode,
        reward_type: formData.reward_type,
        reward_value: formData.reward_value,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      });
      if (error) throw error;
      return referralCode;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast.success(`Referral code created: ${code}`);
      setDialogOpen(false);
      setFormData({
        referrer_name: '',
        referrer_email: '',
        referrer_phone: '',
        reward_type: 'discount',
        reward_value: 10,
      });
    },
    onError: () => toast.error('Failed to create referral'),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="gap-1 bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="h-3 w-3" /> Converted</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Expired</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Gift}
            title="Referral Program"
            description="Manage customer referrals and rewards"
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Referral Code
              </Button>
            }
          />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Referral Code</DialogTitle>
                <DialogDescription>Create a unique referral code for a customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Referrer Name *</Label>
                  <Input
                    value={formData.referrer_name}
                    onChange={(e) => setFormData(p => ({ ...p, referrer_name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.referrer_email}
                      onChange={(e) => setFormData(p => ({ ...p, referrer_email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.referrer_phone}
                      onChange={(e) => setFormData(p => ({ ...p, referrer_phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reward Type</Label>
                    <Input
                      value={formData.reward_type}
                      onChange={(e) => setFormData(p => ({ ...p, reward_type: e.target.value }))}
                      placeholder="discount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reward Value (%)</Label>
                    <Input
                      type="number"
                      value={formData.reward_value}
                      onChange={(e) => setFormData(p => ({ ...p, reward_value: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createReferral.mutate()}
                  disabled={!formData.referrer_name || createReferral.isPending}
                  className="w-full"
                >
                  Generate Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Referrals</CardDescription>
                <CardTitle className="text-3xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Clock className="h-6 w-6 text-amber-500" />
                  {stats.pending}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Converted</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  {stats.converted}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rewards Issued</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Gift className="h-6 w-6 text-purple-500" />
                  {stats.rewardsIssued}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Referrals List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : referrals?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No referrals yet</h3>
                <p className="text-muted-foreground text-sm">Generate your first referral code</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {referrals?.map(referral => (
                <Card key={referral.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{referral.referrer_name}</h3>
                          {getStatusBadge(referral.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">{referral.referral_code}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyCode(referral.referral_code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {referral.referred_name && (
                          <p className="text-sm text-muted-foreground">
                            Referred: {referral.referred_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          Created: {format(new Date(referral.created_at), 'MMM d, yyyy')}
                        </p>
                        {referral.expires_at && (
                          <p className="text-muted-foreground">
                            Expires: {format(new Date(referral.expires_at), 'MMM d, yyyy')}
                          </p>
                        )}
                        {referral.reward_value && (
                          <Badge variant="outline" className="mt-1">
                            {referral.reward_value}% {referral.reward_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
