import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AuraQuickStart } from '@/components/company/AuraQuickStart';

export default function Onboarding() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="py-8">
        <AuraQuickStart onComplete={handleComplete} />
      </div>
    </DashboardLayout>
  );
}
