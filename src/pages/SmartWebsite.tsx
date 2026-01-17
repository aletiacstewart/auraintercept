import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingChatWidget } from '@/components/landing/FloatingChatWidget';
import { SmartWebsiteVoiceButton } from '@/components/smartwebsite/SmartWebsiteVoiceButton';

interface WebsiteData {
  website_id: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  cta_button_text: string;
  cta_button_url: string | null;
  show_services: boolean;
  show_hours: boolean;
  show_contact: boolean;
  show_chat_widget: boolean;
  show_voice_widget: boolean;
  background_style: string;
  background_image_url: string | null;
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
  
  // Generate/retrieve visitor fingerprint for tracking
  const visitorFingerprint = useMemo(() => generateVisitorFingerprint(), []);

  // Fetch website data
  const { data: website, isLoading, error } = useQuery({
    queryKey: ['smart-website', subdomain],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_website_public_data', { p_subdomain: subdomain });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as WebsiteData;
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

  // Fetch business hours
  const { data: businessHours } = useQuery({
    queryKey: ['smart-website-hours', website?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('company_id', website!.company_id)
        .order('day_of_week');
      
      if (error) throw error;
      return data as BusinessHour[];
    },
    enabled: !!website?.company_id && website.show_hours,
  });

  // Track page view
  useEffect(() => {
    if (website?.website_id && !hasTracked) {
      supabase.rpc('increment_site_metric', {
        p_website_id: website.website_id,
        p_metric: 'page_views'
      });
      setHasTracked(true);
    }
  }, [website?.website_id, hasTracked]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {website.logo_url ? (
              <img src={website.logo_url} alt={website.company_name} className="h-10 w-auto" />
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
            {website.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${website.phone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            <Button 
              size="sm" 
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                supabase.rpc('increment_site_metric', {
                  p_website_id: website.website_id,
                  p_metric: 'booking_clicks'
                });
                if (website.cta_button_url) {
                  window.location.href = website.cta_button_url;
                }
              }}
            >
              {website.cta_button_text}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-20 px-4"
        style={{ 
          background: website.background_style === 'gradient' 
            ? `linear-gradient(135deg, ${primaryColor}15 0%, ${website.secondary_color || '#46a2d3'}15 100%)`
            : undefined
        }}
      >
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {website.hero_headline || `Welcome to ${website.company_name}`}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {website.hero_subheadline || 'Professional service you can trust'}
          </p>
          {openStatus !== null && (
            <Badge variant={openStatus ? 'default' : 'secondary'} className="mb-6">
              <Clock className="w-3 h-3 mr-1" />
              {openStatus ? 'Open Now' : 'Currently Closed'}
            </Badge>
          )}
          <Button 
            size="lg" 
            className="text-lg px-8"
            style={{ backgroundColor: primaryColor }}
            onClick={() => {
              supabase.rpc('increment_site_metric', {
                p_website_id: website.website_id,
                p_metric: 'booking_clicks'
              });
              if (website.cta_button_url) {
                window.location.href = website.cta_button_url;
              }
            }}
          >
            {website.cta_button_text}
          </Button>
        </div>
      </section>

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
      {website.show_hours && businessHours && businessHours.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-md">
            <h2 className="text-3xl font-bold text-center mb-10">Business Hours</h2>
            <Card className="p-6">
              <div className="space-y-3">
                {DAYS.map((day, index) => {
                  const hours = businessHours.find(h => h.day_of_week === index);
                  const isToday = new Date().getDay() === index;
                  return (
                    <div 
                      key={day} 
                      className={`flex justify-between ${isToday ? 'font-semibold' : ''}`}
                    >
                      <span>{day}</span>
                      <span className="text-muted-foreground">
                        {hours?.is_closed 
                          ? 'Closed' 
                          : hours 
                            ? `${hours.open_time.slice(0, 5)} - ${hours.close_time.slice(0, 5)}`
                            : 'Closed'
                        }
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
              {website.phone && (
                <a href={`tel:${website.phone}`} className="flex flex-col items-center gap-2 hover:opacity-80">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{website.phone}</span>
                </a>
              )}
              {website.email && (
                <a href={`mailto:${website.email}`} className="flex flex-col items-center gap-2 hover:opacity-80">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{website.email}</span>
                </a>
              )}
              {website.address && (
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{website.address}</span>
                </div>
              )}
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

      {/* Voice Widget */}
      {website.show_voice_widget && (
        <SmartWebsiteVoiceButton
          websiteId={website.website_id}
          companyId={website.company_id}
          companyName={website.company_name}
          visitorFingerprint={visitorFingerprint}
          primaryColor={primaryColor}
        />
      )}

      {/* Chat Widget */}
      {website.show_chat_widget && (
        <FloatingChatWidget
          websiteId={website.website_id}
          companyId={website.company_id}
          companyName={website.company_name}
          visitorFingerprint={visitorFingerprint}
          primaryColor={primaryColor}
          useMultiAgent={true}
        />
      )}
    </div>
  );
}
