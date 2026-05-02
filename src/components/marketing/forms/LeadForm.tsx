import { useMemo, useState } from 'react';
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
import { useIndustryPack } from '@/hooks/useIndustryPack';
import { DynamicIntakeFields } from '@/components/forms/DynamicIntakeFields';
import {
  validateIntake,
  type IntakeFormSchema,
} from '@/lib/industryFormSchemas';

interface LeadFormProps {
  companyId: string;
  onCancel: () => void;
  onSuccess?: (data: { name: string; source: string }) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ companyId, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const { pack } = useIndustryPack(companyId);

  // For lead capture we prefer an explicit `lead_intake` schema if the pack
  // defines one; otherwise fall back to the first available form schema so
  // the vertical can still surface its highest-value qualification fields
  // (e.g. real estate price range, restaurant party size).
  const intakeSchema = useMemo<IntakeFormSchema | null>(() => {
    const schemas = (pack?.form_schemas || {}) as Record<string, IntakeFormSchema>;
    if (schemas.lead_intake?.fields?.length) return schemas.lead_intake;
    const first = Object.values(schemas).find(
      (s) => Array.isArray(s?.fields) && s.fields.length > 0,
    );
    return first ?? null;
  }, [pack?.form_schemas]);

  const [intakeData, setIntakeData] = useState<Record<string, unknown>>({});
  
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
    // UTM/Attribution fields for CRM compatibility
    campaignSource: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  });

  // Create the lead in the canonical `leads` table (drives lead scoring +
  // industry-aware intake), then mirror to a campaign recipient row for the
  // existing outreach flow.
  const createLead = useMutation({
    mutationFn: async () => {
      // 1) Insert canonical lead row.
      const { data: leadRow, error: leadError } = await supabase
        .from('leads')
        .insert({
          company_id: companyId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          source: formData.source,
          service_interest: formData.serviceInterest || null,
          notes: formData.notes || null,
          campaign_source: formData.campaignSource || null,
          utm_source: formData.utmSource || null,
          utm_medium: formData.utmMedium || null,
          utm_campaign: formData.utmCampaign || null,
          intake_data: intakeData as never,
        })
        .select()
        .single();
      if (leadError) throw leadError;

      // 2) Mirror to campaign_recipients so existing outreach flows still pick
      //    this lead up (kept for backward compatibility).
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

      await supabase
        .from('campaign_recipients')
        .insert({
          campaign_id: campaignId,
          company_id: companyId,
          customer_name: formData.name,
          customer_email: formData.email || null,
          customer_phone: formData.phone || null,
          channel: formData.email ? 'email' : 'sms',
          status: 'pending',
        });

      return leadRow;
    },
    onSuccess: () => {
      toast.success('Lead added successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients'] });
      onSuccess?.({ name: formData.name, source: formData.source });
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
    const intakeErrors = validateIntake(intakeSchema, intakeData);
    if (intakeErrors.length > 0) {
      toast.error(`Please fill in: ${intakeErrors.join(', ')}`);
      return;
    }
    createLead.mutate();
  };

  return (
<Card className="border-0 bg-background shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <UserPlus className="h-5 w-5 text-primary" />
          Add New Lead
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/50 rounded-b-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Name *</Label>
            <Input
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-foreground/70">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                type="email"
                className="bg-background text-foreground border-input placeholder:text-muted-foreground"
                placeholder="john@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-foreground/70">
                <Phone className="h-3 w-3" />
                Phone
              </Label>
              <Input
                className="bg-background text-foreground border-input placeholder:text-muted-foreground"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Address</Label>
            <Input
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          {/* Source & Interest */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground/70">Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger className="bg-background text-foreground border-input">
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
              <Label className="text-foreground/70">Service Interest</Label>
              <Input
                className="bg-background text-foreground border-input placeholder:text-muted-foreground"
                placeholder="Service interest"
                value={formData.serviceInterest}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceInterest: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Notes</Label>
            <Textarea
              className="bg-background text-foreground border-input placeholder:text-muted-foreground"
              placeholder="Any additional details about this lead..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Industry-specific qualification fields (no-op when pack has no schemas) */}
          <DynamicIntakeFields
            schema={intakeSchema}
            value={intakeData}
            onChange={setIntakeData}
            title="Qualification"
          />

          {/* UTM/Attribution Fields - CRM Compatibility */}
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-foreground/70 text-xs">Attribution (CRM Sync)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                className="bg-background text-foreground border-input placeholder:text-muted-foreground h-8 text-xs"
                placeholder="Campaign Source"
                value={formData.campaignSource}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignSource: e.target.value }))}
              />
              <Input
                className="bg-background text-foreground border-input placeholder:text-muted-foreground h-8 text-xs"
                placeholder="UTM Source"
                value={formData.utmSource}
                onChange={(e) => setFormData(prev => ({ ...prev, utmSource: e.target.value }))}
              />
              <Input
                className="bg-background text-foreground border-input placeholder:text-muted-foreground h-8 text-xs"
                placeholder="UTM Medium"
                value={formData.utmMedium}
                onChange={(e) => setFormData(prev => ({ ...prev, utmMedium: e.target.value }))}
              />
              <Input
                className="bg-background text-foreground border-input placeholder:text-muted-foreground h-8 text-xs"
                placeholder="UTM Campaign"
                value={formData.utmCampaign}
                onChange={(e) => setFormData(prev => ({ ...prev, utmCampaign: e.target.value }))}
              />
            </div>
          </div>

          {/* Welcome Message Options */}
          <div className="space-y-2">
            <Label className="text-foreground/70">Send Welcome Message</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="welcome-email"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendWelcomeEmail: !!checked }))}
                  disabled={!formData.email}
                />
                <Label htmlFor="welcome-email" className="flex items-center gap-1 text-sm cursor-pointer text-foreground/70">
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
                <Label htmlFor="welcome-sms" className="flex items-center gap-1 text-sm cursor-pointer text-foreground/70">
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