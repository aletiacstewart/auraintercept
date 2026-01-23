import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, Settings, Bot, BookOpen, LayoutDashboard, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SETUP_PROGRESS_REFRESH_EVENT } from '@/hooks/useSetupProgress';

interface SectionProgress {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  progress: number;
}

export function DashboardSetupNav() {
  const { companyId } = useAuth();
  const location = useLocation();
  const [sections, setSections] = useState<SectionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener(SETUP_PROGRESS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(SETUP_PROGRESS_REFRESH_EVENT, handleRefresh);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const checkSectionProgress = async () => {
      setLoading(true);
      try {
        // Fetch all necessary data in parallel
        const [
          companyRes,
          reminderSettingsRes,
          emailTemplatesRes,
          smsTemplatesRes,
          warrantyPoliciesRes,
          campaignsRes,
          servicesRes,
          faqsRes,
          documentsRes,
          businessHoursRes,
          agentConfigsRes,
          smartWebsiteRes,
          crmConnectionsRes,
          googleCalendarConnectionsRes,
        ] = await Promise.all([
          supabase.from('companies').select('*').eq('id', companyId).single(),
          supabase.from('reminder_settings').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('email_templates').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('sms_templates').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('warranty_policies').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('services').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('faqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('knowledge_documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('business_hours').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('ai_agent_configs').select('id, is_enabled', { count: 'exact' }).eq('company_id', companyId),
          supabase.from('smart_websites').select('*').eq('company_id', companyId).maybeSingle(),
          supabase.from('crm_connections').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('google_calendar_connections').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        ]);

        const company = companyRes.data;

        // Quick Setup progress calculation (14 steps)
        const quickSetupSteps = [
          !!(company?.logo_url || company?.primary_color), // Branding
          !!(company?.contact_email || company?.contact_phone || company?.contact_address), // Contact Info
          !!company?.public_app_url, // App URL
          (reminderSettingsRes.count || 0) > 0 || !!company?.callback_delay_seconds, // Reminders
          !!company?.missed_call_action, // Missed Calls
          // Default prefs are always set (NOT NULL with defaults), so mark as complete if company exists
          company?.default_email_enabled !== undefined, // Default Prefs
          !!(company?.weekly_digest_enabled || company?.monthly_digest_enabled || company?.quarterly_digest_enabled), // Reports
          !!(company?.cost_alert_enabled || company?.bounce_alert_enabled || company?.unsubscribe_alert_enabled), // Alerts
          company?.customer_prefs_enabled === true || company?.customer_prefs_enabled === false, // Customer Prefs
          (emailTemplatesRes.count || 0) > 0, // Email Templates
          (smsTemplatesRes.count || 0) > 0, // SMS Templates
          !!(company?.review_request_enabled || company?.review_google_url), // Reviews
          (warrantyPoliciesRes.count || 0) > 0, // Warranties
          (campaignsRes.count || 0) > 0, // Campaigns
        ];
        const quickSetupProgress = (quickSetupSteps.filter(Boolean).length / quickSetupSteps.length) * 100;

        // AI Agents Hub progress (check enabled agents)
        const enabledAgents = (agentConfigsRes.data || []).filter(a => a.is_enabled).length;
        const totalAgentTypes = 6; // Approximate number of main agent types
        const aiAgentsProgress = Math.min((enabledAgents / totalAgentTypes) * 100, 100);

        // Knowledge Base progress (services, FAQs, documents, business hours)
        const knowledgeSteps = [
          (servicesRes.count || 0) > 0, // Services
          (faqsRes.count || 0) > 0, // FAQs
          (documentsRes.count || 0) > 0, // Documents
          (businessHoursRes.count || 0) > 0, // Business Hours
        ];
        const knowledgeProgress = (knowledgeSteps.filter(Boolean).length / knowledgeSteps.length) * 100;

        // 3rd Party Overview progress (connections)
        const overviewSteps = [
          (crmConnectionsRes.count || 0) > 0, // CRM connected
          (googleCalendarConnectionsRes.count || 0) > 0, // Calendar connected
        ];
        const overviewProgress = (overviewSteps.filter(Boolean).length / overviewSteps.length) * 100;

        // Smart Website progress
        const smartWebsite = smartWebsiteRes.data;
        const smartWebsiteSteps = [
          !!smartWebsite, // Website created
          !!smartWebsite?.hero_headline, // Hero configured
          !!smartWebsite?.show_services, // Services section enabled
          !!smartWebsite?.show_hours, // Hours section enabled
          !!smartWebsite?.is_published, // Published
        ];
        const smartWebsiteProgress = smartWebsite
          ? (smartWebsiteSteps.filter(Boolean).length / smartWebsiteSteps.length) * 100 
          : 0;

        const sectionData: SectionProgress[] = [
          {
            id: 'quick-setup',
            label: 'Quick Setup',
            href: '/dashboard/quick-setup',
            icon: Settings,
            completed: quickSetupProgress >= 100,
            progress: quickSetupProgress,
          },
          {
            id: 'ai-agents',
            label: 'AI Agents Hub',
            href: '/dashboard/ai-agents',
            icon: Bot,
            completed: aiAgentsProgress >= 100,
            progress: aiAgentsProgress,
          },
          {
            id: 'knowledge-base',
            label: 'Knowledge Base',
            href: '/dashboard/knowledge',
            icon: BookOpen,
            completed: knowledgeProgress >= 100,
            progress: knowledgeProgress,
          },
          {
            id: 'overview',
            label: '3rd Party Overview',
            href: '/dashboard/3rd-party-overview',
            icon: LayoutDashboard,
            completed: overviewProgress >= 100,
            progress: overviewProgress,
          },
          {
            id: 'smart-website',
            label: 'Aura Web Presence',
            href: '/dashboard/smart-website',
            icon: Globe,
            completed: smartWebsiteProgress >= 100,
            progress: smartWebsiteProgress,
          },
        ];

        setSections(sectionData);
      } catch (error) {
        console.error('Error checking section progress:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSectionProgress();
  }, [companyId, refreshKey]);

  const completedCount = sections.filter(s => s.completed).length;
  const overallProgress = sections.length > 0 
    ? sections.reduce((sum, s) => sum + s.progress, 0) / sections.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="guide-card rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Overall Setup Progress</h3>
            <p className="text-xs text-card-foreground/70">
              {completedCount} of {sections.length} sections completed
            </p>
          </div>
          <span className="text-lg font-bold text-secondary">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <Progress value={overallProgress} className="h-2 bg-primary/40 [&>div]:bg-secondary" />
      </div>

      {/* Section Navigation */}
      <div className="inline-flex flex-wrap p-2 bg-muted/30 rounded-2xl border border-border gap-1">
        {sections.map((section) => {
          const isActive = location.pathname === section.href || 
            (section.href !== '/dashboard' && location.pathname.startsWith(section.href));
          const Icon = section.icon;
          
          return (
            <Link
              key={section.id}
              to={section.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-sm font-medium',
                isActive
                  ? 'bg-secondary/20 border-secondary text-secondary'
                  : section.completed
                    ? 'bg-secondary/10 border-secondary/40 text-secondary hover:bg-secondary/20'
                    : 'bg-card/50 border-border/50 text-card-foreground/80 hover:bg-card hover:border-border'
              )}
            >
              {section.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span>{section.label}</span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                section.completed 
                  ? 'bg-secondary/20 text-secondary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {Math.round(section.progress)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
