import { useState } from "react";
import { AuditProgress } from "./AuditProgress";
import { AuditQuestion } from "./AuditQuestion";
import { AuditResults } from "./AuditResults";
import { QUESTIONS, type Scores, type ScoreCategory } from "./types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AgentOpportunityAudit() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [QUESTIONS[currentStep].id]: option
    }));
  };

  const handleNext = () => {
    if (currentStep === QUESTIONS.length - 1) {
      setShowResults(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const calculateScores = (): Scores => {
    const scores: Scores = { FDA: 0, SA: 0, RA: 0, KOA: 0, FOA: 0, CA: 0, FUA: 0, BIA: 0 };

    QUESTIONS.forEach(question => {
      const selectedOption = answers[question.id];
      if (selectedOption) {
        const option = question.options.find(o => o.label === selectedOption);
        if (option?.scores) {
          (Object.entries(option.scores) as [ScoreCategory, number][]).forEach(
            ([category, value]) => {
              scores[category] += value;
            }
          );
        }
      }
    });

    return scores;
  };

  if (showResults) {
    return (
      <div className="min-h-screen py-8 px-4">
        <AuditResults scores={calculateScores()} onRestart={handleRestart} />
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentStep];
  const currentSection = currentQuestion.section;

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Agent Opportunity Audit
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover where AI can save you time and capture more revenue
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Results are estimates only. Individual outcomes vary based on implementation and business factors.
          </p>
        </div>

        {/* Section Badge */}
        {currentSection && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              {currentSection}
            </Badge>
          </div>
        )}

        {/* Progress */}
        <AuditProgress currentStep={currentStep} totalSteps={QUESTIONS.length} />

        {/* Question */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            "transform"
          )}
        >
          <AuditQuestion
            question={currentQuestion}
            selectedOption={answers[currentQuestion.id] || null}
            onSelect={handleSelect}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentStep === 0}
            isLast={currentStep === QUESTIONS.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
