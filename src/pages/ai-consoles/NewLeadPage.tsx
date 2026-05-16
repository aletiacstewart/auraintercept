import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageContainer } from '@/components/ui/page-container';
import { useAuth } from '@/contexts/AuthContext';
import { LeadForm } from '@/components/marketing/forms/LeadForm';
import { useNavigate } from 'react-router-dom';

export default function NewLeadPage() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  if (!companyId) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <p className="text-foreground">No company associated with your account.</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <LeadForm 
          companyId={companyId} 
          onCancel={() => navigate('/dashboard/leads')}
          onSuccess={() => navigate('/dashboard/leads')}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
