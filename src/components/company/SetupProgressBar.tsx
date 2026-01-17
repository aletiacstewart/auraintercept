import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
}

export function SetupProgressBar() {
  const { companyId } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const checkSetupStatus = async () => {
      setLoading(true);
      try {
        // Fetch company data
        const { data: company } = await supabase
          .from('companies')
          .select('name, logo_url, contact_email, contact_phone, contact_address')
          .eq('id', companyId)
          .single();

        // Fetch services count
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch FAQs count
        const { count: faqsCount } = await supabase
          .from('faqs')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch employees count
        const { count: employeesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch business hours
        const { count: hoursCount } = await supabase
          .from('business_hours')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const setupSteps: SetupStep[] = [
          {
            id: 'branding',
            label: 'Logo',
            completed: !!company?.logo_url,
          },
          {
            id: 'contact',
            label: 'Contact Info',
            completed: !!(company?.contact_email || company?.contact_phone),
          },
          {
            id: 'services',
            label: 'Services',
            completed: (servicesCount || 0) > 0,
          },
          {
            id: 'hours',
            label: 'Business Hours',
            completed: (hoursCount || 0) > 0,
          },
          {
            id: 'team',
            label: 'Team Members',
            completed: (employeesCount || 0) > 0,
          },
          {
            id: 'faqs',
            label: 'FAQs',
            completed: (faqsCount || 0) > 0,
          },
        ];

        setSteps(setupSteps);
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSetupStatus();
  }, [companyId]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Setup Progress</h3>
          <p className="text-xs text-muted-foreground">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        <span className="text-lg font-bold text-primary">
          {Math.round(progressPercent)}%
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <div className="flex flex-wrap gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border',
              step.completed
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted/50 border-border text-muted-foreground'
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
