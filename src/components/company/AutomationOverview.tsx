import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  FileText, 
  TrendingUp, 
  Bell, 
  Phone, 
  MessageSquare, 
  Star, 
  Users, 
  AlertTriangle, 
  Mail, 
  DollarSign,
  PhoneMissed,
  Activity,
  CheckCircle2,
  XCircle,
  Settings2,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AutomationStatus {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: string;
  configPath?: string;
  details?: string;
}

export function AutomationOverview() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['company-automations', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select(`
          weekly_digest_enabled, monthly_digest_enabled, quarterly_digest_enabled,
          review_request_enabled, review_request_delay_hours,
          missed_call_action,
          unsubscribe_alert_enabled, unsubscribe_alert_threshold,
          sms_optout_alert_enabled, sms_optout_alert_threshold,
          bounce_alert_enabled, bounce_alert_threshold,
          cost_alert_enabled, cost_alert_threshold
        `)
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  const { data: reminderData, isLoading: reminderLoading } = useQuery({
    queryKey: ['reminder-automations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('id, hours_before, is_enabled, call_enabled')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId
  });

  const { data: leadFollowUpData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead-followup-automations', companyId],
    queryFn: async () => {
      if (!companyId) return { pending: 0, total: 0 };
      const { data, error, count } = await supabase
        .from('lead_follow_ups')
        .select('id, status', { count: 'exact' })
        .eq('company_id', companyId);
      if (error) throw error;
      const pending = data?.filter(d => d.status === 'pending').length || 0;
      return { pending, total: count || 0 };
    },
    enabled: !!companyId
  });

  const isLoading = companyLoading || reminderLoading || leadLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  // Build automation statuses
  const enabledSmsReminders = reminderData?.filter(r => r.is_enabled).length || 0;
  const enabledVoiceReminders = reminderData?.filter(r => r.call_enabled).length || 0;
  const totalReminders = reminderData?.length || 0;

  const digestsEnabled = [
    companyData?.weekly_digest_enabled,
    companyData?.monthly_digest_enabled,
    companyData?.quarterly_digest_enabled
  ].filter(Boolean).length;

  const alertsEnabled = [
    companyData?.unsubscribe_alert_enabled,
    companyData?.sms_optout_alert_enabled,
    companyData?.bounce_alert_enabled,
    companyData?.cost_alert_enabled
  ].filter(Boolean).length;

  const automationCategories = [
    {
      title: 'Performance Digests',
      description: 'Automated email reports on business performance',
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      items: [
        {
          name: 'Weekly Report',
          enabled: companyData?.weekly_digest_enabled || false,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          name: 'Monthly Report',
          enabled: companyData?.monthly_digest_enabled || false,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: 'Quarterly Report',
          enabled: companyData?.quarterly_digest_enabled || false,
          icon: <TrendingUp className="h-4 w-4" />,
        },
      ],
      configTab: 'reports',
      summary: `${digestsEnabled}/3 Active`,
    },
    {
      title: 'Appointment Reminders',
      description: 'Automated SMS and voice call reminders',
      icon: <Bell className="h-5 w-5 text-blue-500" />,
      items: [
        {
          name: 'SMS Reminders',
          enabled: enabledSmsReminders > 0,
          icon: <MessageSquare className="h-4 w-4" />,
          detail: enabledSmsReminders > 0 ? `${enabledSmsReminders} active` : 'None',
        },
        {
          name: 'Voice Reminders',
          enabled: enabledVoiceReminders > 0,
          icon: <Phone className="h-4 w-4" />,
          detail: enabledVoiceReminders > 0 ? `${enabledVoiceReminders} active` : 'None',
        },
      ],
      configTab: 'reminders',
      summary: totalReminders > 0 ? `${enabledSmsReminders + enabledVoiceReminders} Active` : 'Not Configured',
    },
    {
      title: 'Customer Engagement',
      description: 'Review requests and lead follow-ups',
      icon: <Star className="h-5 w-5 text-amber-500" />,
      items: [
        {
          name: 'Review Requests',
          enabled: companyData?.review_request_enabled || false,
          icon: <Star className="h-4 w-4" />,
          detail: companyData?.review_request_enabled 
            ? `${companyData.review_request_delay_hours || 24}h delay` 
            : 'Disabled',
        },
        {
          name: 'Lead Follow-ups',
          enabled: (leadFollowUpData?.pending || 0) > 0,
          icon: <Users className="h-4 w-4" />,
          detail: `${leadFollowUpData?.pending || 0} pending`,
        },
      ],
      configTab: 'reviews',
      summary: companyData?.review_request_enabled ? 'Active' : 'Disabled',
    },
    {
      title: 'System Alerts',
      description: 'Threshold-based email and SMS notifications',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      items: [
        {
          name: 'Email Unsubscribe',
          enabled: companyData?.unsubscribe_alert_enabled || false,
          icon: <Mail className="h-4 w-4" />,
          detail: companyData?.unsubscribe_alert_enabled 
            ? `>${companyData.unsubscribe_alert_threshold || 10}/24h` 
            : 'Disabled',
        },
        {
          name: 'SMS Opt-Out',
          enabled: companyData?.sms_optout_alert_enabled || false,
          icon: <MessageSquare className="h-4 w-4" />,
          detail: companyData?.sms_optout_alert_enabled 
            ? `>${companyData.sms_optout_alert_threshold || 10}/24h` 
            : 'Disabled',
        },
        {
          name: 'Email Deliverability',
          enabled: companyData?.bounce_alert_enabled || false,
          icon: <AlertTriangle className="h-4 w-4" />,
          detail: companyData?.bounce_alert_enabled 
            ? `>${companyData.bounce_alert_threshold || 10}/24h` 
            : 'Disabled',
        },
        {
          name: 'Cost Variance',
          enabled: companyData?.cost_alert_enabled || false,
          icon: <DollarSign className="h-4 w-4" />,
          detail: companyData?.cost_alert_enabled 
            ? `>${companyData.cost_alert_threshold || 20}%` 
            : 'Disabled',
        },
      ],
      configTab: 'alerts',
      summary: `${alertsEnabled}/4 Active`,
    },
    {
      title: 'Missed Call Handling',
      description: 'Automated response to missed calls',
      icon: <PhoneMissed className="h-5 w-5 text-red-500" />,
      items: [
        {
          name: 'Auto SMS Response',
          enabled: companyData?.missed_call_action === 'sms' || companyData?.missed_call_action === 'both',
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          name: 'Callback Scheduling',
          enabled: companyData?.missed_call_action === 'callback' || companyData?.missed_call_action === 'both',
          icon: <Phone className="h-4 w-4" />,
        },
      ],
      configTab: 'missed-calls',
      summary: companyData?.missed_call_action && companyData.missed_call_action !== 'none' 
        ? 'Active' 
        : 'Disabled',
    },
  ];

  const totalActive = automationCategories.reduce((acc, cat) => {
    return acc + cat.items.filter(item => item.enabled).length;
  }, 0);

  const totalAutomations = automationCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  const handleConfigureClick = (tabValue: string) => {
    // Navigate to the Settings page with the appropriate tab
    navigate(`/dashboard/quick-setup?tab=${tabValue}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{totalActive}</p>
                <p className="text-xs text-muted-foreground">Active Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{enabledSmsReminders + enabledVoiceReminders}</p>
                <p className="text-xs text-muted-foreground">Reminder Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{digestsEnabled}</p>
                <p className="text-xs text-muted-foreground">Digest Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{alertsEnabled}</p>
                <p className="text-xs text-muted-foreground">System Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automationCategories.map((category) => (
          <Card key={category.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <CardTitle className="text-base">{category.title}</CardTitle>
                </div>
                <Badge 
                  variant={category.items.some(i => i.enabled) ? 'default' : 'secondary'}
                  className={category.items.some(i => i.enabled) 
                    ? 'bg-green-500/20 text-green-700 border-green-500/30' 
                    : ''
                  }
                >
                  {category.summary}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {category.items.map((item) => (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className={item.enabled ? 'text-foreground' : 'text-muted-foreground'}>
                      {item.icon}
                    </span>
                    <span className={`text-sm ${item.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {'detail' in item && item.detail && (
                      <span className="text-xs text-muted-foreground">{item.detail}</span>
                    )}
                    {item.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => handleConfigureClick(category.configTab)}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Configure
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
