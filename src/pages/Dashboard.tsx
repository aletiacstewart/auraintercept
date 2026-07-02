import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeJobRole } from '@/hooks/useEmployeeJobRole';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayoutWithTutorial } from '@/components/dashboard/DashboardLayout';
import { PlatformAdminDashboard } from '@/components/dashboard/PlatformAdminDashboard';
import { CompanyAdminDashboard } from '@/components/dashboard/CompanyAdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useTutorialContext } from '@/components/tutorial/DashboardTutorial';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
export default function Dashboard() {
  const { user, loading, userRole, companyId } = useAuth();
  const { hasJobType, jobTypes, loading: jobRoleLoading } = useEmployeeJobRole();
  const { shouldShowWelcome, markTourCompleted, isLoading: onboardingLoading } = useOnboardingState();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile and company for welcome modal
  const { data: profileData } = useQuery({
    queryKey: ['dashboard-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: companyData } = useQuery({
    queryKey: ['dashboard-company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  // Show welcome modal for first-time users
  useEffect(() => {
    if (!loading && !onboardingLoading && user && shouldShowWelcome()) {
      setShowWelcomeModal(true);
    }
  }, [loading, onboardingLoading, user, shouldShowWelcome]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect technicians to their dedicated dashboard
  useEffect(() => {
    if (!loading && !jobRoleLoading && userRole === 'employee' && hasJobType('technician')) {
      navigate('/technician', { replace: true });
    }
  }, [loading, jobRoleLoading, userRole, hasJobType, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderDashboard = () => {
    switch (userRole) {
      case 'platform_admin':
        return <PlatformAdminDashboard />;
      case 'company_admin':
        return <CompanyAdminDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-white">Loading your dashboard...</p>
          </div>
        );
    }
  };

  const handleCloseWelcome = async () => {
    // Close modal first for better UX, then persist
    setShowWelcomeModal(false);
    const success = await markTourCompleted('welcome');
    if (!success) {
      console.warn('Failed to persist welcome tour completion to database, using localStorage fallback');
    }
  };

  return (
    <DashboardLayoutWithTutorial>
      <TutorialStartBanner />
      {renderDashboard()}
      
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        userRole={userRole}
        userName={profileData?.full_name?.split(' ')[0]}
        companyName={companyData?.name}
        jobTypes={jobTypes}
      />
    </DashboardLayoutWithTutorial>
  );
}

function TutorialStartBanner() {
  const { start, isActive } = useTutorialContext();
  if (isActive) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary) / 1)', filter: 'brightness(1.6)' }}>New here? Take a guided tutorial of the platform.</span>
      </div>
      <Button size="sm" onClick={start} className="gradient-primary text-xs">
        Start Tutorial
      </Button>
    </div>
  );
}
