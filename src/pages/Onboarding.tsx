import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OnboardingWizard } from '@/components/company/OnboardingWizard';

export default function Onboarding() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="py-8">
        <OnboardingWizard onComplete={handleComplete} />
      </div>
    </DashboardLayout>
  );
}
