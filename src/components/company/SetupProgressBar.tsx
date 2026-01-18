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

interface SetupProgressBarProps {
  isPlatformAdmin?: boolean;
}

export function SetupProgressBar({ isPlatformAdmin = false }: SetupProgressBarProps) {
  const { companyId } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const checkSetupStatus = async () => {
      setLoading(true);
      try {
        // Fetch company data with all relevant fields
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        // Fetch reminder settings count
        const { count: reminderSettingsCount } = await supabase
          .from('reminder_settings')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch customer profiles count (for customer prefs)
        const { count: customersCount } = await supabase
          .from('customer_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch email templates count
        const { count: emailTemplatesCount } = await supabase
          .from('email_templates')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch SMS templates count  
        const { count: smsTemplatesCount } = await supabase
          .from('sms_templates')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch warranty policies count
        const { count: warrantyPoliciesCount } = await supabase
          .from('warranty_policies')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        // Fetch marketing campaigns count
        const { count: campaignsCount } = await supabase
          .from('marketing_campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const baseSteps: SetupStep[] = [
          {
            id: 'branding',
            label: 'Branding',
            completed: !!(company?.logo_url || company?.primary_color),
          },
          {
            id: 'contact',
            label: 'Contact Info',
            completed: !!(company?.contact_email || company?.contact_phone || company?.contact_address),
          },
          {
            id: 'app-url',
            label: 'App URL',
            completed: !!company?.public_app_url,
          },
          {
            id: 'reminders',
            label: 'Reminders',
            completed: (reminderSettingsCount || 0) > 0 || !!(company?.callback_delay_seconds),
          },
          {
            id: 'missed-calls',
            label: 'Missed Calls',
            completed: !!company?.missed_call_action,
          },
          {
            id: 'default-prefs',
            label: 'Default Prefs',
            completed: company?.default_email_enabled !== null || company?.default_sms_enabled !== null,
          },
          {
            id: 'reports',
            label: 'Reports',
            completed: !!(company?.weekly_digest_enabled || company?.monthly_digest_enabled || company?.quarterly_digest_enabled),
          },
          {
            id: 'alerts',
            label: 'Alerts',
            completed: !!(company?.cost_alert_enabled || company?.bounce_alert_enabled || company?.unsubscribe_alert_enabled),
          },
          {
            id: 'customer-prefs',
            label: 'Customer Prefs',
            completed: (customersCount || 0) > 0,
          },
          {
            id: 'emails',
            label: 'Email Templates',
            completed: (emailTemplatesCount || 0) > 0,
          },
          {
            id: 'sms',
            label: 'SMS Templates',
            completed: (smsTemplatesCount || 0) > 0,
          },
          {
            id: 'reviews',
            label: 'Reviews',
            completed: !!(company?.review_request_enabled || company?.review_google_url),
          },
        ];

        // Add platform admin only steps
        const adminSteps: SetupStep[] = isPlatformAdmin ? [
          {
            id: 'warranties',
            label: 'Warranties',
            completed: (warrantyPoliciesCount || 0) > 0,
          },
          {
            id: 'campaigns',
            label: 'Campaigns',
            completed: (campaignsCount || 0) > 0,
          },
        ] : [];

        setSteps([...baseSteps, ...adminSteps]);
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSetupStatus();
  }, [companyId, isPlatformAdmin]);

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
    <div className="guide-card rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Setup Progress</h3>
          <p className="text-xs text-card-foreground/70">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        <span className="text-lg font-bold text-secondary">
          {Math.round(progressPercent)}%
        </span>
      </div>

      <Progress value={progressPercent} className="h-2 bg-primary/40 [&>div]:bg-secondary" />

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors',
              step.completed
                ? 'bg-secondary/15 border-secondary/40 text-secondary'
                : 'bg-transparent border-card-foreground/30 text-card-foreground/60'
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
