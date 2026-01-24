import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Phone, 
  Calendar, 
  Truck, 
  Receipt, 
  UserCheck,
  Megaphone,
  ArrowRight,
  ArrowLeft,
  User,
  Users,
  UserX,
  Monitor,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RoleType = 'receptionist' | 'scheduler' | 'dispatcher' | 'billing' | 'followup' | 'marketing';
export type HandledByType = 'owner' | 'dedicated_staff' | 'shared_staff' | 'nobody' | 'software';
export type PainLevel = 1 | 2 | 3 | 4;

export interface RoleMapping {
  role: RoleType;
  currentlyHandledBy: HandledByType;
  painLevel: PainLevel;
}

interface RoleMappingSectionProps {
  onComplete: (mappings: RoleMapping[]) => void;
  onBack: () => void;
}

interface RoleQuestion {
  role: RoleType;
  question: string;
  icon: React.ReactNode;
  agentName: string;
  description: string;
}

const ROLE_QUESTIONS: RoleQuestion[] = [
  {
    role: 'receptionist',
    question: 'Who currently answers your phones?',
    icon: <Phone className="h-5 w-5" />,
    agentName: 'AI Receptionist',
    description: 'Phone triage, after-hours, lead qualification',
  },
  {
    role: 'scheduler',
    question: 'Who handles appointment scheduling?',
    icon: <Calendar className="h-5 w-5" />,
    agentName: 'Booking Agent',
    description: 'Calendar management, confirmations, rescheduling',
  },
  {
    role: 'dispatcher',
    question: 'Who dispatches technicians to jobs?',
    icon: <Truck className="h-5 w-5" />,
    agentName: 'Dispatch Agent',
    description: 'Technician assignment, route optimization',
  },
  {
    role: 'billing',
    question: 'Who handles quotes and invoicing?',
    icon: <Receipt className="h-5 w-5" />,
    agentName: 'Quote & Invoice Agent',
    description: 'Estimates, invoicing, payment follow-ups',
  },
  {
    role: 'followup',
    question: 'Who follows up with customers after service?',
    icon: <UserCheck className="h-5 w-5" />,
    agentName: 'Follow-up Agent',
    description: 'Review requests, satisfaction checks, rebooking',
  },
  {
    role: 'marketing',
    question: 'Who manages your marketing and social media?',
    icon: <Megaphone className="h-5 w-5" />,
    agentName: 'Marketing Agent',
    description: 'Campaigns, social content, lead nurturing',
  },
];

const HANDLED_BY_OPTIONS: { value: HandledByType; label: string; icon: React.ReactNode }[] = [
  { value: 'owner', label: 'Owner/Me', icon: <User className="h-4 w-4" /> },
  { value: 'dedicated_staff', label: 'Dedicated Staff', icon: <UserCheck className="h-4 w-4" /> },
  { value: 'shared_staff', label: 'Shared Staff', icon: <Users className="h-4 w-4" /> },
  { value: 'nobody', label: 'Nobody (Gap)', icon: <UserX className="h-4 w-4" /> },
  { value: 'software', label: 'Software/Tool', icon: <Monitor className="h-4 w-4" /> },
];

const PAIN_LEVELS: { value: PainLevel; label: string; color: string }[] = [
  { value: 1, label: 'Works fine', color: 'bg-emerald-500' },
  { value: 2, label: 'Could be better', color: 'bg-yellow-500' },
  { value: 3, label: 'Frustrating', color: 'bg-orange-500' },
  { value: 4, label: 'Major pain point', color: 'bg-red-500' },
];

export function RoleMappingSection({ onComplete, onBack }: RoleMappingSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mappings, setMappings] = useState<Partial<Record<RoleType, RoleMapping>>>({});
  const [currentHandledBy, setCurrentHandledBy] = useState<HandledByType | null>(null);
  const [currentPainLevel, setCurrentPainLevel] = useState<PainLevel | null>(null);

  const currentQuestion = ROLE_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / ROLE_QUESTIONS.length) * 100;

  const handleNext = () => {
    if (currentHandledBy && currentPainLevel) {
      const newMappings = {
        ...mappings,
        [currentQuestion.role]: {
          role: currentQuestion.role,
          currentlyHandledBy: currentHandledBy,
          painLevel: currentPainLevel,
        },
      };
      setMappings(newMappings);

      if (currentQuestionIndex < ROLE_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        // Pre-fill if we have existing data
        const nextRole = ROLE_QUESTIONS[currentQuestionIndex + 1].role;
        const existingMapping = newMappings[nextRole];
        setCurrentHandledBy(existingMapping?.currentlyHandledBy || null);
        setCurrentPainLevel(existingMapping?.painLevel || null);
      } else {
        // All questions answered, complete
        const finalMappings = Object.values(newMappings) as RoleMapping[];
        onComplete(finalMappings);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevRole = ROLE_QUESTIONS[currentQuestionIndex - 1].role;
      const existingMapping = mappings[prevRole];
      setCurrentHandledBy(existingMapping?.currentlyHandledBy || null);
      setCurrentPainLevel(existingMapping?.painLevel || null);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      onBack();
    }
  };

  const canProceed = currentHandledBy !== null && currentPainLevel !== null;

  // Count high pain points for summary
  const highPainCount = Object.values(mappings).filter(m => m && m.painLevel >= 3).length;
  const ownerHandledCount = Object.values(mappings).filter(m => m && m.currentlyHandledBy === 'owner').length;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Step 2: Map Your Operations
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-brand text-foreground mb-2">
            Who handles what today?
          </h1>
          <p className="text-muted-foreground">
            We'll map your current front-office roles to AI agents that can take over.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Role {currentQuestionIndex + 1} of {ROLE_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Quick Stats */}
        {currentQuestionIndex > 0 && (
          <div className="flex gap-4 mb-6">
            {ownerHandledCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-4 w-4" />
                {ownerHandledCount} role{ownerHandledCount !== 1 ? 's' : ''} on you
              </div>
            )}
            {highPainCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-4 w-4" />
                {highPainCount} pain point{highPainCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Question Card */}
        <Card className="border-2 border-border mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {currentQuestion.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Maps to: {currentQuestion.agentName}
                </p>
              </div>
            </div>
            <CardTitle className="text-xl text-foreground">
              {currentQuestion.question}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This role will be handled by: <span className="font-medium text-primary">{currentQuestion.agentName}</span>
              <br />
              <span className="text-xs">{currentQuestion.description}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Who handles it */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Who handles this now?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HANDLED_BY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCurrentHandledBy(option.value)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                      currentHandledBy === option.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pain level */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">How well is this working?</p>
              <div className="grid grid-cols-2 gap-2">
                {PAIN_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setCurrentPainLevel(level.value)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                      currentPainLevel === level.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", level.color)} />
                    <span className="text-sm font-medium text-foreground">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!canProceed}
            className="gap-2"
          >
            {currentQuestionIndex < ROLE_QUESTIONS.length - 1 ? 'Next Role' : 'See Your Launch Plan'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Role dots indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {ROLE_QUESTIONS.map((q, index) => {
            const mapping = mappings[q.role];
            const isComplete = mapping !== undefined;
            const isCurrent = index === currentQuestionIndex;
            
            return (
              <div
                key={q.role}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isCurrent 
                    ? "w-6 bg-primary" 
                    : isComplete 
                      ? "bg-primary/60" 
                      : "bg-border"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
