import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessMgtOpsAppCard } from '@/components/company/BusinessMgtOpsAppCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ExternalLink, Monitor, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BusinessMgtOpsInstall() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            icon={Briefcase}
            title="Business Mgt Ops App Install"
            description="Install the Business Management Ops app on your device for quick access"
            featureColor="analytics"
            badge={
              <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            }
          />

        {/* Main Install Card */}
        <BusinessMgtOpsAppCard />

        {/* Web Backup Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Web Backup Access
            </CardTitle>
            <CardDescription>
              Access the Business Management Ops consoles directly from your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/ai-consoles/business-management')}
              className="gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Open Business Ops Console
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/ai-consoles/analytics')}
              className="gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Open Analytics Console
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/business-mgt-ops-app', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Standalone App
            </Button>
          </CardContent>
        </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
