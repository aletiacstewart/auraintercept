import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { RevenueAnalysisForm } from '@/components/analytics/forms/RevenueAnalysisForm';
import { useNavigate } from 'react-router-dom';

export default function RevenueAnalysisPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-white/70">No company associated with your account.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RevenueAnalysisForm 
        companyId={companyId} 
        onCancel={() => navigate('/dashboard/ai-consoles/business-management')}
      />
    </DashboardLayout>
  );
}