import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { parseUTCDateTime } from '@/lib/dateUtils';
import { 
  ArrowLeft, 
  Bot, 
  Calendar, 
  FileText, 
  MessageSquare,
  Phone,
  Clock,
  MapPin,
  DollarSign,
  Star,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { UnifiedCustomerConsole } from '@/components/customer/UnifiedCustomerConsole';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  ai_agent_prompt: string | null;
  ai_voice_greeting: string | null;
  phone: string | null;
  contact_phone: string | null;
  business_phone: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  category: string | null;
}

export default function CustomerCompanyPortal() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');

  // Fetch company details using secure RPC function for public info
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company-public', companySlug],
    queryFn: async () => {
      if (!companySlug) return null;
      // Use the secure RPC function which only returns non-sensitive fields
      const { data, error } = await supabase
        .rpc('get_company_public_info', { p_slug: companySlug })
        .single();

      if (error) throw error;
      return { 
        ...data, 
        ai_agent_prompt: null, 
        ai_voice_greeting: null,
      } as Company;
    },
    enabled: !!companySlug,
  });

  // Fetch company services using authenticated query (requires user to be logged in via RLS)
  // For public access, use the widget-api endpoint instead
  const { data: services } = useQuery({
    queryKey: ['company-services', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      // The services query works with authenticated users via RLS
      // For public users, the AI chat uses secure RPC functions
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, category')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.warn('Services fetch failed, may require authentication:', error);
        return [];
      }
      return (data || []) as Service[];
    },
    enabled: !!company?.id,
  });

  // Fetch customer's appointments with this company - use customer_user_id first, fallback to email
  const { data: appointments } = useQuery({
    queryKey: ['customer-appointments', user?.id, company?.id],
    queryFn: async () => {
      if (!user || !company) return [];
      
      // First try to find appointments by customer_user_id (most reliable)
      const { data: appointmentsByUserId, error: userIdError } = await supabase
        .from('appointments')
        .select('id, service_type, datetime, status, customer_address')
        .eq('company_id', company.id)
        .eq('customer_user_id', user.id)
        .order('datetime', { ascending: false })
        .limit(10);

      if (!userIdError && appointmentsByUserId && appointmentsByUserId.length > 0) {
        return appointmentsByUserId;
      }

      // Fallback: find appointments by email (for legacy/anonymous bookings)
      const { data: appointmentsByEmail, error } = await supabase
        .from('appointments')
        .select('id, service_type, datetime, status, customer_address')
        .eq('company_id', company.id)
        .eq('customer_email', user.email)
        .order('datetime', { ascending: false })
        .limit(10);

      if (error) throw error;
      return appointmentsByEmail || [];
    },
    enabled: !!user && !!company?.id,
  });

  // Update last interaction
  useEffect(() => {
    const updateInteraction = async () => {
      if (!user || !company) return;
      
      await supabase
        .from('customer_company_associations')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('customer_user_id', user.id)
        .eq('company_id', company.id);
    };

    updateInteraction();
  }, [user, company]);

  if (companyLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Company not found</p>
            <Button onClick={() => navigate('/customer-portal')} className="mt-4">
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer-portal')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${company.primary_color || '#0EA5E9'}, ${company.secondary_color || '#8B5CF6'})`
            }}
          >
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              company.name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{company.name}</h1>
            <p className="text-xs text-muted-foreground">Customer Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="inline-flex flex-wrap h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Chat Tab - Using Unified Customer Console */}
          <TabsContent value="chat" className="mt-0">
            <UnifiedCustomerConsole 
              companyId={company.id} 
              companySlug={company.slug}
              userId={user?.id}
            />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Our Services</CardTitle>
                <CardDescription>Browse available services and pricing</CardDescription>
              </CardHeader>
              <CardContent>
                {!services || services.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No services listed yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {service.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration_minutes} min
                              </span>
                            )}
                            {service.category && (
                              <Badge variant="outline">{service.category}</Badge>
                            )}
                          </div>
                        </div>
                        {service.price && (
                          <div className="text-right">
                            <p className="text-lg font-bold">${service.price}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
                <CardDescription>View your booking history</CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Sign in to view your appointments</p>
                    <Button onClick={() => navigate('/customer-auth')}>Sign In</Button>
                  </div>
                ) : !appointments || appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No appointments yet</p>
                    <Button className="mt-4" onClick={() => setActiveTab('chat')}>
                      <Bot className="w-4 h-4 mr-2" />
                      Book with AI Assistant
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{apt.service_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseUTCDateTime(apt.datetime), 'MMM d, yyyy h:mm a')}
                          </p>
                          {apt.customer_address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {apt.customer_address}
                            </p>
                          )}
                        </div>
                        <Badge variant={apt.status === 'completed' ? 'secondary' : 'default'}>
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
                <CardDescription>Get in touch with {company.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('chat')}
                  >
                    <Bot className="w-8 h-8 text-primary" />
                    <span className="font-medium">AI Chat</span>
                    <span className="text-xs text-muted-foreground">Get instant answers</span>
                  </Button>
                  {(() => {
                    const companyPhone = company.contact_phone || company.business_phone || company.phone;
                    return companyPhone ? (
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`tel:${companyPhone}`, '_self')}
                      >
                        <Phone className="w-8 h-8 text-primary" />
                        <span className="font-medium">Call Us</span>
                        <span className="text-xs text-muted-foreground">{companyPhone}</span>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center gap-2 opacity-50"
                        disabled
                      >
                        <Phone className="w-8 h-8 text-muted-foreground" />
                        <span className="font-medium">Call Us</span>
                        <span className="text-xs text-muted-foreground">Phone not available</span>
                      </Button>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
