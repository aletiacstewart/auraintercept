import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { Bell, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

export default function NotificationSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Bell}
          title="Notification Settings"
          description="Configure how and when you receive alerts for important events"
          featureColor="config"
        />
        
        <NotificationSettings />

        <Link to="/dashboard/email-limits">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Email Limits & Usage</div>
                  <div className="text-xs text-muted-foreground">
                    View daily/monthly Resend usage, blocked sends, and cap settings.
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
  );
}
