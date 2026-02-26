import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Circle, 
  Upload, 
  Palette, 
  BookOpen, 
  Phone, 
  Mic, 
  CreditCard,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  checkComplete: (data: OnboardingData) => boolean;
  priority: 'required' | 'recommended' | 'optional';
}

interface OnboardingData {
  company: {
    logo_url: string | null;
    primary_color: string | null;
  } | null;
  integrations: {
    has_signalwire: boolean | null;
    has_elevenlabs: boolean | null;
    signalwire_phone_number: string | null;
  } | null;
  servicesCount: number;
  faqsCount: number;
  businessHoursCount: number;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'branding',
    title: 'Upload Branding',
    description: 'Add your logo and customize brand colors',
    icon: Palette,
    href: '/dashboard/quick-setup',
    checkComplete: (data) => !!(data.company?.logo_url || data.company?.primary_color),
    priority: 'recommended',
  },
  {
    id: 'services',
    title: 'Add Services',
    description: 'Define the services your business offers',
    icon: BookOpen,
    href: '/dashboard/knowledge',
    checkComplete: (data) => data.servicesCount > 0,
    priority: 'required',
  },
  {
    id: 'business-hours',
    title: 'Set Business Hours',
    description: 'Configure your operating hours for scheduling',
    icon: Clock,
    href: '/dashboard/knowledge',
    checkComplete: (data) => data.businessHoursCount > 0,
    priority: 'required',
  },
  {
    id: 'faqs',
    title: 'Add FAQs',
    description: 'Help your AI answer common questions',
    icon: BookOpen,
    href: '/dashboard/knowledge',
    checkComplete: (data) => data.faqsCount > 0,
    priority: 'recommended',
  },
  {
    id: 'inventory',
    title: 'Set Up Inventory',
    description: 'Track parts and supplies for jobs',
    icon: Upload,
    href: '/dashboard/inventory',
    checkComplete: (data) => (data as any).inventoryCount > 0,
    priority: 'optional',
  },
  {
    id: 'ai-agents',
    title: 'Enable AI Agents',
    description: 'Activate intelligent agents for customer support',
    icon: Sparkles,
    href: '/dashboard/ai-agents',
    checkComplete: (data) => (data as any).aiAgentsEnabled > 0,
    priority: 'recommended',
  },
  {
    id: 'signalwire',
    title: 'Connect SignalWire',
    description: 'Enable voice calls and SMS for your AI agent',
    icon: Phone,
    href: '/dashboard/3rd-party-overview',
    checkComplete: (data) => !!(data.integrations?.has_signalwire),
    priority: 'required',
  },
  {
    id: 'elevenlabs',
    title: 'Connect ElevenLabs',
    description: 'Add natural AI voice synthesis to calls',
    icon: Mic,
    href: '/dashboard/3rd-party-overview',
    checkComplete: (data) => !!data.integrations?.has_elevenlabs,
    priority: 'required',
  },
  {
    id: 'payment',
    title: 'Set Up Payments',
    description: 'Configure Stripe for invoices and quotes',
    icon: CreditCard,
    href: '/dashboard/3rd-party-overview',
    checkComplete: () => false, // Manual check - no stripe column yet
    priority: 'optional',
  },
];

export function OnboardingChecklist() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ['onboarding-progress', companyId],
    queryFn: async (): Promise<OnboardingData & { inventoryCount: number; aiAgentsEnabled: number }> => {
      if (!companyId) {
        return {
          company: null,
          integrations: null,
          servicesCount: 0,
          faqsCount: 0,
          businessHoursCount: 0,
          inventoryCount: 0,
          aiAgentsEnabled: 0,
        };
      }

      const [companyRes, integrationsRes, servicesRes, faqsRes, hoursRes, inventoryRes, aiAgentsRes] = await Promise.all([
        supabase.from('companies').select('logo_url, primary_color').eq('id', companyId).single(),
        supabase.from('tenant_integrations_safe').select('has_signalwire, has_elevenlabs, signalwire_phone_number').eq('company_id', companyId).maybeSingle(),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
        supabase.from('faqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
        supabase.from('business_hours').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_closed', false),
        supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
        supabase.from('ai_agent_configs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_enabled', true),
      ]);

      return {
        company: companyRes.data,
        integrations: integrationsRes.data,
        servicesCount: servicesRes.count ?? 0,
        faqsCount: faqsRes.count ?? 0,
        businessHoursCount: hoursRes.count ?? 0,
        inventoryCount: inventoryRes.count ?? 0,
        aiAgentsEnabled: aiAgentsRes.count ?? 0,
      };
    },
    enabled: !!companyId,
  });

  const completedItems = CHECKLIST_ITEMS.filter(item => 
    onboardingData && item.checkComplete(onboardingData)
  );
  
  const progress = onboardingData 
    ? Math.round((completedItems.length / CHECKLIST_ITEMS.length) * 100)
    : 0;

  const requiredRemaining = CHECKLIST_ITEMS.filter(
    item => item.priority === 'required' && onboardingData && !item.checkComplete(onboardingData)
  ).length;

  const isComplete = progress === 100;

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-700 dark:text-green-400">Setup Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Your AI agent is fully configured and ready to assist customers
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard/agent')}>
              Test AI Agent
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Setup Your AI Agent
              {requiredRemaining > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {requiredRemaining} required
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Complete these steps to get your AI agent up and running
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{progress}%</div>
            <div className="text-xs text-muted-foreground">complete</div>
          </div>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isItemComplete = onboardingData && item.checkComplete(onboardingData);
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-muted/50',
                isItemComplete ? 'bg-green-500/5' : 'bg-muted/30'
              )}
              onClick={() => !isItemComplete && navigate(item.href)}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  isItemComplete
                    ? 'bg-green-500 text-white'
                    : item.priority === 'required'
                    ? 'border-2 border-primary text-primary'
                    : 'border-2 border-muted-foreground/50 text-muted-foreground'
                )}
              >
                {isItemComplete ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', isItemComplete && 'text-foreground/50 line-through')}>
                    {item.title}
                  </p>
                  {item.priority === 'required' && !isItemComplete && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              {!isItemComplete && (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
