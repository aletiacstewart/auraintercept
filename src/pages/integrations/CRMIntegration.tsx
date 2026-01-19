import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { CRMConnectionSettings } from '@/components/integrations/CRMConnectionSettings';
import { CRMSetupGuides } from '@/components/integrations/CRMSetupGuides';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CRMIntegration() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Network}
            title="CRM Integration"
            description="Connect your CRM to sync customer data"
            featureColor="integrations"
            action={
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/3rd-party-overview">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
            }
          />

          {/* CRM Settings */}
          <CRMConnectionSettings />

          {/* CRM Setup Guides */}
          <CRMSetupGuides />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
