import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BrandingSettings } from '@/components/company/BrandingSettings';
import { ReminderSettings } from '@/components/company/ReminderSettings';
import { ReminderHistoryLog } from '@/components/company/ReminderHistoryLog';
import { ReminderAnalytics } from '@/components/company/ReminderAnalytics';
import { CustomerPreferencesManager } from '@/components/company/CustomerPreferencesManager';
import { DefaultPreferencesSettings } from '@/components/company/DefaultPreferencesSettings';
import { SubscriptionAnalytics } from '@/components/company/SubscriptionAnalytics';
import { UnsubscribeAlertSettings } from '@/components/company/UnsubscribeAlertSettings';
import { WeeklyDigestSettings } from '@/components/company/WeeklyDigestSettings';
import { MonthlyDigestSettings } from '@/components/company/MonthlyDigestSettings';
import { QuarterlyDigestSettings } from '@/components/company/QuarterlyDigestSettings';
import { EmailTemplatesEditor } from '@/components/settings/EmailTemplatesEditor';
import { SmsTemplatesEditor } from '@/components/settings/SmsTemplatesEditor';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  const { userRole } = useAuth();

  return (
    <DashboardLayout>
      {userRole === 'company_admin' || userRole === 'platform_admin' ? (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your company settings and preferences
            </p>
          </div>
          <Tabs defaultValue="branding" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="default-prefs">Default Prefs</TabsTrigger>
              <TabsTrigger value="reminder-analytics">Reminder Stats</TabsTrigger>
              <TabsTrigger value="subscription-analytics">Opt-in/Out</TabsTrigger>
              <TabsTrigger value="reminder-history">History</TabsTrigger>
              <TabsTrigger value="customer-prefs">Customer Prefs</TabsTrigger>
              <TabsTrigger value="emails">Email Templates</TabsTrigger>
              <TabsTrigger value="sms">SMS Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="branding">
              <BrandingSettings />
            </TabsContent>
            <TabsContent value="reminders">
              <ReminderSettings />
            </TabsContent>
            <TabsContent value="default-prefs">
              <DefaultPreferencesSettings />
            </TabsContent>
            <TabsContent value="reminder-analytics">
              <ReminderAnalytics />
            </TabsContent>
            <TabsContent value="subscription-analytics">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UnsubscribeAlertSettings />
                  <WeeklyDigestSettings />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MonthlyDigestSettings />
                  <QuarterlyDigestSettings />
                </div>
                <SubscriptionAnalytics />
              </div>
            </TabsContent>
            <TabsContent value="reminder-history">
              <ReminderHistoryLog />
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
          </Tabs>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings
            </p>
          </div>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Profile settings coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
