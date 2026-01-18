import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MapPin, Clock, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';
import { SmartWebsiteVoiceButton } from '@/components/smartwebsite/SmartWebsiteVoiceButton';
interface WebsiteData {
  id: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  primary_color: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  cta_text: string | null;
  cta_url: string | null;
  show_services: boolean;
  show_hours: boolean;
  show_contact: boolean;
  show_chat_widget: boolean;
  show_voice_widget: boolean;
  background_style: string | null;
  is_published: boolean;
  subscription_tier: string | null;
  trial_ends_at: string | null;
  // About section fields
  show_about_section: boolean | null;
  about_image_url: string | null;
  about_header: string | null;
  about_subheader: string | null;
  about_paragraph: string | null;
  // Night mode fields
  night_mode_enabled: boolean | null;
  night_header: string | null;
  night_subheadline: string | null;
  night_start_hour: number | null;
  night_end_hour: number | null;
  night_cta_text: string | null;
  night_cta_url: string | null;
  // Gallery and background fields
  gallery_images: string[] | null;
  background_image_url: string | null;
  logo_transparency_mode: 'none' | 'multiply' | 'contrast' | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
}

interface BusinessHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate a simple fingerprint for visitor tracking (privacy-friendly)
function generateVisitorFingerprint(): string {
  const stored = sessionStorage.getItem('visitor_fingerprint');
  if (stored) return stored;
  
  const fingerprint = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem('visitor_fingerprint', fingerprint);
  return fingerprint;
}

