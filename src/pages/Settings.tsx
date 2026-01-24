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
import { SystemSettings } from '@/components/settings/SystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import { Settings as SettingsIcon, Mic, HardDrive } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const VALID_TABS = [
  'branding', 'contact', 'app-url', 'reminders', 'missed-calls', 
  'default-prefs', 'reports', 'alerts', 'customer-prefs', 
  'emails', 'sms', 'reviews', 'warranties', 'campaigns', 'voice', 'system'
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
            <TabsList>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="app-url">App URL</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="missed-calls">Missed Calls</TabsTrigger>
              <TabsTrigger value="default-prefs">Default Prefs</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="customer-prefs">Customer Prefs</TabsTrigger>
              <TabsTrigger value="emails">Email Templates</TabsTrigger>
              <TabsTrigger value="sms">SMS Templates</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="warranties">Warranties</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Ask Aura
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                System
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
            <TabsContent value="system">
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
