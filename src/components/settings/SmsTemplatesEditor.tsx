import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MessageSquare, Save, RotateCcw, Loader2, CheckCircle, XCircle, Bell, Link } from 'lucide-react';
import { triggerSetupProgressRefresh } from '@/hooks/useSetupProgress';

interface SmsTemplate {
  id?: string;
  company_id: string;
  template_type: 'confirmation' | 'cancellation' | 'reminder';
  message: string;
  include_portal_link?: boolean;
}

const DEFAULT_TEMPLATES: Record<string, Omit<SmsTemplate, 'id' | 'company_id'>> = {
  confirmation: {
    template_type: 'confirmation',
    message: 'Hi {{customer_name}}! Your {{service_type}} appointment at {{company_name}} is confirmed for {{date}} at {{time}}. Reply HELP for assistance.',
    include_portal_link: true,
  },
  cancellation: {
    template_type: 'cancellation',
    message: 'Hi {{customer_name}}, your appointment at {{company_name}} on {{date}} at {{time}} has been cancelled. Contact us to rebook.',
    include_portal_link: false,
  },
  reminder: {
    template_type: 'reminder',
    message: 'Reminder: You have a {{service_type}} appointment at {{company_name}} on {{date}} at {{time}}. See you soon!',
    include_portal_link: true,
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
  { key: '{{customer_name}}', description: "Customer's name" },
  { key: '{{service_type}}', description: 'Service being booked' },
  { key: '{{date}}', description: 'Appointment date' },
  { key: '{{time}}', description: 'Appointment time' },
  { key: '{{duration}}', description: 'Duration in minutes' },
  { key: '{{portal_link}}', description: 'Customer portal link' },
];

export function SmsTemplatesEditor() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'confirmation' | 'cancellation' | 'reminder'>('confirmation');
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<SmsTemplate>>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ['sms-templates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data as SmsTemplate[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (template: SmsTemplate) => {
      if (!companyId) throw new Error('No company ID');

      const existingTemplate = templates?.find(t => t.template_type === template.template_type);
      
      if (existingTemplate?.id) {
        const { error } = await supabase
          .from('sms_templates')
          .update({ 
            message: template.message,
            include_portal_link: template.include_portal_link ?? true,
          })
          .eq('id', existingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sms_templates')
          .insert({
            company_id: companyId,
            template_type: template.template_type,
            message: template.message,
            include_portal_link: template.include_portal_link ?? true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('SMS template saved successfully');
      triggerSetupProgressRefresh();
      setEditedTemplates(prev => ({ ...prev, [activeTab]: {} }));
    },
    onError: (error) => {
      console.error('Failed to save template:', error);
      toast.error('Failed to save SMS template');
    },
  });

  const getTemplate = (type: 'confirmation' | 'cancellation' | 'reminder'): SmsTemplate => {
    const saved = templates?.find(t => t.template_type === type);
    const edited = editedTemplates[type] || {};
    const defaultTemplate = DEFAULT_TEMPLATES[type];

    return {
      id: saved?.id,
      company_id: companyId || '',
      template_type: type,
      message: edited.message ?? saved?.message ?? defaultTemplate.message,
      include_portal_link: edited.include_portal_link ?? saved?.include_portal_link ?? defaultTemplate.include_portal_link ?? true,
    };
  };

  const updateField = (value: string) => {
    setEditedTemplates(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        message: value,
      },
    }));
  };

  const updateIncludePortalLink = (value: boolean) => {
    setEditedTemplates(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        include_portal_link: value,
      },
    }));
  };

  const resetToDefault = () => {
    const defaultTemplate = DEFAULT_TEMPLATES[activeTab];
    setEditedTemplates(prev => ({
      ...prev,
      [activeTab]: { 
        message: defaultTemplate.message,
        include_portal_link: defaultTemplate.include_portal_link,
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

  const getCharacterCount = () => {
    const template = getTemplate(activeTab);
    return template.message.length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentTemplate = getTemplate(activeTab);
  const info = TEMPLATE_INFO[activeTab];
  const Icon = info.icon;
  const charCount = getCharacterCount();
  const isOverLimit = charCount > 160;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          SMS Templates
        </CardTitle>
        <CardDescription>
          Customize the SMS messages sent to your customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="inline-flex h-auto p-1 bg-muted/30 rounded-full border border-border/50 gap-0.5 flex-wrap">
            {(Object.keys(TEMPLATE_INFO) as Array<keyof typeof TEMPLATE_INFO>).map((type) => {
              const typeInfo = TEMPLATE_INFO[type];
              const TypeIcon = typeInfo.icon;
              return (
                <TabsTrigger key={type} value={type} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
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
                    <Label htmlFor="message" className="text-card-foreground">Message</Label>
                    <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-card-foreground/70'}`}>
                      {charCount}/160 characters {isOverLimit && '(may be split into multiple SMS)'}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    value={currentTemplate.message}
                    onChange={(e) => updateField(e.target.value)}
                    placeholder="Enter SMS message..."
                    rows={4}
                    className="font-mono text-sm bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Portal Link Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-card-foreground/10">
                <div className="flex items-center gap-3">
                  <Link className="w-4 h-4 text-primary" />
                  <div>
                    <Label className="text-sm font-medium text-card-foreground">Show Appointment Portal Link</Label>
                    <p className="text-xs text-card-foreground/70">Include a link for customers to manage their appointment</p>
                  </div>
                </div>
                <Switch
                  checked={currentTemplate.include_portal_link ?? true}
                  onCheckedChange={updateIncludePortalLink}
                />
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