export default function SmartWebsite() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [hasTracked, setHasTracked] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Generate/retrieve visitor fingerprint for tracking
  const visitorFingerprint = useMemo(() => generateVisitorFingerprint(), []);

  // Fetch website data
  const { data: website, isLoading, error } = useQuery({
    queryKey: ['smart-website', subdomain],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_website_public_data', { website_subdomain: subdomain });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      // Map the RPC response to our interface
      const row = data[0];
      return {
        ...row,
        gallery_images: Array.isArray(row.gallery_images) ? row.gallery_images : [],
      } as WebsiteData;
    },
    enabled: !!subdomain,
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['smart-website-services', website?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration_minutes')
        .eq('company_id', website!.company_id)
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!website?.company_id && website.show_services,
  });

  // Fetch business hours (office hours for public website)
  const {
    data: businessHours = [],
    isLoading: isHoursLoading,
  } = useQuery({
    queryKey: ['smart-website-hours', subdomain],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_website_public_hours', { p_subdomain: subdomain });

      if (error) throw error;
      return (data || []) as BusinessHour[];
    },
    enabled: !!subdomain && !!website?.show_hours,
    initialData: [],
  });

  // Fetch active holiday message for today
  const { data: activeHoliday } = useQuery({
    queryKey: ['smart-website-holiday', website?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('get_website_active_holiday', { 
          p_website_id: website!.id,
          p_check_date: today 
        });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!website?.id,
  });

  // Track page view
  useEffect(() => {
    if (website?.id && !hasTracked) {
      supabase.rpc('increment_site_metric', {
        p_website_id: website.id,
        p_metric: 'page_views'
      });
      setHasTracked(true);
    }
  }, [website?.id, hasTracked]);

  // Time-based dynamic header logic
  useEffect(() => {
    if (!website?.night_mode_enabled) {
      setIsNightMode(false);
      return;
    }

    const currentHour = new Date().getHours();
    const nightStart = website.night_start_hour ?? 18;
    const nightEnd = website.night_end_hour ?? 6;

    // Handle overnight periods (e.g., 18:00 - 06:00)
    const isNight = nightStart > nightEnd
      ? (currentHour >= nightStart || currentHour < nightEnd)
      : (currentHour >= nightStart && currentHour < nightEnd);

    setIsNightMode(isNight);
  }, [website?.night_mode_enabled, website?.night_start_hour, website?.night_end_hour]);

  // Check if currently open
  const isCurrentlyOpen = () => {
    if (!businessHours) return null;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!todayHours || todayHours.is_closed) return false;
    
    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  };

  const openStatus = isCurrentlyOpen();

  // Tier-based widget visibility
  // Voice and Chat require paid subscription (Single-Point+) or active trial
  const isInTrial = website?.trial_ends_at && new Date(website.trial_ends_at) > new Date();
  const isPaidTier = ['single_point', 'multi_track', 'command'].includes(website?.subscription_tier || '');
  const canShowVoice = website?.show_voice_widget && (isInTrial || isPaidTier);
  const canShowChat = website?.show_chat_widget && (isInTrial || isPaidTier);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-16 w-16 mx-auto rounded-full" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">Website Not Found</h1>
          <p className="text-muted-foreground">This smart website doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  const primaryColor = website.primary_color || '#214ebb';

  // Determine display content based on holiday, night mode, or default
  // Priority: Holiday > Night Mode > Default
  const displayHeadline = activeHoliday?.custom_headline
    ? activeHoliday.custom_headline
    : isNightMode && website.night_header
      ? website.night_header
      : website.hero_headline || `Welcome to ${website.company_name}`;
  
  const displaySubheadline = activeHoliday?.custom_subheadline
    ? activeHoliday.custom_subheadline
    : isNightMode && website.night_subheadline
      ? website.night_subheadline
      : website.hero_subheadline || 'Professional service you can trust';

  const displayCtaText = activeHoliday?.custom_cta_text || website.cta_text || 'Book Now';
  const displayCtaUrl = activeHoliday?.custom_cta_url || website.cta_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {website.company_logo_url ? (
              <div className="h-16 w-auto flex items-center">
                <img 
                  src={website.company_logo_url} 
                  alt={website.company_name} 
                  className="max-h-full w-auto object-contain"
                  style={{ maxWidth: '200px' }}
                />
              </div>
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {website.company_name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-lg">{website.company_name}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Emergency CTA (shown during night mode) */}
            {isNightMode && website.night_cta_text && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (website.night_cta_url) {
                    window.location.href = website.night_cta_url;
                  }
                }}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {website.night_cta_text}
              </Button>
            )}
            <Button 
              size="sm" 
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                supabase.rpc('increment_site_metric', {
                  p_website_id: website.id,
                  p_metric: 'booking_clicks'
                });
                if (displayCtaUrl) {
                  window.location.href = displayCtaUrl;
                }
              }}
            >
              {displayCtaText}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-20 px-4 relative"
        style={{ 
          backgroundImage: website.background_image_url 
            ? `url(${website.background_image_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: !website.background_image_url && website.background_style !== 'gradient' 
            ? undefined 
            : undefined,
        }}
      >
        {/* Dark overlay for text readability when background image exists */}
        {website.background_image_url && (
          <div className="absolute inset-0 bg-black/50" />
        )}
        {/* Gradient background when no image */}
        {!website.background_image_url && website.background_style === 'gradient' && (
          <div 
            className="absolute inset-0" 
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` 
            }} 
          />
        )}
        
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${website.background_image_url ? 'text-white drop-shadow-lg' : ''}`}>
            {displayHeadline}
          </h1>
          <p className={`text-xl mb-8 ${website.background_image_url ? 'text-white/90 drop-shadow-md' : 'text-muted-foreground'}`}>
            {displaySubheadline}
          </p>
          {openStatus !== null && (
            <Badge 
              variant={openStatus ? 'default' : 'secondary'} 
              className={`mb-6 ${website.background_image_url ? 'bg-white/90 text-foreground' : ''}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {openStatus ? 'Open Now' : 'Currently Closed'}
            </Badge>
          )}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button 
              size="lg" 
              className="text-lg px-8"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                supabase.rpc('increment_site_metric', {
                  p_website_id: website.id,
                  p_metric: 'booking_clicks'
                });
                if (displayCtaUrl) {
                  window.location.href = displayCtaUrl;
                }
              }}
            >
              {displayCtaText}
            </Button>
            {/* Emergency CTA in hero (shown during night mode, not on holidays) */}
            {isNightMode && !activeHoliday && website.night_cta_text && (
              <Button
                variant="destructive"
                size="lg"
                className="text-lg px-8"
                onClick={() => {
                  if (website.night_cta_url) {
                    window.location.href = website.night_cta_url;
                  }
                }}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {website.night_cta_text}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      {website.show_about_section && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column - Image */}
              <div className="aspect-[3/2] rounded-xl overflow-hidden bg-muted shadow-lg">
                {website.about_image_url ? (
                  <img 
                    src={website.about_image_url} 
                    alt="About us" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <span className="text-muted-foreground text-lg">Company Image</span>
                  </div>
                )}
              </div>
              
              {/* Right Column - Text */}
              <div className="space-y-4">
                {website.about_header && (
                  <h2 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>
                    {website.about_header}
                  </h2>
                )}
                {website.about_subheader && (
                  <h3 className="text-xl text-muted-foreground font-medium">
                    {website.about_subheader}
                  </h3>
                )}
                {website.about_paragraph && (
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {website.about_paragraph}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {website.gallery_images && website.gallery_images.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {website.gallery_images.map((imageUrl, idx) => (
                <div 
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer 
                             hover:opacity-90 transition-all duration-200 hover:scale-[1.02] 
                             transform shadow-md hover:shadow-lg"
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={`Gallery image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {website.show_services && services && services.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {service.price && (
                      <span className="font-bold" style={{ color: primaryColor }}>
                        ${service.price}
                      </span>
                    )}
                    {service.duration_minutes && (
                      <span className="text-sm text-muted-foreground">
                        {service.duration_minutes} min
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Business Hours Section */}
      {website.show_hours && !isHoursLoading && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-md">
            <h2 className="text-3xl font-bold text-center mb-10">Business Hours</h2>
            <Card className="p-6">
              <div className="space-y-3">
                {DAYS.map((day, index) => {
                  const hours = businessHours.find(h => h.day_of_week === index);
                  const isToday = new Date().getDay() === index;

                  const isClosed = !hours || hours.is_closed || !hours.open_time || !hours.close_time;
                  const is24Hours =
                    !!hours &&
                    !hours.is_closed &&
                    hours.open_time.startsWith('00:00') &&
                    hours.close_time.startsWith('23:59');

                  return (
                    <div
                      key={day}
                      className={`flex justify-between ${isToday ? 'font-semibold' : ''}`}
                    >
                      <span>{day}</span>
                      <span className="text-muted-foreground">
                        {isClosed ? 'Closed' : is24Hours ? 'Open 24 Hours' : `${hours.open_time.slice(0, 5)} - ${hours.close_time.slice(0, 5)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {website.show_contact && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-center mb-10">Contact Us</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Phone className="w-5 h-5" />
                </div>
                <span className="text-sm text-muted-foreground">Contact us for details</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-sm text-muted-foreground">Email us anytime</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-sm text-muted-foreground">Visit our location</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {website.company_name}. All rights reserved.</p>
          <p className="mt-2">
            Powered by <a href="/" className="hover:underline" style={{ color: primaryColor }}>Aura Intercept</a>
          </p>
        </div>
      </footer>

      {/* Voice Widget - only for paid tiers or trial */}
      {canShowVoice && (
        <SmartWebsiteVoiceButton
          websiteId={website.id}
          companyId={website.company_id}
          companyName={website.company_name}
          visitorFingerprint={visitorFingerprint}
          primaryColor={primaryColor}
        />
      )}

      {/* Chat Widget - only for paid tiers or trial */}
      {canShowChat && (
        <FloatingChatWidget
          websiteId={website.id}
          companyId={website.company_id}
          companySlug={subdomain || ''}
          companyName={website.company_name}
          visitorFingerprint={visitorFingerprint}
          primaryColor={primaryColor}
          useMultiAgent={true}
        />
      )}

      {/* Gallery Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          {website?.gallery_images && website.gallery_images.length > 0 && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              {/* Close button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              {/* Previous arrow */}
              {website.gallery_images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={() => setLightboxIndex(prev => 
                    prev === 0 ? website.gallery_images!.length - 1 : prev - 1
                  )}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              
              {/* Main image */}
              <img 
                src={website.gallery_images[lightboxIndex]} 
                alt={`Gallery ${lightboxIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
              
              {/* Next arrow */}
              {website.gallery_images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={() => setLightboxIndex(prev => 
                    prev === website.gallery_images!.length - 1 ? 0 : prev + 1
                  )}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {website.gallery_images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
