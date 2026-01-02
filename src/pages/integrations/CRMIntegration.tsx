import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CRMConnectionSettings } from '@/components/integrations/CRMConnectionSettings';
import { CRMSetupGuides } from '@/components/integrations/CRMSetupGuides';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CRMIntegration() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/integrations">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM Integration</h1>
            <p className="text-muted-foreground">Connect your CRM to sync customer data</p>
          </div>
        </div>

        {/* CRM Settings */}
        <CRMConnectionSettings />

        {/* CRM Setup Guides */}
        <CRMSetupGuides />
      </div>
    </DashboardLayout>
  );
}
