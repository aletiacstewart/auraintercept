import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BrandingSettings } from '@/components/company/BrandingSettings';
import { ReminderSettings } from '@/components/company/ReminderSettings';
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
            <TabsList>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>
            <TabsContent value="branding">
              <BrandingSettings />
            </TabsContent>
            <TabsContent value="reminders">
              <ReminderSettings />
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
