import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuditQuestion } from "./AuditQuestion";
import { AuditResults } from "./AuditResults";
import { QUESTIONS, SECTION_ORDER, TierType, TierScores } from "./types";

export function AgentOpportunityAudit() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [QUESTIONS[currentStep].id]: option,
    }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  // Calculate tier fit percentages
  const tierPercentages = useMemo((): TierScores => {
    const totals: TierScores = { SINGLE_POINT: 0, MULTI_TRACK: 0, COMMAND: 0 };
    let answeredCount = 0;

    QUESTIONS.forEach((question) => {
      const selectedLabel = answers[question.id];
      if (selectedLabel) {
        const selectedOption = question.options.find(
          (opt) => opt.label === selectedLabel
        );
        if (selectedOption) {
          totals.SINGLE_POINT += selectedOption.tierScores.SINGLE_POINT;
          totals.MULTI_TRACK += selectedOption.tierScores.MULTI_TRACK;
          totals.COMMAND += selectedOption.tierScores.COMMAND;
          answeredCount++;
        }
      }
    });

    // Calculate average percentage for each tier
    if (answeredCount === 0) {
      return { SINGLE_POINT: 0, MULTI_TRACK: 0, COMMAND: 0 };
    }

    return {
      SINGLE_POINT: Math.round(totals.SINGLE_POINT / answeredCount),
      MULTI_TRACK: Math.round(totals.MULTI_TRACK / answeredCount),
      COMMAND: Math.round(totals.COMMAND / answeredCount),
    };
  }, [answers]);

  // Determine recommended tier
  const recommendedTier = useMemo((): TierType => {
    const { SINGLE_POINT, MULTI_TRACK, COMMAND } = tierPercentages;
    
    // If Command has highest fit, recommend it
    if (COMMAND >= MULTI_TRACK && COMMAND >= SINGLE_POINT) {
      return 'COMMAND';
    }
    // If Multi-Track has highest fit
    if (MULTI_TRACK >= SINGLE_POINT) {
      return 'MULTI_TRACK';
    }
    return 'SINGLE_POINT';
  }, [tierPercentages]);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const currentSection = currentQuestion?.section || '';
  const sectionIndex = SECTION_ORDER.indexOf(currentSection);

  if (showResults) {
    return (
      <AuditResults
        tierPercentages={tierPercentages}
        recommendedTier={recommendedTier}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-brand uppercase tracking-tight mb-2">
            AI Opportunity Audit
          </h1>
          <p className="text-muted-foreground">
            Discover which automation tier fits your business needs
          </p>
        </div>

        {/* Section Badge */}
        <div className="flex justify-center mb-6">
          <Badge 
            variant="outline" 
            className="text-sm px-4 py-1.5 border-primary/30 bg-primary/5"
          >
            {currentSection} ({sectionIndex + 1}/{SECTION_ORDER.length})
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentStep + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
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
  );
}
