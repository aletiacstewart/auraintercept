import { Progress } from "@/components/ui/progress";

interface AuditProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function AuditProgress({ currentStep, totalSteps }: AuditProgressProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <Progress value={progressPercentage} className="h-2" />
      <p className="text-center text-sm text-muted-foreground">
        Question {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
}
