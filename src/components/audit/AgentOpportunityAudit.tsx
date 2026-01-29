import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuditQuestion } from "./AuditQuestion";
import { AuditResults } from "./AuditResults";
import { QUESTIONS, SECTION_ORDER, TierType, TierScores } from "./types";

const STORAGE_KEY = 'aura_audit_progress';

interface SavedProgress {
  currentStep: number;
  answers: Record<string, string>;
  savedAt: number;
}

export function AgentOpportunityAudit() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const progress: SavedProgress = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        const dayInMs = 24 * 60 * 60 * 1000;
        if (Date.now() - progress.savedAt < dayInMs) {
          setCurrentStep(progress.currentStep);
          setAnswers(progress.answers);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load audit progress:', e);
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    if (Object.keys(answers).length > 0 && !showResults) {
      try {
        const progress: SavedProgress = {
          currentStep,
          answers,
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.error('Failed to save audit progress:', e);
      }
    }
  }, [currentStep, answers, showResults]);

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
      // Clear saved progress when complete
      localStorage.removeItem(STORAGE_KEY);
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
    localStorage.removeItem(STORAGE_KEY);
  };

  // Calculate tier fit percentages for all 6 tiers
  const tierPercentages = useMemo((): TierScores => {
    const totals: TierScores = { EXPRESS: 0, CORE: 0, HALO: 0, SINGLE_POINT: 0, MULTI_TRACK: 0, COMMAND: 0 };
    let answeredCount = 0;

    QUESTIONS.forEach((question) => {
      const selectedLabel = answers[question.id];
      if (selectedLabel) {
        const selectedOption = question.options.find(
          (opt) => opt.label === selectedLabel
        );
        if (selectedOption) {
          totals.EXPRESS += selectedOption.tierScores.EXPRESS;
          totals.CORE += selectedOption.tierScores.CORE;
          totals.HALO += selectedOption.tierScores.HALO;
          totals.SINGLE_POINT += selectedOption.tierScores.SINGLE_POINT;
          totals.MULTI_TRACK += selectedOption.tierScores.MULTI_TRACK;
          totals.COMMAND += selectedOption.tierScores.COMMAND;
          answeredCount++;
        }
      }
    });

    // Calculate average percentage for each tier
    if (answeredCount === 0) {
      return { EXPRESS: 0, CORE: 0, HALO: 0, SINGLE_POINT: 0, MULTI_TRACK: 0, COMMAND: 0 };
    }

    return {
      EXPRESS: Math.round(totals.EXPRESS / answeredCount),
      CORE: Math.round(totals.CORE / answeredCount),
      HALO: Math.round(totals.HALO / answeredCount),
      SINGLE_POINT: Math.round(totals.SINGLE_POINT / answeredCount),
      MULTI_TRACK: Math.round(totals.MULTI_TRACK / answeredCount),
      COMMAND: Math.round(totals.COMMAND / answeredCount),
    };
  }, [answers]);

  // Determine recommended tier based on highest fit
  const recommendedTier = useMemo((): TierType => {
    const { CORE, HALO, SINGLE_POINT, MULTI_TRACK, COMMAND } = tierPercentages;
    
    // Find the tier with highest score
    const scores: { tier: TierType; score: number }[] = [
      { tier: 'CORE', score: CORE },
      { tier: 'HALO', score: HALO },
      { tier: 'SINGLE_POINT', score: SINGLE_POINT },
      { tier: 'MULTI_TRACK', score: MULTI_TRACK },
      { tier: 'COMMAND', score: COMMAND },
    ];
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    return scores[0].tier;
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

        {/* Resume indicator */}
        {Object.keys(answers).length > 0 && currentStep > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Your progress is saved automatically
          </p>
        )}
      </div>
    </div>
  );
}
