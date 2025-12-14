import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BrandingSettings } from '@/components/company/BrandingSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  const { userRole } = useAuth();

  return (
    <DashboardLayout>
      {userRole === 'company_admin' || userRole === 'platform_admin' ? (
        <BrandingSettings />
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
