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
        <CardTitle className="text-xl sm:text-2xl font-brand uppercase text-white">{question.question}</CardTitle>
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
          {question.options.map((option, index) => (
            <div key={index} className="relative">
              <RadioGroupItem
                value={option.label}
                id={`${question.id}-${index}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`${question.id}-${index}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 bg-white",
                  "hover:border-primary/50 hover:bg-slate-50",
                  selectedOption === option.label
                    ? "border-primary bg-primary/5"
                    : "border-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    selectedOption === option.label
                      ? "border-primary bg-primary"
                      : "border-slate-400"
                  )}
                >
                  {selectedOption === option.label && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm sm:text-base text-slate-700">{option.label}</span>
              </Label>
            </div>
          ))}
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
