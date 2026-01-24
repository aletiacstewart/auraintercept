import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Save, RotateCcw, Loader2, CheckCircle, XCircle, Bell } from 'lucide-react';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';
import { AIContentButton } from '@/components/ai/AIContentButton';

interface EmailTemplate {
  id?: string;
  company_id: string;
  template_type: 'confirmation' | 'cancellation' | 'reminder';
  subject: string;
  heading: string;
  message: string;
  show_portal_link: boolean;
}

const DEFAULT_TEMPLATES: Record<string, Omit<EmailTemplate, 'id' | 'company_id'>> = {
  confirmation: {
    template_type: 'confirmation',
    subject: 'Appointment Confirmed - {{company_name}}',
    heading: 'Your Appointment is Confirmed!',
    message: 'Thank you for booking with {{company_name}}. We look forward to seeing you.',
    show_portal_link: true,
  },
  cancellation: {
    template_type: 'cancellation',
    subject: 'Appointment Cancelled - {{company_name}}',
    heading: 'Your Appointment Has Been Cancelled',
    message: 'Your appointment with {{company_name}} has been cancelled. If you did not request this cancellation, please contact us.',
    show_portal_link: false,
  },
  reminder: {
    template_type: 'reminder',
    subject: 'Appointment Reminder - {{company_name}}',
    heading: 'Appointment Reminder',
    message: 'This is a friendly reminder about your upcoming appointment with {{company_name}}.',
    show_portal_link: true,
  },
};

