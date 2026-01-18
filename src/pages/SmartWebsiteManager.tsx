import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Eye, 
  Settings, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { QRCodeSVG } from 'qrcode.react';
import { VisitorLimitModal } from '@/components/smartwebsite/VisitorLimitModal';
import { SmartWebsiteAnalytics } from '@/components/smartwebsite/SmartWebsiteAnalytics';
import { AboutSectionEditor } from '@/components/smartwebsite/AboutSectionEditor';

export default function SmartWebsiteManager() {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasShownLimitWarning, setHasShownLimitWarning] = useState(false);

  // Fetch website data
  const { data: website, isLoading } = useQuery({
    queryKey: ['smart-website-admin', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_websites')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ['smart-website-metrics', website?.id],
    queryFn: async () => {
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from('site_metrics')
        .select('*')
        .eq('website_id', website!.id)
        .eq('month_year', monthYear)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || { page_views: 0, unique_visitors: 0, chat_interactions: 0, booking_clicks: 0 };
    },
    enabled: !!website?.id,
  });

  // Fetch company for slug and subscription tier
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('slug, name, subscription_tier')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Check if visitor limit warning should be shown
  useEffect(() => {
    if (metrics && website && !hasShownLimitWarning) {
      const usagePercent = (metrics.page_views / website.monthly_visitor_limit) * 100;
      if (usagePercent >= 80) {
        setShowLimitModal(true);
        setHasShownLimitWarning(true);
      }
    }
  }, [metrics, website, hasShownLimitWarning]);

  // Create website mutation
  const createWebsite = useMutation({
    mutationFn: async () => {
      const subdomain = company?.slug || company?.name?.toLowerCase().replace(/\s+/g, '-');
      const { data, error } = await supabase
        .from('smart_websites')
        .insert({
          company_id: companyId,
          subdomain,
          hero_headline: `Welcome to ${company?.name}`,
          hero_subheadline: 'Professional service you can trust',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-admin'] });
      toast.success('Smart Website created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create website');
    },
  });

  // Update website mutation
  const updateWebsite = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('smart_websites')
        .update(updates)
        .eq('id', website!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-website-admin'] });
      toast.success('Website updated!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update website');
    },
  });

  const websiteUrl = website?.subdomain 
    ? `${window.location.origin}/site/${website.subdomain}`
    : null;

  const usagePercentage = website?.monthly_visitor_limit 
    ? ((metrics?.page_views || 0) / website.monthly_visitor_limit) * 100
    : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!website) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Create Your Smart Website</CardTitle>
              <CardDescription>
                Get a professional 1-page website that showcases your services, hours, and includes an AI chat widget.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => createWebsite.mutate()}
                disabled={createWebsite.isPending}
                size="lg"
              >
                {createWebsite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Smart Website
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Globe}
            title="Smart Website"
            description="Manage your company's 1-page website"
            action={
              websiteUrl ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.open(websiteUrl, '_blank')}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" onClick={() => copyToClipboard(websiteUrl)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              ) : undefined
            }
          />

        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${website.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div>
                  <p className="font-medium">{website.is_published ? 'Published' : 'Draft'}</p>
                  <p className="text-sm text-muted-foreground">{websiteUrl}</p>
                </div>
              </div>
              <Switch
                checked={website.is_published}
                onCheckedChange={(checked) => updateWebsite.mutate({ is_published: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="domain">Custom Domain</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Website Content</CardTitle>
                <CardDescription>Customize your website's hero section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hero Headline</Label>
                  <Input
                    defaultValue={website.hero_headline || ''}
                    onBlur={(e) => updateWebsite.mutate({ hero_headline: e.target.value })}
                    placeholder="Welcome to Your Business"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subheadline</Label>
                  <Textarea
                    defaultValue={website.hero_subheadline || ''}
                    onBlur={(e) => updateWebsite.mutate({ hero_subheadline: e.target.value })}
                    placeholder="Professional service you can trust"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    defaultValue={website.cta_button_text || 'Book Now'}
                    onBlur={(e) => updateWebsite.mutate({ cta_button_text: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button URL</Label>
                  <Input
                    defaultValue={website.cta_button_url || ''}
                    onBlur={(e) => updateWebsite.mutate({ cta_button_url: e.target.value })}
                    placeholder="/customer-portal/your-company"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Section Visibility</CardTitle>
                <CardDescription>Choose which sections to display on your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Services</p>
                    <p className="text-sm text-muted-foreground">Show your service offerings</p>
                  </div>
                  <Switch
                    checked={website.show_services}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_services: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">Display your operating hours</p>
                  </div>
                  <Switch
                    checked={website.show_hours}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_hours: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Contact Info</p>
                    <p className="text-sm text-muted-foreground">Show phone, email, address</p>
                  </div>
                  <Switch
                    checked={website.show_contact}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_contact: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Chat Widget</p>
                    <p className="text-sm text-muted-foreground">Enable AI assistant chat</p>
                  </div>
                  <Switch
                    checked={website.show_chat_widget}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_chat_widget: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Voice Widget</p>
                    <p className="text-sm text-muted-foreground">Enable voice chat for visitors</p>
                  </div>
                  <Switch
                    checked={website.show_voice_widget}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_voice_widget: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* About Section Editor */}
            <AboutSectionEditor
              website={{
                id: website.id,
                show_about_section: website.show_about_section ?? false,
                about_image_url: website.about_image_url ?? null,
                about_header: website.about_header ?? null,
                about_subheader: website.about_subheader ?? null,
                about_paragraph: website.about_paragraph ?? null,
              }}
              companyId={companyId!}
              onUpdate={(updates) => updateWebsite.mutate(updates)}
              isUpdating={updateWebsite.isPending}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <SmartWebsiteAnalytics 
              websiteId={website.id}
              metrics={metrics}
              monthlyLimit={website.monthly_visitor_limit}
              onViewLimitOptions={() => setShowLimitModal(true)}
            />
          </TabsContent>

          <TabsContent value="domain">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>Connect your own domain to your Smart Website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Custom Domain</Label>
                  <Input
                    defaultValue={website.custom_domain || ''}
                    onBlur={(e) => updateWebsite.mutate({ custom_domain: e.target.value })}
                    placeholder="book.yourdomain.com"
                  />
                </div>
                
                {website.custom_domain && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      {website.domain_verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <span className="font-medium">
                        {website.domain_verified ? 'Domain Verified' : 'Verification Pending'}
                      </span>
                    </div>
                    
                    {!website.domain_verified && (
                      <div className="text-sm space-y-2">
                        <p>Add the following DNS records to your domain:</p>
                        <div className="bg-background p-3 rounded font-mono text-xs space-y-1">
                          <p>Type: CNAME</p>
                          <p>Name: {website.custom_domain}</p>
                          <p>Value: site.auraintercept.app</p>
                        </div>
                        <div className="bg-background p-3 rounded font-mono text-xs space-y-1">
                          <p>Type: TXT</p>
                          <p>Name: _aura-verify.{website.custom_domain}</p>
                          <p>Value: {website.dns_verification_code}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {websiteUrl && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>Share your website with a QR code</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <QRCodeSVG value={websiteUrl} size={200} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Visitor Limit Modal */}
        <VisitorLimitModal
          open={showLimitModal}
          onOpenChange={setShowLimitModal}
          currentVisitors={metrics?.page_views || 0}
          visitorLimit={website.monthly_visitor_limit}
          currentTier={company?.subscription_tier || 'single_point'}
        />
      </div>
      </PageContainer>
    </DashboardLayout>
  );
}
