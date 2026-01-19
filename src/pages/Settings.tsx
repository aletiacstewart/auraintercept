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
import { WarrantySettings } from '@/components/settings/WarrantySettings';
import { CampaignSettings } from '@/components/settings/CampaignSettings';
import { MissedCallSettings } from '@/components/company/MissedCallSettings';
import { PublicAppUrlSettings } from '@/components/company/PublicAppUrlSettings';
import { ContactInfoSettings } from '@/components/company/ContactInfoSettings';
import { SetupProgressBar } from '@/components/company/SetupProgressBar';
import { VoiceOnboardingSettings } from '@/components/settings/VoiceOnboardingSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Settings as SettingsIcon, Mic } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const VALID_TABS = [
  'branding', 'contact', 'app-url', 'reminders', 'missed-calls', 
  'default-prefs', 'reports', 'alerts', 'customer-prefs', 
  'emails', 'sms', 'reviews', 'warranties', 'campaigns', 'voice'
];

export default function Settings() {
  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'branding';

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
            title="Quick Setup"
            description="Configure your company settings and preferences"
            featureColor="config"
            showAuraBar
          />
          
          <SetupProgressBar />
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="inline-flex flex-wrap h-auto p-1.5 bg-muted/30 rounded-full border border-border/50 gap-1">
              <TabsTrigger value="branding" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 data-[state=active]:text-primary transition-all">Branding</TabsTrigger>
              <TabsTrigger value="contact" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Contact Info</TabsTrigger>
              <TabsTrigger value="app-url" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">App URL</TabsTrigger>
              <TabsTrigger value="reminders" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Reminders</TabsTrigger>
              <TabsTrigger value="missed-calls" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Missed Calls</TabsTrigger>
              <TabsTrigger value="default-prefs" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Default Prefs</TabsTrigger>
              <TabsTrigger value="reports" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Reports</TabsTrigger>
              <TabsTrigger value="alerts" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Alerts</TabsTrigger>
              <TabsTrigger value="customer-prefs" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Customer Prefs</TabsTrigger>
              <TabsTrigger value="emails" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Email Templates</TabsTrigger>
              <TabsTrigger value="sms" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">SMS Templates</TabsTrigger>
              <TabsTrigger value="reviews" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Reviews</TabsTrigger>
              <TabsTrigger value="warranties" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Warranties</TabsTrigger>
              <TabsTrigger value="campaigns" className="px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">Campaigns</TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1.5 px-4 py-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all">
                <Mic className="w-3.5 h-3.5" />
                Aura Voice
              </TabsTrigger>
            </TabsList>
            <TabsContent value="branding">
              <BrandingSettings />
            </TabsContent>
            <TabsContent value="contact">
              <ContactInfoSettings />
            </TabsContent>
            <TabsContent value="app-url">
              <PublicAppUrlSettings />
            </TabsContent>
            <TabsContent value="reminders">
              <ReminderSettings />
            </TabsContent>
            <TabsContent value="missed-calls">
              <MissedCallSettings />
            </TabsContent>
            <TabsContent value="default-prefs">
              <DefaultPreferencesSettings />
            </TabsContent>
            <TabsContent value="reports">
              <ReportsDashboard />
            </TabsContent>
            <TabsContent value="alerts">
              <AlertsSettings />
            </TabsContent>
            <TabsContent value="customer-prefs">
              <CustomerPreferencesManager />
            </TabsContent>
            <TabsContent value="emails">
              <EmailTemplatesEditor />
            </TabsContent>
            <TabsContent value="sms">
              <SmsTemplatesEditor />
            </TabsContent>
            <TabsContent value="reviews">
              <ReviewRequestSettings />
            </TabsContent>
            <TabsContent value="warranties">
              <WarrantySettings />
            </TabsContent>
            <TabsContent value="campaigns">
              <CampaignSettings />
            </TabsContent>
            <TabsContent value="voice">
              <VoiceOnboardingSettings />
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
