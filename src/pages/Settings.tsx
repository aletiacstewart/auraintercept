import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BrandingSettings } from '@/components/company/BrandingSettings';
import { ReminderSettings } from '@/components/company/ReminderSettings';
import { CustomerPreferencesManager } from '@/components/company/CustomerPreferencesManager';
import { DefaultPreferencesSettings } from '@/components/company/DefaultPreferencesSettings';
import { AlertsSettings } from '@/components/company/AlertsSettings';
import { ReportsDashboard } from '@/components/company/ReportsDashboard';
import { EmailTemplatesEditor } from '@/components/settings/EmailTemplatesEditor';
import { SmsTemplatesEditor } from '@/components/settings/SmsTemplatesEditor';
import { ReviewRequestSettings } from '@/components/company/ReviewRequestSettings';
import { ProfileSettings } from '@/components/employee/ProfileSettings';
import { CampaignSettings } from '@/components/settings/CampaignSettings';
import { MissedCallSettings } from '@/components/company/MissedCallSettings';
import { PublicAppUrlSettings } from '@/components/company/PublicAppUrlSettings';
import { ContactInfoSettings } from '@/components/company/ContactInfoSettings';
import { SetupProgressBar } from '@/components/company/SetupProgressBar';
import { VoiceOnboardingSettings } from '@/components/settings/VoiceOnboardingSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Mic, HardDrive, ArrowRight, Building2, MessageSquare, FileText, Megaphone, BarChart3 } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

const VALID_TABS = [
  'company', 'communications', 'templates', 'campaigns-reviews', 'reports-alerts', 'voice', 'system'
];

export default function Settings() {
  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  // Remap legacy tab names to new consolidated tabs
  const LEGACY_MAP: Record<string, string> = {
    branding: 'company', contact: 'company', 'app-url': 'company',
    reminders: 'communications', 'missed-calls': 'communications', 'default-prefs': 'communications',
    emails: 'templates', sms: 'templates',
    campaigns: 'campaigns-reviews', reviews: 'campaigns-reviews', 'customer-prefs': 'campaigns-reviews',
    reports: 'reports-alerts', alerts: 'reports-alerts',
    voice: 'voice', system: 'system',
  };
  const resolvedTab = tabParam
    ? (VALID_TABS.includes(tabParam) ? tabParam : (LEGACY_MAP[tabParam] || 'company'))
    : 'company';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout>
      {userRole === 'company_admin' || userRole === 'platform_admin' ? (
        <PageContainer>
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              icon={SettingsIcon}
              title="Settings"
              description="Configure your business, communications, and AI knowledge — all in one place"
              featureColor="config"
              showAuraBar
            />

            <SetupProgressBar />

            <Tabs value={resolvedTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="company" className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="communications" className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Communications
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="campaigns-reviews" className="flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  Campaigns & Reviews
                </TabsTrigger>
                <TabsTrigger value="reports-alerts" className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Reports & Alerts
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  Ask Aura
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  System
                </TabsTrigger>
                <Link
                  to="/dashboard/3rd-party-overview"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 ml-2 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-all hover:scale-105"
                >
                  Next: 3rd Party Setup
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/dashboard/knowledge"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 ml-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-105"
                >
                  Knowledge Base Setup
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </TabsList>

              {/* ── Company: Branding + Contact Info + App URL ── */}
              <TabsContent value="company" className="space-y-8 mt-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Branding</h2>
                  <p className="text-sm text-muted-foreground mb-4">Logo, colors, and chat widget appearance</p>
                  <BrandingSettings />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Contact Info</h2>
                  <p className="text-sm text-muted-foreground mb-4">Your business contact details shown to customers</p>
                  <ContactInfoSettings />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Public App URL</h2>
                  <p className="text-sm text-muted-foreground mb-4">The URL your customers use to access their portal</p>
                  <PublicAppUrlSettings />
                </div>
              </TabsContent>

              {/* ── Communications: Default Prefs + Reminders + Missed Calls ── */}
              <TabsContent value="communications" className="space-y-8 mt-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Default Communication Preferences</h2>
                  <p className="text-sm text-muted-foreground mb-4">Set which channels are on by default for all customers</p>
                  <DefaultPreferencesSettings />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Reminders</h2>
                  <p className="text-sm text-muted-foreground mb-4">Configure appointment reminder timing and messages</p>
                  <ReminderSettings />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Missed Calls</h2>
                  <p className="text-sm text-muted-foreground mb-4">What happens when an incoming call is not answered</p>
                  <MissedCallSettings />
                </div>
              </TabsContent>

              {/* ── Templates: Email + SMS ── */}
              <TabsContent value="templates" className="space-y-8 mt-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Email Templates</h2>
                  <p className="text-sm text-muted-foreground mb-4">Customize automated email messages sent to customers</p>
                  <EmailTemplatesEditor />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">SMS Templates</h2>
                  <p className="text-sm text-muted-foreground mb-4">Customize automated SMS messages sent to customers</p>
                  <SmsTemplatesEditor />
                </div>
              </TabsContent>

              {/* ── Campaigns & Reviews ── */}
              <TabsContent value="campaigns-reviews" className="space-y-8 mt-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Campaign Settings</h2>
                  <p className="text-sm text-muted-foreground mb-4">Configure marketing campaign defaults and templates</p>
                  <CampaignSettings />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Review Requests</h2>
                  <p className="text-sm text-muted-foreground mb-4">Automate review requests after service completion</p>
                  <ReviewRequestSettings />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Customer Preferences</h2>
                  <p className="text-sm text-muted-foreground mb-4">Allow customers to manage their own communication preferences</p>
                  <CustomerPreferencesManager />
                </div>
              </TabsContent>

              {/* ── Reports & Alerts ── */}
              <TabsContent value="reports-alerts" className="space-y-8 mt-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Reports & Digests</h2>
                  <p className="text-sm text-muted-foreground mb-4">Schedule automated performance reports to your inbox</p>
                  <ReportsDashboard />
                </div>
                <Separator />
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Alert Thresholds</h2>
                  <p className="text-sm text-muted-foreground mb-4">Get notified when key metrics cross set thresholds</p>
                  <AlertsSettings />
                </div>
              </TabsContent>

              {/* ── Ask Aura (Voice/AI) ── */}
              <TabsContent value="voice" className="mt-6">
                <VoiceOnboardingSettings />
              </TabsContent>

              {/* ── System ── */}
              <TabsContent value="system" className="mt-6">
                <SystemSettings />
              </TabsContent>
            </Tabs>
          </div>
        </PageContainer>
      ) : (
        <PageContainer>
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              icon={SettingsIcon}
              title="Quick Setup"
              description="Manage your account settings"
              showAuraBar
            />
            <ProfileSettings />
          </div>
        </PageContainer>
      )}
    </DashboardLayout>
  );
}
