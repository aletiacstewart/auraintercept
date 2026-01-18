import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Star, MessageSquare, Mail, Clock, ExternalLink, RotateCcw, Save, Loader2 } from 'lucide-react';

interface ReviewSettings {
  review_request_enabled: boolean;
  review_request_delay_hours: number;
  review_google_url: string | null;
  review_yelp_url: string | null;
  review_facebook_url: string | null;
  review_sms_template: string | null;
  review_email_subject: string | null;
  review_email_template: string | null;
}

const DEFAULT_SMS = 'Hi {customer_name}! Thank you for choosing {company_name}. We hope {technician_name} provided excellent {service_type} service. Would you take a moment to leave us a 5-star review? It helps our small business grow! ⭐⭐⭐⭐⭐';
const DEFAULT_EMAIL_SUBJECT = 'How was your experience? - {company_name}';
const DEFAULT_EMAIL = `Hi {customer_name},

We hope {technician_name} provided you with excellent {service_type} service today!

Your feedback means the world to us. If you were happy with our service, we'd really appreciate it if you could take a moment to leave us a review.

⭐⭐⭐⭐⭐

Your 5-star review helps our small business grow and allows us to continue providing great service to customers like you.

Thank you again for your business!

Best regards,
The {company_name} Team`;

const PLACEHOLDERS = [
  { key: '{customer_name}', description: "Customer's name" },
  { key: '{company_name}', description: 'Your company name' },
  { key: '{technician_name}', description: 'Technician who completed the job' },
  { key: '{service_type}', description: 'Type of service provided' },
];

export function ReviewRequestSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sms' | 'email'>('sms');
  const [settings, setSettings] = useState<ReviewSettings>({
    review_request_enabled: true,
    review_request_delay_hours: 1,
    review_google_url: null,
    review_yelp_url: null,
    review_facebook_url: null,
    review_sms_template: DEFAULT_SMS,
    review_email_subject: DEFAULT_EMAIL_SUBJECT,
    review_email_template: DEFAULT_EMAIL,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-review-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('review_request_enabled, review_request_delay_hours, review_google_url, review_yelp_url, review_facebook_url, review_sms_template, review_email_subject, review_email_template')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setSettings({
        review_request_enabled: company.review_request_enabled ?? true,
        review_request_delay_hours: company.review_request_delay_hours ?? 1,
        review_google_url: company.review_google_url,
        review_yelp_url: company.review_yelp_url,
        review_facebook_url: company.review_facebook_url,
        review_sms_template: company.review_sms_template ?? DEFAULT_SMS,
        review_email_subject: company.review_email_subject ?? DEFAULT_EMAIL_SUBJECT,
        review_email_template: company.review_email_template ?? DEFAULT_EMAIL,
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async (data: ReviewSettings) => {
      if (!companyId) throw new Error('No company ID');
      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-review-settings', companyId] });
      toast.success('Review request settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleResetSMS = () => {
    setSettings(prev => ({ ...prev, review_sms_template: DEFAULT_SMS }));
  };

  const handleResetEmail = () => {
    setSettings(prev => ({ 
      ...prev, 
      review_email_subject: DEFAULT_EMAIL_SUBJECT,
      review_email_template: DEFAULT_EMAIL 
    }));
  };

  const getSmsCharCount = () => {
    return (settings.review_sms_template || '').length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const charCount = getSmsCharCount();
  const isOverLimit = charCount > 160;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle>Review Request Settings</CardTitle>
                <CardDescription>
                  Automatically request reviews from customers after completed jobs
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.review_request_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, review_request_enabled: checked }))
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timing */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-card-foreground">
              <Clock className="h-4 w-4" />
              Send review request after job completion
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="72"
                value={settings.review_request_delay_hours}
                onChange={(e) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    review_request_delay_hours: parseInt(e.target.value) || 0 
                  }))
                }
                className="w-24"
              />
              <span className="text-sm text-card-foreground/70">hours (0 = immediately)</span>
            </div>
          </div>

          {/* Review Platform URLs */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-card-foreground">
              <ExternalLink className="h-4 w-4" />
              Review Platform Links
            </Label>
            <p className="text-sm text-card-foreground/70">
              Add direct links to your review pages. These will be included in review request emails.
            </p>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="google-url" className="text-sm text-card-foreground/80">Google Reviews URL</Label>
                <Input
                  id="google-url"
                  placeholder="https://g.page/r/your-business/review"
                  value={settings.review_google_url || ''}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, review_google_url: e.target.value || null }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yelp-url" className="text-sm text-card-foreground/80">Yelp Reviews URL</Label>
                <Input
                  id="yelp-url"
                  placeholder="https://www.yelp.com/biz/your-business"
                  value={settings.review_yelp_url || ''}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, review_yelp_url: e.target.value || null }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook-url" className="text-sm text-card-foreground/80">Facebook Reviews URL</Label>
                <Input
                  id="facebook-url"
                  placeholder="https://www.facebook.com/your-business/reviews"
                  value={settings.review_facebook_url || ''}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, review_facebook_url: e.target.value || null }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Message Templates
          </CardTitle>
          <CardDescription>
            Customize the review request messages sent to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-card-foreground">SMS Template</Label>
                  <span className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-card-foreground/70'}`}>
                    {charCount}/160 characters {isOverLimit && '(may be split into multiple SMS)'}
                  </span>
                </div>
                <Textarea
                  value={settings.review_sms_template || ''}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, review_sms_template: e.target.value }))
                  }
                  rows={4}
                  placeholder="Enter SMS template..."
                  className="font-mono text-sm bg-white text-slate-900"
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
                  onClick={handleResetSMS}
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

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-subject" className="text-card-foreground">Email Subject</Label>
                  <Input
                    id="email-subject"
                    value={settings.review_email_subject || ''}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, review_email_subject: e.target.value }))
                    }
                    placeholder="Email subject..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-body" className="text-card-foreground">Email Message</Label>
                  <Textarea
                    id="email-body"
                    value={settings.review_email_template || ''}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, review_email_template: e.target.value }))
                    }
                    rows={10}
                    placeholder="Enter email template..."
                    className="font-mono text-sm bg-white text-slate-900"
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
                  onClick={handleResetEmail}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
