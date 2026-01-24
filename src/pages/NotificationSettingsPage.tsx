import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { Bell } from 'lucide-react';

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
      </div>
    </DashboardLayout>
  );
}
