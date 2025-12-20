import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { X, Gift, Plus, Search, Send, Mail, MessageSquare, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralFormProps {
  companyId: string;
  onCancel: () => void;
}

export const ReferralForm: React.FC<ReferralFormProps> = ({ companyId, onCancel }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    referrerName: '',
    referrerEmail: '',
    referrerPhone: '',
    referredName: '',
    referredEmail: '',
    referredPhone: '',
    rewardType: 'percent',
    rewardValue: '10',
    sendEmail: false,
    sendSms: false,
  });

  // Fetch existing referrals
  const { data: referrals } = useQuery({
    queryKey: ['referrals', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_referrals')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createReferral = useMutation({
    mutationFn: async () => {
      const referralCode = generateReferralCode();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 month expiry

      const { data, error } = await supabase
        .from('customer_referrals')
        .insert({
          company_id: companyId,
          referrer_name: formData.referrerName,
          referrer_email: formData.referrerEmail || null,
          referrer_phone: formData.referrerPhone || null,
          referred_name: formData.referredName || null,
          referred_email: formData.referredEmail || null,
          referred_phone: formData.referredPhone || null,
          referral_code: referralCode,
          reward_type: formData.rewardType,
          reward_value: parseFloat(formData.rewardValue),
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Referral created! Code: ${data.referral_code}`);
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setFormData({
        referrerName: '',
        referrerEmail: '',
        referrerPhone: '',
        referredName: '',
        referredEmail: '',
        referredPhone: '',
        rewardType: 'percent',
        rewardValue: '10',
        sendEmail: false,
        sendSms: false,
      });
    },
    onError: (error) => {
      toast.error('Failed to create referral: ' + error.message);
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referrerName) {
      toast.error('Please enter referrer name');
      return;
    }
    createReferral.mutate();
  };

  const filteredReferrals = referrals?.filter(r => 
    r.referrer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.referred_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <Card className="border-pink-200 bg-pink-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-pink-600" />
            Referral Program
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-1" />
              New Referral
            </TabsTrigger>
            <TabsTrigger value="existing">
              <Search className="h-4 w-4 mr-1" />
              Track Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Referrer Info */}
              <div className="space-y-3 p-3 rounded-lg border bg-background">
                <h4 className="font-medium text-sm">Referrer (Existing Customer)</h4>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="John Smith"
                    value={formData.referrerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, referrerName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="john@email.com"
                      value={formData.referrerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, referrerEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="(555) 123-4567"
                      value={formData.referrerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, referrerPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Referred Info (optional) */}
              <div className="space-y-3 p-3 rounded-lg border bg-background">
                <h4 className="font-medium text-sm">Referred (New Customer - Optional)</h4>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Jane Doe"
                    value={formData.referredName}
                    onChange={(e) => setFormData(prev => ({ ...prev, referredName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="jane@email.com"
                      value={formData.referredEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, referredEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="(555) 987-6543"
                      value={formData.referredPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, referredPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Reward */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Reward Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rewardType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage Off</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="credit">Account Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reward Value</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, rewardValue: e.target.value }))}
                  />
                </div>
              </div>

              {/* Send Options */}
              <div className="space-y-2">
                <Label>Send Referral Code Via</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="send-email"
                      checked={formData.sendEmail}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendEmail: !!checked }))}
                    />
                    <Label htmlFor="send-email" className="flex items-center gap-1 text-sm cursor-pointer">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="send-sms"
                      checked={formData.sendSms}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendSms: !!checked }))}
                    />
                    <Label htmlFor="send-sms" className="flex items-center gap-1 text-sm cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createReferral.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createReferral.isPending ? 'Creating...' : 'Create Referral'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="existing">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredReferrals?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No referrals found</p>
                ) : (
                  filteredReferrals?.map((referral) => (
                    <div
                      key={referral.id}
                      className="p-3 rounded-lg border bg-background"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-pink-600">
                            {referral.referral_code}
                          </code>
                          <Badge className={getStatusColor(referral.status)}>
                            {referral.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyCode(referral.referral_code)}
                        >
                          {copiedCode === referral.referral_code ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Referrer:</span> {referral.referrer_name}
                      </p>
                      {referral.referred_name && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Referred:</span> {referral.referred_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Reward: {referral.reward_type === 'percent' ? `${referral.reward_value}%` : `$${referral.reward_value}`}
                        {referral.expires_at && ` • Expires ${format(new Date(referral.expires_at), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
