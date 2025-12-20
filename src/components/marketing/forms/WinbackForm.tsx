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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, TrendingUp, Send, Mail, MessageSquare, Users, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface WinbackFormProps {
  companyId: string;
  onCancel: () => void;
}

export const WinbackForm: React.FC<WinbackFormProps> = ({ companyId, onCancel }) => {
  const queryClient = useQueryClient();
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    inactivePeriod: '90', // days
    promoCode: '',
    discountType: 'percent',
    discountValue: '15',
    emailSubject: 'We miss you! Come back for a special offer',
    messageTemplate: '',
    sendEmail: true,
    sendSms: false,
  });

  // Fetch company name for AI context
  const { data: companyName } = useQuery({
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

  const generateContent = async (field: 'subject' | 'message') => {
    const setLoading = field === 'subject' ? setIsGeneratingSubject : setIsGeneratingMessage;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          campaignType: 'winback',
          targetSegment: 'inactive',
          companyName: companyName || 'our company',
          field,
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

  // Fetch inactive customers count
  const { data: inactiveCustomers } = useQuery({
    queryKey: ['inactive-customers', companyId, formData.inactivePeriod],
    queryFn: async () => {
      const cutoffDate = subDays(new Date(), parseInt(formData.inactivePeriod)).toISOString();
      
      // Get customers who haven't had appointments since cutoff
      const { data: recentCustomers, error } = await supabase
        .from('appointments')
        .select('customer_email, customer_phone, customer_name')
        .eq('company_id', companyId)
        .lt('datetime', cutoffDate)
        .order('datetime', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Deduplicate by email/phone
      const uniqueCustomers = new Map();
      recentCustomers?.forEach(c => {
        const key = c.customer_email || c.customer_phone;
        if (key && !uniqueCustomers.has(key)) {
          uniqueCustomers.set(key, c);
        }
      });
      
      return Array.from(uniqueCustomers.values());
    },
  });

  const generatePromoCode = () => {
    const code = 'COMEBACK' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, promoCode: code }));
  };

  const createWinbackCampaign = useMutation({
    mutationFn: async () => {
      const channels = [];
      if (formData.sendEmail) channels.push('email');
      if (formData.sendSms) channels.push('sms');

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: formData.name || `Win-Back Campaign - ${format(new Date(), 'MMM yyyy')}`,
          campaign_type: 'winback',
          target_segment: 'inactive',
          email_subject: formData.emailSubject || null,
          message_template: formData.messageTemplate || null,
          promo_code: formData.promoCode || null,
          discount_type: formData.discountType,
          discount_value: parseFloat(formData.discountValue),
          channels,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Win-back campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      onCancel();
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.discountValue) {
      toast.error('Please set a discount value');
      return;
    }
    createWinbackCampaign.mutate();
  };

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Win-Back Campaign
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              placeholder="e.g., Q1 Win-Back Campaign"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Inactive Period
            </Label>
            <Select
              value={formData.inactivePeriod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, inactivePeriod: value }))}
            >
              <SelectTrigger>
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

          {/* Offer Details */}
          <div className="space-y-3 p-3 rounded-lg border bg-background">
            <h4 className="font-medium text-sm">Special Offer</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Promo Code</Label>
                <div className="flex gap-1">
                  <Input
                    placeholder="COMEBACK20"
                    value={formData.promoCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="fixed">$</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                />
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={generatePromoCode}>
              Generate Code
            </Button>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label>Send Via</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="winback-email"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendEmail: !!checked }))}
                />
                <Label htmlFor="winback-email" className="flex items-center gap-1 text-sm cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="winback-sms"
                  checked={formData.sendSms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendSms: !!checked }))}
                />
                <Label htmlFor="winback-sms" className="flex items-center gap-1 text-sm cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </Label>
              </div>
            </div>
          </div>

          {/* Email Subject */}
          {formData.sendEmail && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Email Subject</Label>
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
                placeholder="We miss you! Here's a special offer just for you"
                value={formData.emailSubject}
                onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
              />
            </div>
          )}

          {/* Message Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
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
              placeholder="Hi {customer_name}, it's been a while! We'd love to see you again. Use code {promo_code} for {discount} off your next visit!"
              value={formData.messageTemplate}
              onChange={(e) => setFormData(prev => ({ ...prev, messageTemplate: e.target.value }))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Variables: {'{customer_name}'}, {'{promo_code}'}, {'{discount}'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={createWinbackCampaign.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {createWinbackCampaign.isPending ? 'Creating...' : 'Create Win-Back Campaign'}
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
