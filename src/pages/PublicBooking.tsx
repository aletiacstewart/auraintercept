import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';
import { BookingForm, BookingData } from '@/components/ai/BookingForm';
import { toast } from 'sonner';
import { usePublicIndustryPack } from '@/hooks/useIndustryPack';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
}

/**
 * Public, unauthenticated booking entry point: /book/:companySlug
 * Mounts <BookingForm> in `isPublic` mode so the dynamic intake fields are
 * driven by the SECURITY DEFINER `get_public_industry_pack` RPC, then submits
 * the booking via `submit_public_booking` (creates a lead with intake_data).
 */
export default function PublicBooking() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === '1';
  const themeParam = searchParams.get('theme');
  const primaryParam = searchParams.get('primary');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const embedRootRef = useRef<HTMLDivElement | null>(null);

  // Apply theme + primary color overrides when embedded on third-party sites.
  useEffect(() => {
    if (!isEmbed) return;
    if (themeParam === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themeParam === 'light') {
      document.documentElement.classList.remove('dark');
    }
    if (primaryParam && /^#?[0-9a-fA-F]{6}$/.test(primaryParam)) {
      // Caller passed a hex; convert to HSL tokens used by the design system.
      const hex = primaryParam.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0; const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
      }
      document.documentElement.style.setProperty(
        '--primary',
        `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`,
      );
    }
  }, [isEmbed, themeParam, primaryParam]);

  // Report height to parent so the loader script can auto-resize the iframe.
  useEffect(() => {
    if (!isEmbed) return;
    const root = embedRootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const post = () => {
      try {
        window.parent?.postMessage(
          {
            source: 'aura-booking',
            type: 'resize',
            slug: companySlug ?? null,
            height: root.scrollHeight,
          },
          '*',
        );
      } catch {
        /* noop */
      }
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(root);
    return () => ro.disconnect();
  }, [isEmbed, companySlug, submitted, submitting]);

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['public-booking-company', companySlug],
    queryFn: async () => {
      if (!companySlug) return null;
      const { data, error } = await supabase
        .rpc('get_company_public_info', { p_slug: companySlug })
        .single();
      if (error) throw error;
      return data as unknown as PublicCompany;
    },
    enabled: !!companySlug,
  });

  // Industry-aware terminology for the booking page header + confirmation copy.
  const { pack } = usePublicIndustryPack(company?.id ?? null);
  const apptNoun = (pack.terminology?.appointment as string) || 'Appointment';
  const apptNounLower = apptNoun.toLowerCase();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['public-booking-services', company?.id],
    queryFn: async () => {
      if (!company?.id) return [] as PublicService[];
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, duration_minutes, price')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }
      return (data || []) as PublicService[];
    },
    enabled: !!company?.id,
  });

  const headerStyle = useMemo(() => {
    if (!company?.primary_color) return undefined;
    return { backgroundColor: company.primary_color } as React.CSSProperties;
  }, [company?.primary_color]);

  const handleSubmit = async (booking: BookingData) => {
    if (!company) return;
    setSubmitting(true);
    try {
      const [hh, mm] = booking.time.split(':').map((n) => parseInt(n, 10));
      const dt = new Date(booking.date);
      dt.setHours(hh, mm, 0, 0);

      const serviceNames = services
        .filter((s) => booking.selectedServices.includes(s.id))
        .map((s) => s.name)
        .join(', ');

      const { error } = await supabase.rpc('submit_public_booking', {
        p_company_id: company.id,
        p_name: booking.customerName,
        p_phone: booking.customerPhone,
        p_email: null,
        p_address: booking.customerAddress,
        p_service_interest: serviceNames || null,
        p_preferred_datetime: dt.toISOString(),
        p_notes: booking.notes ?? null,
        p_intake_data: (booking.intakeData ?? {}) as never,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success(`${apptNoun} request sent`);
    } catch (err) {
      console.error('Public booking submission failed', err);
      toast.error('Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (companyLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-xl mx-auto space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h1 className="text-lg font-semibold mb-1">Booking page not found</h1>
            <p className="text-sm text-muted-foreground">
              We couldn't find a company at this link. Please double-check the URL.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chromeless layout for iframe embeds
  if (isEmbed) {
    return (
      <div ref={embedRootRef} className="bg-transparent p-3">
        {submitted ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-lg font-semibold">Request received</h2>
              <p className="text-sm text-muted-foreground">
                Thanks! {company.name} will reach out shortly to confirm your {apptNounLower}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <BookingForm
                services={services}
                onSubmit={handleSubmit}
                isLoading={submitting}
                companyId={company.id}
                isPublic
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-xl mx-auto w-full px-4 py-4 flex items-center gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="w-10 h-10 rounded-lg object-contain bg-muted"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-lg"
              style={headerStyle ?? { backgroundColor: 'hsl(var(--primary))' }}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">{company.name}</h1>
            <p className="text-xs text-muted-foreground">Request {apptNounLower === 'appointment' ? 'an appointment' : `a ${apptNounLower}`}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4">
        {submitted ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-lg font-semibold">Request received</h2>
              <p className="text-sm text-muted-foreground">
                Thanks! {company.name} will reach out shortly to confirm your {apptNounLower}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <BookingForm
                services={services}
                onSubmit={handleSubmit}
                isLoading={submitting}
                companyId={company.id}
                isPublic
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}