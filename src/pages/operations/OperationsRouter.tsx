import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
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

  if (loading || !workspace || !companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Skeleton className="h-96 w-full" />
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