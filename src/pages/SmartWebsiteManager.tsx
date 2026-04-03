import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  QrCode,
  Moon,
  Sun,
  ChevronDown,
  Briefcase,
  Clock,
  Phone,
  Type,
  Info,
  X,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PageHeader } from '@/components/ui/page-header';
import { QRCodeSVG } from 'qrcode.react';
import { VisitorLimitModal } from '@/components/smartwebsite/VisitorLimitModal';
import { SmartWebsiteAnalytics } from '@/components/smartwebsite/SmartWebsiteAnalytics';
import { AboutSectionEditor } from '@/components/smartwebsite/AboutSectionEditor';
import { HolidayMessageManager } from '@/components/smartwebsite/HolidayMessageManager';
import { GalleryManager } from '@/components/smartwebsite/GalleryManager';
import { LogoEditor } from '@/components/smartwebsite/LogoEditor';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { HeroBackgroundUpload } from '@/components/smartwebsite/HeroBackgroundUpload';
import { SmartWebsiteServicesEditor } from '@/components/smartwebsite/SmartWebsiteServicesEditor';
import { SmartWebsiteHoursEditor } from '@/components/smartwebsite/SmartWebsiteHoursEditor';
import { SmartWebsiteContactEditor } from '@/components/smartwebsite/SmartWebsiteContactEditor';
import { AIContentButton } from '@/components/ai/AIContentButton';
import { TavilyStatusBadge } from '@/components/ai/TavilyStatusBadge';
import { BlogManagementTab } from '@/components/blog/BlogManagementTab';

// Extended type for website data with new night mode fields
interface ExtendedWebsiteData {
  id: string;
  company_id: string;
  subdomain: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  cta_button_text: string | null;
  cta_button_url: string | null;
  show_services: boolean;
  show_hours: boolean;
  show_contact: boolean;
  show_chat_widget: boolean;
  show_voice_widget: boolean;
  show_blog: boolean | null;
  is_published: boolean;
  monthly_visitor_limit: number;
  custom_domain: string | null;
  domain_verified: boolean;
  dns_verification_code: string | null;
  show_about_section: boolean | null;
  about_image_url: string | null;
  about_header: string | null;
  about_subheader: string | null;
  about_paragraph: string | null;
  // Night mode fields
  enable_night_mode?: boolean;
  night_header?: string | null;
  night_subheadline?: string | null;
  night_start_hour?: number;
  night_end_hour?: number;
  emergency_cta_text?: string | null;
  emergency_cta_url?: string | null;
  // Gallery and media fields
  gallery_images?: string[];
  background_image_url?: string | null;
  logo_transparency_mode?: 'none' | 'multiply' | 'contrast';
  show_gallery?: boolean;
  // Console feature visibility toggles
  show_console_appointments?: boolean;
  show_console_quotes?: boolean;
  show_console_tracking?: boolean;
  show_console_billing?: boolean;
  show_console_emergency?: boolean;
  show_console_feedback?: boolean;
}

