import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, Calendar, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLaunchProgress } from "@/hooks/useLaunchProgress";
import { Skeleton } from "@/components/ui/skeleton";

const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
  setup: { label: 'Setup', color: 'text-blue-500' },
  testing: { label: 'Testing', color: 'text-amber-500' },
  soft_launch: { label: 'Soft Launch', color: 'text-purple-500' },
  live: { label: 'Live', color: 'text-green-500' }
};

export function LaunchProgressCard() {
  const navigate = useNavigate();
  const { 
    launchProgress, 
    isLoading, 
    getProgress, 
    getCurrentDay 
  } = useLaunchProgress();

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!launchProgress) {
    return null;
  }

  const currentDay = getCurrentDay();
  const progressData = getProgress();
  const progress = typeof progressData === 'number' ? progressData : progressData.percentage;
  const daysRemaining = Math.max(0, 14 - currentDay);
  const currentPhase = launchProgress.current_phase || 'setup';
  const phaseConfig = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.setup;
  
  const completedMilestones = typeof progressData === 'number' ? 0 : progressData.completedCount;
  const totalMilestones = typeof progressData === 'number' ? 8 : progressData.totalCount;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Launch Progress
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-white">
            <Calendar className="h-3.5 w-3.5" />
            <span>Day {currentDay} of 14</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-white">
            <span>{Math.round(progress)}% complete</span>
            <span>{completedMilestones}/{totalMilestones} milestones</span>
          </div>
        </div>

        {/* Phase & Days Remaining */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${phaseConfig.color}`}>
              {currentPhase === 'live' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="font-medium text-sm">
                {phaseConfig.label} Phase
              </span>
            </div>
          </div>
          
          <div className="text-sm">
            {daysRemaining > 0 ? (
              <span className="text-white">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} to go-live
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-500 font-medium">
                Ready to launch!
              </span>
            )}
          </div>
        </div>

        {/* View Timeline Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => navigate('/dashboard/launch-timeline')}
        >
          <span>View Full Timeline</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
