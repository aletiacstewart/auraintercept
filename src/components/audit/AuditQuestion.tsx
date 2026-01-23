import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { AuditQuestion as AuditQuestionType } from "./types";
import { cn } from "@/lib/utils";

interface AuditQuestionProps {
  question: AuditQuestionType;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// Color coding for answer options: green (great) -> yellow (good) -> orange (okay) -> red (bad)
const getOptionColors = (index: number) => {
  const colors = [
    { bg: 'bg-emerald-500', border: 'border-emerald-500', hoverBg: 'hover:bg-emerald-500/20', circle: 'bg-emerald-500 border-emerald-500' },
    { bg: 'bg-yellow-500', border: 'border-yellow-500', hoverBg: 'hover:bg-yellow-500/20', circle: 'bg-yellow-500 border-yellow-500' },
    { bg: 'bg-orange-500', border: 'border-orange-500', hoverBg: 'hover:bg-orange-500/20', circle: 'bg-orange-500 border-orange-500' },
    { bg: 'bg-red-500', border: 'border-red-500', hoverBg: 'hover:bg-red-500/20', circle: 'bg-red-500 border-red-500' },
  ];
  return colors[index] || colors[3]; // Default to red for 5th+ options
};

export function AuditQuestion({
  question,
  selectedOption,
  onSelect,
  onNext,
  onBack,
  isFirst,
  isLast
}: AuditQuestionProps) {
  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl sm:text-2xl font-brand uppercase text-white tracking-wider">{question.question}</CardTitle>
        {question.description && (
          <CardDescription className="text-base text-white/80">
            {question.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedOption || ""}
          onValueChange={onSelect}
          className="space-y-3"
        >
          {question.options.map((option, index) => {
            const colors = getOptionColors(index);
            const isSelected = selectedOption === option.label;
            
            return (
              <div key={index} className="relative">
                <RadioGroupItem
                  value={option.label}
                  id={`${question.id}-${index}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`${question.id}-${index}`}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    isSelected
                      ? `${colors.border} ${colors.bg} text-white`
                      : `border-white/20 bg-white/10 ${colors.hoverBg} hover:border-white/40`
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      isSelected
                        ? "border-white bg-white"
                        : "border-white/50"
                    )}
                  >
                    {isSelected && (
                      <div className={cn("w-3 h-3 rounded-full", colors.bg)} />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm sm:text-base font-medium",
                    isSelected ? "text-white" : "text-white"
                  )}>{option.label}</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isFirst}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!selectedOption}
            className="gap-2"
          >
            {isLast ? "See Results" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
