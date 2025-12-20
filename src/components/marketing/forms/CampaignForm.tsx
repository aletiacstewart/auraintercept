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
import { X, Megaphone, Send, Mail, MessageSquare, Calendar, Sparkles, Loader2 } from 'lucide-react';

interface CampaignFormProps {
  companyId: string;
  onCancel: () => void;
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

export const CampaignForm: React.FC<CampaignFormProps> = ({ companyId, onCancel }) => {
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

  const createCampaign = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_id: companyId,
          name: formData.name,
          campaign_type: formData.campaignType,
          target_segment: formData.targetSegment,
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
    onSuccess: () => {
      toast.success('Campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
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
    if (!formData.name) {
      toast.error('Please enter a campaign name');
      return;
    }
    createCampaign.mutate();
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-600" />
            Create Marketing Campaign
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
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Summer Sale 2024"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Campaign Type & Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <Select
                value={formData.campaignType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, campaignType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="winback">Win-Back</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="loyalty">Loyalty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Segment</Label>
              <Select
                value={formData.targetSegment}
                onValueChange={(value) => setFormData(prev => ({ ...prev, targetSegment: value }))}
              >
                <SelectTrigger>
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
          </div>

          {/* Promo Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Promo Code</Label>
              <Input
                placeholder="SUMMER20"
                value={formData.promoCode}
                onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
                placeholder={formData.discountType === 'percent' ? '20' : '50'}
                value={formData.discountValue}
                onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start Date
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                End Date
              </Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label>Channels</Label>
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

          {/* Email Subject */}
          {formData.channels.includes('email') && (
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
                placeholder="Don't miss our summer sale!"
                value={formData.emailSubject}
                onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
              />
            </div>
          )}

          {/* Message Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message Template</Label>
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
