import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FieldOpsManager } from '@/components/fieldops';
import { Skeleton } from '@/components/ui/skeleton';

export default function FieldOperations() {
  const { companyId, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center text-white/70">
          No company selected
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <FieldOpsManager companyId={companyId} />
      </div>
    </DashboardLayout>
  );
}
