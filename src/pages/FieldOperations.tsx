import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FieldOpsManager } from '@/components/fieldops';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck } from 'lucide-react';

export default function FieldOperations() {
  const { companyId, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Skeleton className="h-[600px] w-full" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No company selected
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <div className="h-[calc(100vh-8rem)]">
          <FieldOpsManager companyId={companyId} />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}