const TEMPLATE_INFO = {
  confirmation: {
    label: 'Confirmation',
    description: 'Sent when an appointment is booked',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  cancellation: {
    label: 'Cancellation',
    description: 'Sent when an appointment is cancelled',
    icon: XCircle,
    color: 'text-red-500',
  },
  reminder: {
    label: 'Reminder',
    description: 'Sent before upcoming appointments',
    icon: Bell,
    color: 'text-blue-500',
  },
};

const PLACEHOLDERS = [
  { key: '{{company_name}}', description: 'Your company name' },
  { key: '{{customer_name}}', description: 'Customer\'s name' },
  { key: '{{service_type}}', description: 'Service being booked' },
  { key: '{{date}}', description: 'Appointment date' },
  { key: '{{time}}', description: 'Appointment time' },
  { key: '{{duration}}', description: 'Duration in minutes' },
];

export function EmailTemplatesEditor() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'confirmation' | 'cancellation' | 'reminder'>('confirmation');
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<EmailTemplate>>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      if (!companyId) throw new Error('No company ID');

      const existingTemplate = templates?.find(t => t.template_type === template.template_type);
      
      if (existingTemplate?.id) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            subject: template.subject,
            heading: template.heading,
            message: template.message,
            show_portal_link: template.show_portal_link,
          })
          .eq('id', existingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            company_id: companyId,
            template_type: template.template_type,
            subject: template.subject,
            heading: template.heading,
            message: template.message,
            show_portal_link: template.show_portal_link,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template saved successfully');
      triggerSetupProgressRefresh();
      setEditedTemplates(prev => ({ ...prev, [activeTab]: {} }));
    },
    onError: (error) => {
      console.error('Failed to save template:', error);
      toast.error('Failed to save email template');
    },
  });

  const getTemplate = (type: 'confirmation' | 'cancellation' | 'reminder'): EmailTemplate => {
    const saved = templates?.find(t => t.template_type === type);
    const edited = editedTemplates[type] || {};
    const defaultTemplate = DEFAULT_TEMPLATES[type];

    return {
      id: saved?.id,
      company_id: companyId || '',
      template_type: type,
      subject: edited.subject ?? saved?.subject ?? defaultTemplate.subject,
      heading: edited.heading ?? saved?.heading ?? defaultTemplate.heading,
      message: edited.message ?? saved?.message ?? defaultTemplate.message,
      show_portal_link: edited.show_portal_link ?? saved?.show_portal_link ?? defaultTemplate.show_portal_link,
    };
  };

  const updateField = (field: keyof EmailTemplate, value: string | boolean) => {
    setEditedTemplates(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const resetToDefault = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[activeTab];
    setEditedTemplates(prev => ({
      ...prev,
      [activeTab]: {
        subject: defaultTemplate.subject,
        heading: defaultTemplate.heading,
        message: defaultTemplate.message,
        show_portal_link: defaultTemplate.show_portal_link,
      },
    }));
  };

  const handleSave = () => {
    const template = getTemplate(activeTab);
    saveMutation.mutate(template);
  };

  const hasChanges = (type: 'confirmation' | 'cancellation' | 'reminder') => {
    return Object.keys(editedTemplates[type] || {}).length > 0;
  };

  const isCustomized = (type: 'confirmation' | 'cancellation' | 'reminder') => {
    return templates?.some(t => t.template_type === type);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentTemplate = getTemplate(activeTab);
  const info = TEMPLATE_INFO[activeTab];
  const Icon = info.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Templates
        </CardTitle>
        <CardDescription>
          Customize the emails sent to your customers for appointments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            {(Object.keys(TEMPLATE_INFO) as Array<keyof typeof TEMPLATE_INFO>).map((type) => {
              const typeInfo = TEMPLATE_INFO[type];
              const TypeIcon = typeInfo.icon;
              return (
                <TabsTrigger key={type} value={type} className="flex items-center gap-1.5">
                  <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                  {typeInfo.label}
                  {(hasChanges(type) || isCustomized(type)) && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(TEMPLATE_INFO) as Array<keyof typeof TEMPLATE_INFO>).map((type) => (
            <TabsContent key={type} value={type} className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-card-foreground/70">
                <Icon className={`w-4 h-4 ${info.color}`} />
                {info.description}
                {isCustomized(type) && (
                  <Badge variant="outline" className="ml-2 text-card-foreground/80 border-card-foreground/30">Customized</Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="subject" className="text-card-foreground">Email Subject</Label>
                    <AIContentButton
                      contentType="email_subject"
                      existingContent={currentTemplate.subject}
                      context={{ templateType: activeTab }}
                      onGenerate={(content) => updateField('subject', content)}
                    />
                  </div>
                  <Input
                    id="subject"
                    value={currentTemplate.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                    placeholder="Enter email subject..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="heading" className="text-card-foreground">Email Heading</Label>
                    <AIContentButton
                      contentType="email_heading"
                      existingContent={currentTemplate.heading}
                      context={{ templateType: activeTab }}
                      onGenerate={(content) => updateField('heading', content)}
                    />
                  </div>
                  <Input
                    id="heading"
                    value={currentTemplate.heading}
                    onChange={(e) => updateField('heading', e.target.value)}
                    placeholder="Enter email heading..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message" className="text-card-foreground">Email Message</Label>
                    <AIContentButton
                      contentType="email_message"
                      existingContent={currentTemplate.message}
                      context={{ templateType: activeTab }}
                      onGenerate={(content) => updateField('message', content)}
                    />
                  </div>
                  <Textarea
                    id="message"
                    value={currentTemplate.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    placeholder="Enter email message..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-card-foreground">Show Appointment Portal Link</Label>
                    <p className="text-sm text-card-foreground/70">
                      Include a button for customers to manage their appointment
                    </p>
                  </div>
                  <Switch
                    checked={currentTemplate.show_portal_link}
                    onCheckedChange={(checked) => updateField('show_portal_link', checked)}
                  />
                </div>
              </div>

              {/* Placeholders */}
              <div className="p-4 rounded-lg bg-muted/30 border border-card-foreground/10">
                <Label className="text-xs uppercase text-card-foreground/70">Available Placeholders</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-card border border-card-foreground/20 text-card-foreground hover:bg-card-foreground/10 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(p.key);
                        toast.success(`Copied ${p.key}`);
                      }}
                      title={p.description}
                    >
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetToDefault}
                  disabled={saveMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
