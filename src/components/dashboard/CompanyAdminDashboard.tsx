import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Bot, MessageSquare, Plus, Settings, Puzzle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export function CompanyAdminDashboard() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['company-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const [employees, appointments] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);

      return {
        employees: employees.count ?? 0,
        appointments: appointments.count ?? 0,
      };
    },
    enabled: !!companyId,
  });

  const isLoading = companyLoading || statsLoading;

  const quickActions = [
    { label: 'Add Employee', icon: Plus, href: '/dashboard/employees', color: 'bg-primary' },
    { label: 'Configure AI', icon: Bot, href: '/dashboard/agent', color: 'bg-secondary' },
    { label: 'Integrations', icon: Puzzle, href: '/dashboard/integrations', color: 'bg-accent' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings', color: 'bg-muted-foreground' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{company?.name}</h1>
              <p className="text-muted-foreground mt-1">
                Company Dashboard
              </p>
            </>
          )}
        </div>
        <div 
          className="w-16 h-16 rounded-xl border-2 overflow-hidden"
          style={{ borderColor: company?.primary_color || 'hsl(var(--primary))' }}
        >
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Company Logo" className="w-full h-full object-cover" />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
              style={{ 
                background: `linear-gradient(135deg, ${company?.primary_color || '#0EA5E9'}, ${company?.secondary_color || '#8B5CF6'})`,
                color: 'white'
              }}
            >
              {company?.name?.charAt(0) || 'C'}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.employees ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Team members</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
            <Calendar className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.appointments ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Agent</CardTitle>
            <Bot className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to assist</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
            <MessageSquare className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your AI agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                onClick={() => navigate(action.href)}
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Progress */}
      <Card className="border-border/50 border-dashed">
        <CardHeader>
          <CardTitle>Setup Your AI Agent</CardTitle>
          <CardDescription>Complete these steps to get your AI agent up and running</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-primary-foreground text-sm font-bold">✓</div>
              <div className="flex-1">
                <p className="font-medium">Create Account</p>
                <p className="text-sm text-muted-foreground">Company registered successfully</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center text-primary text-sm font-bold">2</div>
              <div className="flex-1">
                <p className="font-medium">Upload Branding</p>
                <p className="text-sm text-muted-foreground">Add your logo and brand colors</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/onboarding')}>
                Configure
              </Button>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center text-muted-foreground text-sm font-bold">3</div>
              <div className="flex-1">
                <p className="font-medium">Add Knowledge Base</p>
                <p className="text-sm text-muted-foreground">Train your AI with your business info</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/knowledge')}>
                Add Info
              </Button>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center text-muted-foreground text-sm font-bold">4</div>
              <div className="flex-1">
                <p className="font-medium">Connect Integrations</p>
                <p className="text-sm text-muted-foreground">Set up Twilio, ElevenLabs, and Stripe</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/integrations')}>
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
