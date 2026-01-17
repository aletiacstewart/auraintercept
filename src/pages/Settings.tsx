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
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  const { userRole } = useAuth();
  const isPlatformAdmin = userRole === 'platform_admin';

  return (
    <DashboardLayout>
      {userRole === 'company_admin' || userRole === 'platform_admin' ? (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-white/70">
              Manage your company settings and preferences
            </p>
          </div>
          <Tabs defaultValue="branding" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
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
              {isPlatformAdmin && <TabsTrigger value="warranties">Warranties</TabsTrigger>}
              {isPlatformAdmin && <TabsTrigger value="campaigns">Campaigns</TabsTrigger>}
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
            {isPlatformAdmin && (
              <TabsContent value="warranties">
                <WarrantySettings />
              </TabsContent>
            )}
            {isPlatformAdmin && (
              <TabsContent value="campaigns">
                <CampaignSettings />
              </TabsContent>
            )}
          </Tabs>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-white/70">
              Manage your account settings
            </p>
          </div>
          <ProfileSettings />
        </div>
      )}
    </DashboardLayout>
  );
}
