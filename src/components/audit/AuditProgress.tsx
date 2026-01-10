import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface AuditProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function AuditProgress({ currentStep, totalSteps }: AuditProgressProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                i + 1
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "h-1 w-8 sm:w-12 mx-1 rounded-full transition-all duration-300",
                  i < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Question {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
}