export default function SmartWebsiteManager() {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasShownLimitWarning, setHasShownLimitWarning] = useState(false);
  const [previewMode, setPreviewMode] = useState<'day' | 'night'>('day');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const refreshPreview = useCallback(() => setPreviewKey(k => k + 1), []);

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
      return data as unknown as ExtendedWebsiteData | null;
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
      toast.success('Aura Web Presence created!');
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

  // Verify domain mutation
  const verifyDomain = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { websiteId: website!.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast.success('Domain verified successfully!');
        queryClient.invalidateQueries({ queryKey: ['smart-website-admin'] });
      } else {
        toast.error(data.message || 'DNS records not found yet');
      }
    },
    onError: () => {
      toast.error('Failed to verify domain');
    }
  });

  // Use custom domain if verified, otherwise fallback to subdomain URL
  const websiteUrl = website?.subdomain 
    ? website.domain_verified && website.custom_domain
      ? `https://${website.custom_domain}`
      : `${window.location.origin}/site/${website.subdomain}`
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
              <CardTitle>Create Your Aura Web Presence</CardTitle>
              <CardDescription>
                Get a professional Aura Web Presence page that showcases your services, hours, and includes an AI chat widget.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => createWebsite.mutate()}
                disabled={createWebsite.isPending}
                size="lg"
              >
                {createWebsite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Aura Web Presence
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
            title="Web Presence"
            description="Manage your company's Web Presence page"
            featureColor="config"
            showAuraBar
            action={
              websiteUrl ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.open(websiteUrl, '_blank')}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => copyToClipboard(websiteUrl)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              ) : undefined
            }
          />

        {/* Status Card */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${website.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div className="min-w-0">
                  <p className="font-medium">{website.is_published ? 'Published' : 'Draft'}</p>
                  <p className="text-sm text-muted-foreground break-all">{websiteUrl}</p>
                </div>
              </div>
              <Switch
                checked={website.is_published}
                onCheckedChange={(checked) => updateWebsite.mutate({ is_published: checked })}
                className="flex-shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="content" className="flex-shrink-0">Content</TabsTrigger>
            <TabsTrigger value="media" className="flex-shrink-0">Media</TabsTrigger>
            <TabsTrigger value="sections" className="flex-shrink-0 whitespace-nowrap">Visibility</TabsTrigger>
            <TabsTrigger value="blog" className="flex-shrink-0">Blog</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-shrink-0">Analytics</TabsTrigger>
            <TabsTrigger value="domain" className="flex-shrink-0">Domain</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Tavily Status Badge */}
            {companyId && (
              <div className="flex justify-end">
                <TavilyStatusBadge companyId={companyId} showDisconnected />
              </div>
            )}
            
            {/* Hero Section */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">Hero Section</CardTitle>
                        <CardDescription>Customize your website's hero area</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-card-foreground/70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-card-foreground">Hero Headline</Label>
                        <AIContentButton
                          contentType="hero_headline"
                          existingContent={website.hero_headline || ''}
                          context={{ companyName: company?.name }}
                          onGenerate={(content) => updateWebsite.mutate({ hero_headline: content })}
                        />
                      </div>
                      <Input
                        key={`hero_headline_${website.hero_headline}`}
                        defaultValue={website.hero_headline || ''}
                        onBlur={(e) => updateWebsite.mutate({ hero_headline: e.target.value })}
                        placeholder="Welcome to Your Business"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-card-foreground">Hero Subheadline</Label>
                        <AIContentButton
                          contentType="hero_subheadline"
                          existingContent={website.hero_subheadline || ''}
                          context={{ companyName: company?.name }}
                          onGenerate={(content) => updateWebsite.mutate({ hero_subheadline: content })}
                        />
                      </div>
                      <Textarea
                        key={`hero_subheadline_${website.hero_subheadline}`}
                        defaultValue={website.hero_subheadline || ''}
                        onBlur={(e) => updateWebsite.mutate({ hero_subheadline: e.target.value })}
                        placeholder="Professional service you can trust"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-card-foreground">CTA Button Text</Label>
                        <AIContentButton
                          contentType="cta_text"
                          existingContent={website.cta_button_text || ''}
                          context={{ companyName: company?.name }}
                          onGenerate={(content) => updateWebsite.mutate({ cta_button_text: content })}
                        />
                      </div>
                      <Input
                        key={`cta_button_text_${website.cta_button_text}`}
                        defaultValue={website.cta_button_text || 'Book Now'}
                        onBlur={(e) => updateWebsite.mutate({ cta_button_text: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-card-foreground">CTA Button URL</Label>
                      <Input
                        defaultValue={website.cta_button_url || ''}
                        onBlur={(e) => updateWebsite.mutate({ cta_button_url: e.target.value })}
                        placeholder="/customer-portal/your-company"
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* AI-Dynamic Header Section */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">AI-Dynamic Header</CardTitle>
                        <CardDescription>Display different content based on visitor's local time</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-card-foreground/70" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Day/Night Preview Toggle */}
                    {website.enable_night_mode && (
                      <ToggleGroup 
                        type="single" 
                        value={previewMode}
                        onValueChange={(value) => value && setPreviewMode(value as 'day' | 'night')}
                        className="bg-muted rounded-lg p-1"
                      >
                        <ToggleGroupItem value="day" aria-label="Day preview" className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3">
                          <Sun className="w-4 h-4 mr-1" />
                          Day
                        </ToggleGroupItem>
                        <ToggleGroupItem value="night" aria-label="Night preview" className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3">
                          <Moon className="w-4 h-4 mr-1" />
                          Night
                        </ToggleGroupItem>
                      </ToggleGroup>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">Enable Night Mode</p>
                        <p className="text-sm text-card-foreground/70">Show alternate content during evening/night hours</p>
                      </div>
                      <Switch
                        checked={website.enable_night_mode ?? false}
                        onCheckedChange={(checked) => updateWebsite.mutate({ enable_night_mode: checked })}
                      />
                    </div>

                    {website.enable_night_mode && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-card-foreground">Night Starts At</Label>
                            <Select
                              defaultValue={String(website.night_start_hour ?? 18)}
                              onValueChange={(value) => updateWebsite.mutate({ night_start_hour: parseInt(value) })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-card-foreground">Night Ends At</Label>
                            <Select
                              defaultValue={String(website.night_end_hour ?? 6)}
                              onValueChange={(value) => updateWebsite.mutate({ night_end_hour: parseInt(value) })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={String(i)}>
                                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-card-foreground">Night Headline</Label>
                            <AIContentButton
                              contentType="night_headline"
                              existingContent={website.night_header || ''}
                              context={{ companyName: company?.name }}
                              onGenerate={(content) => updateWebsite.mutate({ night_header: content })}
                            />
                          </div>
                          <Input
                            key={`night_header_${website.night_header}`}
                            defaultValue={website.night_header || ''}
                            onBlur={(e) => updateWebsite.mutate({ night_header: e.target.value })}
                            placeholder="Need help after hours?"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-card-foreground">Night Subheadline</Label>
                            <AIContentButton
                              contentType="night_subheadline"
                              existingContent={website.night_subheadline || ''}
                              context={{ companyName: company?.name }}
                              onGenerate={(content) => updateWebsite.mutate({ night_subheadline: content })}
                            />
                          </div>
                          <Textarea
                            key={`night_subheadline_${website.night_subheadline}`}
                            defaultValue={website.night_subheadline || ''}
                            onBlur={(e) => updateWebsite.mutate({ night_subheadline: e.target.value })}
                            placeholder="Our emergency team is standing by 24/7..."
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-card-foreground">Emergency CTA Text</Label>
                            <AIContentButton
                              contentType="emergency_cta"
                              existingContent={website.emergency_cta_text || ''}
                              context={{ companyName: company?.name }}
                              onGenerate={(content) => updateWebsite.mutate({ emergency_cta_text: content })}
                            />
                          </div>
                          <Input
                            key={`emergency_cta_text_${website.emergency_cta_text}`}
                            defaultValue={website.emergency_cta_text || ''}
                            onBlur={(e) => updateWebsite.mutate({ emergency_cta_text: e.target.value })}
                            placeholder="24/7 Emergency Line"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-card-foreground">Emergency CTA URL</Label>
                          <Input
                            defaultValue={website.emergency_cta_url || ''}
                            onBlur={(e) => updateWebsite.mutate({ emergency_cta_url: e.target.value })}
                            placeholder="tel:+1-555-EMERGENCY"
                          />
                          <p className="text-xs text-card-foreground/70">Use tel: for phone numbers</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* About Section - Wrapped in Collapsible like others */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">About Section</CardTitle>
                        <CardDescription>Add a two-column section with image and text</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-card-foreground/70" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-card-foreground">Section Image</Label>
                      <p className="text-xs text-card-foreground/70 mb-2">
                        Recommended: 600×400px (3:2 aspect ratio) • Max 2MB • JPG, PNG, or WEBP
                      </p>

                      {website.about_image_url ? (
                        <div className="relative w-full max-w-sm">
                          <img
                            src={website.about_image_url}
                            alt="About section"
                            className="w-full aspect-[3/2] object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={async () => {
                              try {
                                const filePath = website.about_image_url!.split('/').slice(-2).join('/');
                                await supabase.storage.from('smart-website-images').remove([filePath]);
                                updateWebsite.mutate({ about_image_url: null });
                                toast.success('Image removed');
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to remove image');
                              }
                            }}
                            disabled={updateWebsite.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full max-w-sm aspect-[3/2] border-2 border-dashed border-card-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 bg-muted/30">
                          <ImageIcon className="w-10 h-10 text-card-foreground/50" />
                          <span className="text-sm text-card-foreground/70">No image uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Text Fields */}
                    <div className="space-y-2">
                      <Label className="text-card-foreground">Header</Label>
                      <Input
                        defaultValue={website.about_header || ''}
                        onBlur={(e) => updateWebsite.mutate({ about_header: e.target.value })}
                        placeholder="About Our Company"
                        disabled={updateWebsite.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-card-foreground">Sub-header</Label>
                      <Input
                        defaultValue={website.about_subheader || ''}
                        onBlur={(e) => updateWebsite.mutate({ about_subheader: e.target.value })}
                        placeholder="Quality service since 2010"
                        disabled={updateWebsite.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-card-foreground">Paragraph</Label>
                      <Textarea
                        defaultValue={website.about_paragraph || ''}
                        onBlur={(e) => updateWebsite.mutate({ about_paragraph: e.target.value })}
                        placeholder="Tell visitors about your company, your mission, and what makes you stand out..."
                        rows={5}
                        maxLength={750}
                        disabled={updateWebsite.isPending}
                      />
                      <p className="text-xs text-card-foreground/70 text-right">
                        {website.about_paragraph?.length || 0} / 750 characters
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Services Editor */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">Services</CardTitle>
                        <CardDescription>Manage services displayed on your website</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-card-foreground/70" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <SmartWebsiteServicesEditor />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Business Hours Editor */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">Business Hours</CardTitle>
                        <CardDescription>Set your office hours for the website</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-card-foreground/70" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <SmartWebsiteHoursEditor />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Contact Info Editor */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                        <CardDescription>Phone, email, and address for visitors</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-card-foreground/70" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <SmartWebsiteContactEditor />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Holiday Messages Manager */}
            <HolidayMessageManager websiteId={website.id} companyId={companyId!} />
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            {/* Hero Background */}
            <HeroBackgroundUpload
              backgroundUrl={website.background_image_url ?? null}
              companyId={companyId!}
              onUpdate={(url) => updateWebsite.mutate({ background_image_url: url })}
              isUpdating={updateWebsite.isPending}
            />

            {/* Gallery Manager */}
            <GalleryManager
              galleryImages={website.gallery_images ?? []}
              companyId={companyId!}
              onUpdate={(images) => updateWebsite.mutate({ gallery_images: images })}
              isUpdating={updateWebsite.isPending}
            />

            {/* Logo Editor */}
            <LogoEditor
              logoUrl={company?.slug ? null : null}
              companyId={companyId!}
              onUpdate={(url) => {
                // Update company logo
                supabase.from('companies').update({ logo_url: url }).eq('id', companyId);
              }}
              transparencyMode={website.logo_transparency_mode ?? 'none'}
              onTransparencyChange={(mode) => updateWebsite.mutate({ logo_transparency_mode: mode })}
              isUpdating={updateWebsite.isPending}
            />
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
                    <p className="font-medium text-card-foreground">About Section</p>
                    <p className="text-sm text-card-foreground/70">Display your about section</p>
                  </div>
                  <Switch
                    checked={website.show_about_section ?? false}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_about_section: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Services</p>
                    <p className="text-sm text-card-foreground/70">Show your service offerings</p>
                  </div>
                  <Switch
                    checked={website.show_services}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_services: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Business Hours</p>
                    <p className="text-sm text-card-foreground/70">Display your operating hours</p>
                  </div>
                  <Switch
                    checked={website.show_hours}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_hours: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Contact Info</p>
                    <p className="text-sm text-card-foreground/70">Show phone, email, address</p>
                  </div>
                  <Switch
                    checked={website.show_contact}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_contact: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Gallery</p>
                    <p className="text-sm text-card-foreground/70">Display your image gallery</p>
                  </div>
                  <Switch
                    checked={website.show_gallery ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_gallery: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Blog</p>
                    <p className="text-sm text-card-foreground/70">Show blog link in header and display company blog posts</p>
                  </div>
                  <Switch
                    checked={website.show_blog ?? false}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_blog: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-card-foreground">Message Aura (Text)</p>
                      <HelpTooltip 
                        term="" 
                        tooltip="Text-based chat where customers type questions and receive text responses. Works on ALL tiers with no external integrations needed."
                        showIcon={true}
                      />
                    </div>
                    <p className="text-sm text-card-foreground/70">Enable text chat widget for visitors</p>
                  </div>
                  <Switch
                    checked={website.show_chat_widget}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_chat_widget: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-card-foreground">Talk to Aura (Voice)</p>
                      <HelpTooltip 
                        term="" 
                        tooltip="Speech-based conversations using microphone and speakers. Customers speak naturally and hear AI voice responses. Requires ElevenLabs + Twilio."
                        showIcon={true}
                      />
                    </div>
                    <p className="text-sm text-card-foreground/70">Enable voice conversations for visitors</p>
                  </div>
                  <Switch
                    checked={website.show_voice_widget}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_voice_widget: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Console Features Section */}
            <Card>
              <CardHeader>
                <CardTitle>Console Features</CardTitle>
                <CardDescription>Configure which features appear in your embedded chat widget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Appointments</p>
                    <p className="text-sm text-card-foreground/70">Allow customers to schedule appointments</p>
                  </div>
                  <Switch
                    checked={website.show_console_appointments ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_console_appointments: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Quotes</p>
                    <p className="text-sm text-card-foreground/70">Allow customers to request quotes</p>
                  </div>
                  <Switch
                    checked={website.show_console_quotes ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_console_quotes: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Tracking</p>
                    <p className="text-sm text-card-foreground/70">Allow customers to track service status</p>
                  </div>
                  <Switch
                    checked={website.show_console_tracking ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_console_tracking: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Billing</p>
                    <p className="text-sm text-card-foreground/70">Allow customers to view billing information</p>
                  </div>
                  <Switch
                    checked={website.show_console_billing ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_console_billing: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Emergency</p>
                    <p className="text-sm text-card-foreground/70">Show emergency contact section</p>
                  </div>
                  <Switch
                    checked={website.show_console_emergency ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_console_emergency: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Feedback</p>
                    <p className="text-sm text-card-foreground/70">Allow customers to submit feedback</p>
                  </div>
                  <Switch
                    checked={website.show_console_feedback ?? true}
                    onCheckedChange={(checked) => updateWebsite.mutate({ show_console_feedback: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagementTab />
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
                <CardDescription>Connect your own domain to your Aura Web Presence</CardDescription>
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
                      <div className="text-sm space-y-3">
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
                        
                        <Button
                          onClick={() => verifyDomain.mutate()}
                          disabled={verifyDomain.isPending}
                          variant="outline"
                          className="mt-2"
                        >
                          {verifyDomain.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Check Verification
                            </>
                          )}
                        </Button>
                        
                        <p className="text-muted-foreground text-xs">
                          DNS changes typically take 15 minutes to 48 hours to propagate.
                        </p>
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
