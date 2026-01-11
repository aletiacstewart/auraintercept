import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  User, 
  Calendar, 
  FileText, 
  DollarSign, 
  Shield, 
  Gift,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Settings,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { CommunicationPreferencesCheckboxes, CommunicationPreferences } from '@/components/customer/CommunicationPreferencesCheckboxes';
import { toast } from 'sonner';

interface CustomerProfile {
  id: string;
  company_id: string;
  email: string;
  phone: string | null;
  name: string;
  address: string | null;
  notes: string | null;
  sms_opt_out: boolean;
  email_opt_out: boolean;
  call_opt_out: boolean;
  portal_token: string;
  created_at: string;
  updated_at: string;
}

interface Appointment {
  id: string;
  customer_name: string;
  service_type: string;
  datetime: string;
  status: string;
  customer_address: string | null;
  notes: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  total: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface Quote {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  valid_until: string | null;
  created_at: string;
}

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  reward_type: string | null;
  reward_value: number | null;
  referred_name: string | null;
}

interface DashboardData {
  profile: CustomerProfile;
  appointments: Appointment[];
  invoices: Invoice[];
  quotes: Quote[];
  referrals: Referral[];
  company: {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
  };
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
    scheduled: { variant: 'default', icon: Clock },
    completed: { variant: 'secondary', icon: CheckCircle },
    cancelled: { variant: 'destructive', icon: XCircle },
    pending: { variant: 'outline', icon: Clock },
    paid: { variant: 'secondary', icon: CheckCircle },
    draft: { variant: 'outline', icon: FileText },
    sent: { variant: 'default', icon: Mail },
    accepted: { variant: 'secondary', icon: CheckCircle },
    declined: { variant: 'destructive', icon: XCircle },
  };

  const config = variants[status.toLowerCase()] || { variant: 'outline' as const, icon: AlertTriangle };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Customer Preferences Tab Component
function CustomerPreferencesTab({ 
  profile, 
  token 
}: { 
  profile: CustomerProfile; 
  token: string;
}) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<CommunicationPreferences>({
    smsOptIn: !profile.sms_opt_out,
    emailOptIn: !profile.email_opt_out,
    callOptIn: !profile.call_opt_out,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handlePreferencesChange = (newPrefs: CommunicationPreferences) => {
    setPreferences(newPrefs);
    setHasChanges(
      newPrefs.smsOptIn !== !profile.sms_opt_out ||
      newPrefs.emailOptIn !== !profile.email_opt_out ||
      newPrefs.callOptIn !== !profile.call_opt_out
    );
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { 
          action: 'update-preferences', 
          token,
          preferences: {
            sms_opt_out: !preferences.smsOptIn,
            email_opt_out: !preferences.emailOptIn,
            call_opt_out: !preferences.callOptIn,
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Preferences updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard', token] });
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Communication Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications and reminders from us
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommunicationPreferencesCheckboxes
          preferences={preferences}
          onChange={handlePreferencesChange}
          disabled={updateMutation.isPending}
        />

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
          {hasChanges && (
            <span className="text-sm text-muted-foreground">You have unsaved changes</span>
          )}
        </div>

        <Alert>
          <Shield className="w-4 h-4" />
          <AlertTitle>Your Privacy</AlertTitle>
          <AlertDescription className="text-sm">
            We respect your communication preferences. You can change these settings at any time. 
            Opting out will not affect important service-related communications about your active appointments.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default function CustomerDashboard() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-dashboard', token],
    queryFn: async (): Promise<DashboardData | null> => {
      if (!token) return null;

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { action: 'get-dashboard', token }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Invalid Link</AlertTitle>
          <AlertDescription>
            This dashboard link is invalid or has expired. Please check your email for the correct link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            We couldn't load your customer dashboard. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { profile, appointments, invoices, quotes, referrals, company } = data;
  const upcomingAppointments = appointments.filter(a => 
    new Date(a.datetime) >= new Date() && a.status !== 'cancelled'
  );
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent');

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-4">
            {company.logo_url && (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-12 w-12 object-contain rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">Customer Portal</p>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{profile.name}</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{profile.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Customer since {format(new Date(profile.created_at), 'MMM yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Calendar className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                    <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <DollarSign className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Invoices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {appointments.filter(a => a.status === 'completed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Gift className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{referrals.length}</p>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed views */}
          <Tabs defaultValue="appointments" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Appointments</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Quotes</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Your Appointments</CardTitle>
                  <CardDescription>View all your past and upcoming appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No appointments found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{apt.service_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.datetime), 'MMM d, yyyy h:mm a')}
                            </p>
                            {apt.customer_address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {apt.customer_address}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={apt.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Your Invoices</CardTitle>
                  <CardDescription>View and pay your invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No invoices found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">
                              Invoice {inv.invoice_number || inv.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created {format(new Date(inv.created_at), 'MMM d, yyyy')}
                            </p>
                            {inv.due_date && (
                              <p className="text-sm text-muted-foreground">
                                Due: {format(new Date(inv.due_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-lg font-bold">${inv.total.toFixed(2)}</p>
                            <StatusBadge status={inv.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quotes Tab */}
            <TabsContent value="quotes">
              <Card>
                <CardHeader>
                  <CardTitle>Your Quotes</CardTitle>
                  <CardDescription>View quotes and estimates</CardDescription>
                </CardHeader>
                <CardContent>
                  {quotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No quotes found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotes.map((quote) => (
                        <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">Quote #{quote.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Created {format(new Date(quote.created_at), 'MMM d, yyyy')}
                            </p>
                            {quote.valid_until && (
                              <p className="text-sm text-muted-foreground">
                                Valid until: {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-lg font-bold">${quote.total_amount.toFixed(2)}</p>
                            <StatusBadge status={quote.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                  <CardDescription>Track your referral rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No referrals yet</p>
                      <p className="text-sm mt-2">Refer friends and family to earn rewards!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {referrals.map((ref) => (
                        <div key={ref.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">Code: {ref.referral_code}</p>
                            {ref.referred_name && (
                              <p className="text-sm text-muted-foreground">
                                Referred: {ref.referred_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            {ref.reward_value && (
                              <p className="text-lg font-bold">
                                {ref.reward_type === 'discount' ? '$' : ''}{ref.reward_value}
                                {ref.reward_type === 'percent' ? '%' : ''}
                              </p>
                            )}
                            <StatusBadge status={ref.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <CustomerPreferencesTab 
                profile={profile} 
                token={token!}
              />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t mt-16 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
        </footer>
    </div>
  );
}
