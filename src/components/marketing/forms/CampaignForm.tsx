import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { X, Megaphone, Send, Mail, MessageSquare, Calendar, Sparkles, Loader2, Gift, TrendingUp, Tag, Users, Copy, RefreshCw } from 'lucide-react';
import { subDays } from 'date-fns';

interface CampaignFormProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: (data: { name: string; type: string }) => void;
}

// Fetch company name for AI context
const useCompanyName = (companyId: string) => {
  return useQuery({
    queryKey: ['company-name', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      return data?.name || '';
    },
  });
};

export const CampaignForm: React.FC<CampaignFormProps> = ({ companyId, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const { data: companyName } = useCompanyName(companyId);
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'promotional',
    targetSegment: 'all',
    emailSubject: '',
    messageTemplate: '',
    promoCode: '',
    discountType: 'percent',
    discountValue: '',
    startDate: '',
    endDate: '',
    channels: [] as string[],
    // Referral-specific fields
    referrerName: '',
    referrerEmail: '',
    referrerPhone: '',
    referredName: '',
    referredEmail: '',
    referredPhone: '',
    rewardType: 'percent',
    rewardValue: '10',
    referralCode: '',
    // Win-back specific fields
    inactivePeriod: '90',
  });

  // Fetch inactive customers count for win-back
  const { data: inactiveCustomers } = useQuery({
    queryKey: ['inactive-customers', companyId, formData.inactivePeriod],
    queryFn: async () => {
      const cutoffDate = subDays(new Date(), parseInt(formData.inactivePeriod)).toISOString();
      
      const { data: recentCustomers, error } = await supabase
        .from('appointments')
        .select('customer_email, customer_phone, customer_name')
        .eq('company_id', companyId)
        .lt('datetime', cutoffDate)
        .order('datetime', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const uniqueCustomers = new Map();
      recentCustomers?.forEach(c => {
        const key = c.customer_email || c.customer_phone;
        if (key && !uniqueCustomers.has(key)) {
          uniqueCustomers.set(key, c);
        }
      });
      
      return Array.from(uniqueCustomers.values());
    },
    enabled: formData.campaignType === 'winback',
  });

  const generateContent = async (field: 'subject' | 'message') => {
    const setLoading = field === 'subject' ? setIsGeneratingSubject : setIsGeneratingMessage;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          campaignType: formData.campaignType,
          targetSegment: formData.targetSegment,
          companyName: companyName || 'our company',
          field,
          campaignName: formData.name,
          promoCode: formData.promoCode,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          inactivePeriod: formData.inactivePeriod,
        },
      });

      if (error) throw error;
      
      if (data?.content) {
        if (field === 'subject') {
          setFormData(prev => ({ ...prev, emailSubject: data.content }));
        } else {
          setFormData(prev => ({ ...prev, messageTemplate: data.content }));
        }
        toast.success(`${field === 'subject' ? 'Subject' : 'Message'} generated!`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePromoCode = () => {
    const prefixes: Record<string, string> = {
      promotional: 'PROMO',
      winback: 'COMEBACK',
      referral: 'REF',
      seasonal: 'SEASON',
      loyalty: 'LOYAL',
    };
    const prefix = prefixes[formData.campaignType] || 'CODE';
    const code = prefix + Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, promoCode: code }));
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, referralCode: code }));
    return code;
  };

  const copyReferralCode = () => {
    if (formData.referralCode) {
      navigator.clipboard.writeText(formData.referralCode);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const createCampaign = useMutation({
    mutationFn: async () => {
      // For referral type, create a referral record
      if (formData.campaignType === 'referral') {
        const referralCode = formData.referralCode || generateReferralCode();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

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
        return { ...data, campaign_type: 'referral', name: `Referral: ${formData.referrerName}` };
      }

      // For other campaign types, create a marketing campaign
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: formData.name || `${formData.campaignType} Campaign`,
          campaign_type: formData.campaignType,
          target_segment: formData.campaignType === 'winback' ? 'inactive' : formData.targetSegment,
          email_subject: formData.emailSubject || null,
          message_template: formData.messageTemplate || null,
          promo_code: formData.promoCode || null,
          discount_type: formData.discountType || null,
          discount_value: formData.discountValue ? parseFloat(formData.discountValue) : null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          channels: formData.channels,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const isReferral = formData.campaignType === 'referral';
      const referralCode = isReferral && 'referral_code' in data ? (data as { referral_code: string }).referral_code : '';
      
      const successMessages: Record<string, string> = {
        promotional: 'Promotional campaign created!',
        winback: 'Win-back campaign created!',
        referral: `Referral created! Code: ${referralCode}`,
        seasonal: 'Seasonal campaign created!',
        loyalty: 'Loyalty campaign created!',
      };
      toast.success(successMessages[formData.campaignType] || 'Campaign created!');
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      onSuccess?.({ name: data.name, type: formData.campaignType });
      onCancel();
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });

  const handleChannelToggle = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.campaignType === 'referral') {
      if (!formData.referrerName) {
        toast.error('Please enter referrer name');
        return;
      }
    } else {
      if (!formData.name) {
        toast.error('Please enter a campaign name');
        return;
      }
    }
    
    createCampaign.mutate();
  };

  const getCampaignTypeIcon = () => {
    switch (formData.campaignType) {
      case 'referral': return <Gift className="h-5 w-5 text-pink-600" />;
      case 'winback': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'promotional': return <Tag className="h-5 w-5 text-orange-600" />;
      default: return <Megaphone className="h-5 w-5 text-orange-600" />;
    }
  };

  return (
    <Card className="border-border bg-background shadow-sm text-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            {getCampaignTypeIcon()}
            Create Campaign
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/50 rounded-lg">
          {/* Campaign Type Selection */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Campaign Type</Label>
            <Select
              value={formData.campaignType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, campaignType: value }))}
            >
              <SelectTrigger className="bg-white text-slate-900 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promotional">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Promotional / Promo Code
                  </div>
                </SelectItem>
                <SelectItem value="referral">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Referral Program
                  </div>
                </SelectItem>
                <SelectItem value="winback">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Win-Back Campaign
                  </div>
                </SelectItem>
                <SelectItem value="seasonal">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Seasonal
                  </div>
                </SelectItem>
                <SelectItem value="loyalty">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Loyalty
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referral-specific fields */}
          {formData.campaignType === 'referral' && (
            <>
              {/* Referral Code Generator */}
              <div className="space-y-3 p-3 rounded-lg border border-border bg-background">
                <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
                  <Gift className="h-4 w-4 text-pink-600" />
                  Referral Code for Customer Sharing
                </h4>
                <div className="space-y-2">
                  <Label className="text-foreground/70">Referral Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Click generate to create a code"
                      value={formData.referralCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                      className="font-mono text-lg tracking-wider bg-white text-slate-900 border-border placeholder:text-slate-400"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => generateReferralCode()}
                      className="shrink-0"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                    {formData.referralCode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyReferralCode}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this code with customers to track referrals
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-lg border border-border bg-background">
                <h4 className="font-medium text-sm text-foreground">Referrer (Existing Customer)</h4>
                <div className="space-y-2">
                  <Label className="text-foreground/70">Name *</Label>
                  <Input
                    placeholder="John Smith"
                    value={formData.referrerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, referrerName: e.target.value }))}
                    className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-foreground/70">Email</Label>
                    <Input
                      type="email"
                      placeholder="john@email.com"
                      value={formData.referrerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, referrerEmail: e.target.value }))}
                      className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/70">Phone</Label>
                    <Input
                      placeholder="(555) 123-4567"
                      value={formData.referrerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, referrerPhone: e.target.value }))}
                      className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-lg border border-border bg-background">
                <h4 className="font-medium text-sm text-foreground">Referred (New Customer - Optional)</h4>
                <div className="space-y-2">
                  <Label className="text-foreground/70">Name</Label>
                  <Input
                    placeholder="Jane Doe"
                    value={formData.referredName}
                    onChange={(e) => setFormData(prev => ({ ...prev, referredName: e.target.value }))}
                    className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-foreground/70">Email</Label>
                    <Input
                      type="email"
                      placeholder="jane@email.com"
                      value={formData.referredEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, referredEmail: e.target.value }))}
                      className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground/70">Phone</Label>
                    <Input
                      placeholder="(555) 987-6543"
                      value={formData.referredPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, referredPhone: e.target.value }))}
                      className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-foreground/70">Reward Type</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rewardType: value }))}
                  >
                    <SelectTrigger className="bg-white text-slate-900 border-border">
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
                  <Label className="text-foreground/70">Reward Value</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, rewardValue: e.target.value }))}
                    className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Win-back specific fields */}
          {formData.campaignType === 'winback' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/70">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Q1 Win-Back Campaign"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-foreground/70">
                  <Calendar className="h-3 w-3" />
                  Inactive Period
                </Label>
                <Select
                  value={formData.inactivePeriod}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, inactivePeriod: value }))}
                >
                  <SelectTrigger className="bg-white text-slate-900 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>~{inactiveCustomers?.length || 0} inactive customers found</span>
                </div>
              </div>
            </>
          )}

          {/* Standard campaign fields (not for referral) */}
          {formData.campaignType !== 'referral' && formData.campaignType !== 'winback' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/70">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale 2024"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground/70">Target Segment</Label>
                <Select
                  value={formData.targetSegment}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetSegment: value }))}
                >
                  <SelectTrigger className="bg-white text-slate-900 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                    <SelectItem value="returning">Returning Customers</SelectItem>
                    <SelectItem value="inactive">Inactive Customers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Promo Details (for promotional, winback, seasonal, loyalty) */}
          {formData.campaignType !== 'referral' && (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-background">
              <h4 className="font-medium text-sm text-foreground">Promo Details</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-foreground/70">Promo Code</Label>
                  <Input
                    placeholder="SUMMER20"
                    value={formData.promoCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                    className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/70">Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
                  >
                    <SelectTrigger className="bg-white text-slate-900 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/70">Discount Value</Label>
                  <Input
                    type="number"
                    placeholder={formData.discountType === 'percent' ? '20' : '50'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="bg-white text-slate-900 border-border placeholder:text-slate-400"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={generatePromoCode}>
                Generate Code
              </Button>
            </div>
          )}

          {/* Dates (not for referral) */}
          {formData.campaignType !== 'referral' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-foreground/70">
                  <Calendar className="h-3 w-3" />
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white text-slate-900 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-foreground/70">
                  <Calendar className="h-3 w-3" />
                  End Date
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white text-slate-900 border-border"
                />
              </div>
            </div>
          )}

          {/* Channels (not for referral) */}
          {formData.campaignType !== 'referral' && (
            <div className="space-y-2">
              <Label className="text-foreground/70">Channels</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="email-channel"
                    checked={formData.channels.includes('email')}
                    onCheckedChange={() => handleChannelToggle('email')}
                  />
                  <Label htmlFor="email-channel" className="flex items-center gap-1 text-sm cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sms-channel"
                    checked={formData.channels.includes('sms')}
                    onCheckedChange={() => handleChannelToggle('sms')}
                  />
                  <Label htmlFor="sms-channel" className="flex items-center gap-1 text-sm cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Email Subject (when email channel selected and not referral) */}
          {formData.channels.includes('email') && formData.campaignType !== 'referral' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/70">Email Subject</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateContent('subject')}
                  disabled={isGeneratingSubject}
                  className="h-7 text-xs gap-1 text-primary hover:text-primary"
                >
                  {isGeneratingSubject ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI Generate
                </Button>
              </div>
              <Input
                placeholder="Don't miss our special offer!"
                value={formData.emailSubject}
                onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
                className="bg-white text-slate-900 border-border placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Message Template (not for referral) */}
          {formData.campaignType !== 'referral' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/70">Message Template</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => generateContent('message')}
                  disabled={isGeneratingMessage}
                  className="h-7 text-xs gap-1 text-primary hover:text-primary"
                >
                  {isGeneratingMessage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI Generate
                </Button>
              </div>
              <Textarea
                placeholder="Hi {customer_name}, we have an exciting offer for you..."
                value={formData.messageTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, messageTemplate: e.target.value }))}
                rows={3}
                className="bg-white text-slate-900 border-border placeholder:text-slate-400"
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{customer_name}'}, {'{promo_code}'}, {'{discount}'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={createCampaign.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};