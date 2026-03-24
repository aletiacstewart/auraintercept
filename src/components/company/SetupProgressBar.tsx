import { useEffect, useState, forwardRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, Building2, MessageSquare, FileText, Megaphone, BarChart3, Mic, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SETUP_PROGRESS_REFRESH_EVENT } from '@/hooks/useSetupProgress';
import { useSearchParams } from 'react-router-dom';

interface SetupStep {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
}

export const SetupProgressBar = forwardRef<HTMLDivElement, object>(function SetupProgressBar(_props, ref) {
  const { companyId } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, setSearchParams] = useSearchParams();

  // Listen for refresh events from settings components
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener(SETUP_PROGRESS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(SETUP_PROGRESS_REFRESH_EVENT, handleRefresh);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const checkSetupStatus = async () => {
      setLoading(true);
      try {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        const { count: reminderSettingsCount } = await supabase
          .from('reminder_settings')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: emailTemplatesCount } = await supabase
          .from('email_templates')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: smsTemplatesCount } = await supabase
          .from('sms_templates')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const { count: campaignsCount } = await supabase
          .from('marketing_campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        const consolidated: SetupStep[] = [
          {
            id: 'company',
            label: 'Company',
            icon: Building2,
            // Branding OR contact info OR app URL
            completed: !!(company?.logo_url || company?.primary_color || company?.contact_email || company?.contact_phone || company?.public_app_url),
          },
          {
            id: 'communications',
            label: 'Communications',
            icon: MessageSquare,
            // Default prefs exist + reminders configured + missed call action set
            completed: !!(
              company?.default_email_enabled !== undefined &&
              ((reminderSettingsCount || 0) > 0 || company?.callback_delay_seconds) &&
              company?.missed_call_action
            ),
          },
          {
            id: 'templates',
            label: 'Templates',
            icon: FileText,
            // At least one email or SMS template
            completed: (emailTemplatesCount || 0) > 0 || (smsTemplatesCount || 0) > 0,
          },
          {
            id: 'campaigns-reviews',
            label: 'Campaigns & Reviews',
            icon: Megaphone,
            // Campaign created OR review setting configured OR customer prefs set
            completed: !!(
              (campaignsCount || 0) > 0 ||
              company?.review_request_enabled ||
              company?.review_google_url ||
              company?.customer_prefs_enabled === true ||
              company?.customer_prefs_enabled === false
            ),
          },
          {
            id: 'reports-alerts',
            label: 'Reports & Alerts',
            icon: BarChart3,
            // Any digest OR any alert enabled
            completed: !!(
              company?.weekly_digest_enabled ||
              company?.monthly_digest_enabled ||
              company?.quarterly_digest_enabled ||
              company?.cost_alert_enabled ||
              company?.bounce_alert_enabled ||
              company?.unsubscribe_alert_enabled
            ),
          },
          {
            id: 'voice',
            label: 'Ask Aura',
            icon: Mic,
            completed: !!company?.ai_voice_greeting,
          },
          {
            id: 'system',
            label: 'System',
            icon: HardDrive,
            completed: (company?.service_categories?.length || 0) > 0,
          },
        ];

        setSteps(consolidated);
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSetupStatus();
  }, [companyId, refreshKey]);

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
    <div ref={ref} className="guide-card rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Setup Progress</h3>
          <p className="text-xs text-card-foreground/70">
            {completedCount} of {steps.length} sections completed
          </p>
        </div>
        <span className="text-lg font-bold text-secondary">
          {Math.round(progressPercent)}%
        </span>
      </div>

      <Progress value={progressPercent} className="h-2 bg-primary/40 [&>div]:bg-secondary" />

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => setSearchParams({ tab: step.id })}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-all hover:scale-105 cursor-pointer',
                step.completed
                  ? 'bg-secondary/15 border-secondary/40 text-secondary'
                  : 'bg-transparent border-card-foreground/30 text-card-foreground/60 hover:border-primary/50 hover:text-card-foreground'
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
