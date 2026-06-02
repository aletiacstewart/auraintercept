import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import FieldOperations from '@/pages/FieldOperations';
import { AppointmentConsole } from './AppointmentConsole';
import { PipelineConsole } from './PipelineConsole';
import { ReceptionistConsole } from './ReceptionistConsole';
import { CustomConsole } from './CustomConsole';

export default function OperationsRouter() {
  const { companyId } = useAuth();
  const { workspace, loading } = useWorkspace();
  const navigate = useNavigate();

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!workspace || !companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Card className="max-w-xl mx-auto mt-12 p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              No dispatch workspace configured
            </h2>
            <p className="text-sm text-muted-foreground">
              You don't have a company workspace selected, or its operating model
              hasn't been set up yet. Configure Field Ops in Settings to enable
              dispatch, routing, and ETA tools.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={() => navigate('/dashboard/quick-setup')}>
                Open Settings
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/ai-consoles/field-ops')}>
                Go to Service Management
              </Button>
            </div>
          </Card>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // field_dispatch reuses the existing dispatch page (live truck map etc.)
  if (workspace.operatingModel === 'field_dispatch') {
    return <FieldOperations />;
  }

  let body: JSX.Element;
  switch (workspace.operatingModel) {
    case 'appointment_booking':
      body = <AppointmentConsole workspace={workspace} companyId={companyId} />;
      break;
    case 'pipeline_sales':
      body = <PipelineConsole workspace={workspace} companyId={companyId} />;
      break;
    case 'receptionist_only':
      body = <ReceptionistConsole workspace={workspace} companyId={companyId} />;
      break;
    default:
      body = <CustomConsole workspace={workspace} companyId={companyId} />;
  }

  return (
    <DashboardLayout>
      <PageContainer>{body}</PageContainer>
    </DashboardLayout>
  );
}