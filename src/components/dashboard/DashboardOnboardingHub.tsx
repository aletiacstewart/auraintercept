import { useLaunchProgress } from "@/hooks/useLaunchProgress";
import { LaunchProgressCard } from "./LaunchProgressCard";
import { OnboardingChecklist } from "@/components/company/OnboardingChecklist";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardOnboardingHubProps {
  companyId?: string;
}

export function DashboardOnboardingHub({ companyId: _companyId }: DashboardOnboardingHubProps) {
  const { launchProgress, isLoading } = useLaunchProgress();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Company is in Guided Launch Flow - show launch progress card
  if (launchProgress) {
    return <LaunchProgressCard />;
  }

  // Regular onboarding - show detailed checklist
  return <OnboardingChecklist />;
}
