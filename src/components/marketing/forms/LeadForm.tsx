import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { X, UserPlus, Send, Mail, MessageSquare, Phone } from 'lucide-react';

interface LeadFormProps {
  companyId: string;
  onCancel: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ companyId, onCancel }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    source: 'website',
    serviceInterest: '',
    notes: '',
    sendWelcomeEmail: true,
    sendWelcomeSms: false,
  });

  // Create lead as a potential appointment/customer
  const createLead = useMutation({
    mutationFn: async () => {
      // Create as a campaign recipient for tracking
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select('id')
        .eq('company_id', companyId)
        .eq('campaign_type', 'lead_capture')
        .maybeSingle();

      let campaignId = campaign?.id;

      // Create lead capture campaign if doesn't exist
      if (!campaignId) {
        const { data: newCampaign, error: createError } = await supabase
          .from('marketing_campaigns')
          .insert({
            company_id: companyId,
            name: 'Lead Capture',
            campaign_type: 'lead_capture',
            status: 'active',
            channels: [],
          })
          .select()
          .single();

        if (createError) throw createError;
        campaignId = newCampaign.id;
      }

      // Add lead as recipient
      const { data, error } = await supabase
        .from('campaign_recipients')
        .insert({
          campaign_id: campaignId,
          company_id: companyId,
          customer_name: formData.name,
          customer_email: formData.email || null,
          customer_phone: formData.phone || null,
          channel: formData.email ? 'email' : 'sms',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lead added successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients'] });
      onCancel();
    },
    onError: (error) => {
      toast.error('Failed to add lead: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter the lead name');
      return;
    }
    if (!formData.email && !formData.phone) {
      toast.error('Please enter email or phone');
      return;
    }
    createLead.mutate();
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Add New Lead
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                type="email"
                placeholder="john@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone
              </Label>
              <Input
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          {/* Source & Interest */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="walkin">Walk-in</SelectItem>
                  <SelectItem value="ad">Advertisement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Interest</Label>
              <Input
                placeholder="e.g., HVAC repair"
                value={formData.serviceInterest}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceInterest: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any additional details about this lead..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Welcome Message Options */}
          <div className="space-y-2">
            <Label>Send Welcome Message</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="welcome-email"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendWelcomeEmail: !!checked }))}
                  disabled={!formData.email}
                />
                <Label htmlFor="welcome-email" className="flex items-center gap-1 text-sm cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="welcome-sms"
                  checked={formData.sendWelcomeSms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendWelcomeSms: !!checked }))}
                  disabled={!formData.phone}
                />
                <Label htmlFor="welcome-sms" className="flex items-center gap-1 text-sm cursor-pointer">
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
              disabled={createLead.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {createLead.isPending ? 'Adding...' : 'Add Lead'}
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
