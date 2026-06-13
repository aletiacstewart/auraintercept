import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { X, UserPlus, Send, Mail, MessageSquare, Phone, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
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

const BULK_ACCEPT = '.csv,.xlsx,.xls,.pdf,.docx';
const BULK_MAX_BYTES = 20 * 1024 * 1024;

export const LeadForm: React.FC<LeadFormProps> = ({ companyId, onCancel, onSuccess }) => {
  const queryClient = useQueryClient();
  const { pack } = useIndustryPack(companyId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkAuto, setBulkAuto] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);

  const handleBulkUpload = async (file: File) => {
    if (!companyId) return;
    if (file.size > BULK_MAX_BYTES) {
      toast.error('File too large (20MB max)');
      return;
    }
    setBulkUploading(true);
    try {
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
      const path = `${companyId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('lead-imports').upload(path, file);
      if (upErr) throw upErr;
      const { data: userData } = await supabase.auth.getUser();
      const { data: job, error: jobErr } = await supabase
        .from('lead_import_jobs')
        .insert({
          company_id: companyId,
          uploaded_by: userData.user?.id,
          source_filename: file.name,
          mime_type: file.type,
          storage_path: path,
          mode: bulkAuto ? 'auto' : 'review',
          status: 'uploaded',
        })
        .select()
        .single();
      if (jobErr) throw jobErr;
      await supabase.functions.invoke('lead-import-parse', { body: { job_id: job.id } });
      toast.success(
        bulkAuto ? 'Uploaded — Aura is importing your leads' : 'Uploaded — review parsed rows on the import page',
        {
          action: {
            label: 'Open',
            onClick: () => window.location.assign(`/dashboard/leads/import?job=${job.id}`),
          },
        },
      );
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-import-jobs', companyId] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Upload failed: ' + msg);
    } finally {
      setBulkUploading(false);
    }
  };

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
          {/* Bulk upload (PDF, CSV, Excel, Word) */}
          <div className="rounded-md border border-dashed border-border bg-background/60 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-medium">Bulk upload leads</span>
                <span className="text-xs text-muted-foreground">PDF, CSV, Excel, Word · 20MB</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bulk-auto" className="text-xs text-foreground/70 cursor-pointer">
                  Auto-add
                </Label>
                <Switch id="bulk-auto" checked={bulkAuto} onCheckedChange={setBulkAuto} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {bulkAuto
                  ? 'Imports immediately and skips duplicates.'
                  : 'Parses the file so you can review rows before importing.'}
              </p>
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={bulkUploading}
                >
                  {bulkUploading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  {bulkUploading ? 'Uploading…' : 'Upload file'}
                </Button>
                <Button type="button" size="sm" variant="ghost" asChild>
                  <RouterLink to="/dashboard/leads/import">History</RouterLink>
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={BULK_ACCEPT}
              className="hidden"
              disabled={bulkUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleBulkUpload(f);
                e.target.value = '';
              }}
            />
          </div>

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