// GoLiveTimeline component for 14-day launch visualization
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Calendar,
  Palette,
  ListChecks,
  MessageSquare,
  Phone,
  Mic,
  TestTube,
  FileText,
  Rocket,
  Play,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { differenceInDays, addDays, format } from "date-fns";

export interface Milestone {
  key: string;
  label: string;
  description: string;
  targetDay: number;
  phase: 'setup' | 'testing' | 'soft_launch' | 'live';
  href: string;
  icon: React.ReactNode;
  isComplete: boolean;
}

interface GoLiveTimelineProps {
  startDate: Date;
  milestones: Milestone[];
  onMilestoneComplete?: (key: string) => void;
  compactMode?: boolean;
}

const PHASE_CONFIG = {
  setup: { label: 'Setup', color: 'bg-blue-500', days: '1-7' },
  testing: { label: 'Testing', color: 'bg-amber-500', days: '8-10' },
  soft_launch: { label: 'Soft Launch', color: 'bg-emerald-500', days: '11-13' },
  live: { label: 'Go Live', color: 'bg-primary', days: '14' },
};

export const DEFAULT_MILESTONES: Omit<Milestone, 'isComplete'>[] = [
  { 
    key: 'branding', 
    label: 'Add Branding', 
    description: 'Logo, colors, business info',
    targetDay: 1, 
    phase: 'setup', 
    href: '/dashboard/quick-setup',
    icon: <Palette className="h-4 w-4" />
  },
  { 
    key: 'business_hours', 
    label: 'Set Business Hours', 
    description: 'Open/close times, holidays',
    targetDay: 2, 
    phase: 'setup', 
    href: '/dashboard/knowledge',
    icon: <Clock className="h-4 w-4" />
  },
  { 
    key: 'services', 
    label: 'Add Services', 
    description: 'Service catalog with pricing',
    targetDay: 3, 
    phase: 'setup', 
    href: '/dashboard/knowledge',
    icon: <ListChecks className="h-4 w-4" />
  },
  { 
    key: 'faqs', 
    label: 'Add FAQs', 
    description: 'Common questions & answers',
    targetDay: 4, 
    phase: 'setup', 
    href: '/dashboard/knowledge',
    icon: <MessageSquare className="h-4 w-4" />
  },
  { 
    key: 'twilio', // key retained for stored progress compatibility; label reflects current vendor
    label: 'Connect Phone (SignalWire)', 
    description: 'Enable voice calls',
    targetDay: 5, 
    phase: 'setup', 
    href: '/dashboard/3rd-party-overview',
    icon: <Phone className="h-4 w-4" />
  },
  { 
    key: 'elevenlabs', 
    label: 'Connect Voice (ElevenLabs)', 
    description: 'AI voice synthesis',
    targetDay: 6, 
    phase: 'setup', 
    href: '/dashboard/3rd-party-overview',
    icon: <Mic className="h-4 w-4" />
  },
  { 
    key: 'test_call', 
    label: 'Make Test Call', 
    description: 'Call your AI receptionist',
    targetDay: 8, 
    phase: 'testing', 
    href: '/dashboard/agent',
    icon: <TestTube className="h-4 w-4" />
  },
  { 
    key: 'review_transcripts', 
    label: 'Review Transcripts', 
    description: 'Check AI responses',
    targetDay: 9, 
    phase: 'testing', 
    href: '/dashboard/ai-agents',
    icon: <FileText className="h-4 w-4" />
  },
  { 
    key: 'soft_launch', 
    label: 'Forward After-Hours', 
    description: 'Start with after-hours only',
    targetDay: 11, 
    phase: 'soft_launch', 
    href: '/dashboard/quick-setup',
    icon: <Play className="h-4 w-4" />
  },
  { 
    key: 'go_live', 
    label: 'Go Live!', 
    description: 'Full AI takeover',
    targetDay: 14, 
    phase: 'live', 
    href: '/dashboard',
    icon: <Rocket className="h-4 w-4" />
  },
];

export function GoLiveTimeline({ 
  startDate, 
  milestones, 
  compactMode = false 
}: GoLiveTimelineProps) {
  const navigate = useNavigate();
  const today = new Date();
  const currentDay = Math.max(1, differenceInDays(today, startDate) + 1);
  const goLiveDate = addDays(startDate, 13); // 14 days from start (0-indexed)
  const daysUntilLive = Math.max(0, differenceInDays(goLiveDate, today));
  
  const completedCount = milestones.filter(m => m.isComplete).length;
  const progress = (completedCount / milestones.length) * 100;

  // Group milestones by phase
  const phases = ['setup', 'testing', 'soft_launch', 'live'] as const;
  const milestonesByPhase = phases.reduce((acc, phase) => {
    acc[phase] = milestones.filter(m => m.phase === phase);
    return acc;
  }, {} as Record<typeof phases[number], Milestone[]>);

  // Determine current phase
  const currentPhase = currentDay <= 7 ? 'setup' 
    : currentDay <= 10 ? 'testing' 
    : currentDay <= 13 ? 'soft_launch' 
    : 'live';

  if (compactMode) {
    return (
      <Card className="border border-border">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs text-white", PHASE_CONFIG[currentPhase].color)}>
                Day {currentDay} of 14
              </Badge>
              <span className="text-sm text-muted-foreground">
                {PHASE_CONFIG[currentPhase].label} Phase
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {daysUntilLive} days to go-live
            </span>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedCount} of {milestones.length} tasks complete</span>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-xs"
              onClick={() => navigate('/dashboard/launch')}
            >
              View full timeline →
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-foreground">Day {currentDay}</p>
            <p className="text-sm text-muted-foreground">of 14</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{daysUntilLive}</p>
            <p className="text-sm text-muted-foreground">days to go-live</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-foreground">{completedCount}/{milestones.length}</p>
            <p className="text-sm text-muted-foreground">tasks complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="border border-border">
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between mt-4">
            {phases.map((phase) => {
              const config = PHASE_CONFIG[phase];
              const phaseComplete = milestonesByPhase[phase].every(m => m.isComplete);
              const isCurrent = phase === currentPhase;
              
              return (
                <div key={phase} className="text-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full mx-auto mb-1",
                    phaseComplete ? "bg-emerald-500" : isCurrent ? config.color : "bg-muted"
                  )} />
                  <p className={cn(
                    "text-xs",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">Day {config.days}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline by Phase */}
      {phases.map((phase) => {
        const config = PHASE_CONFIG[phase];
        const phaseMilestones = milestonesByPhase[phase];
        const phaseComplete = phaseMilestones.every(m => m.isComplete);
        const isCurrent = phase === currentPhase;
        
        return (
          <Card 
            key={phase} 
            className={cn(
              "border-2 transition-all",
              isCurrent ? "border-primary/50 bg-primary/5" : "border-border"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-8 rounded-full", config.color)} />
                  <div>
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      {config.label}
                      {phaseComplete && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      {isCurrent && !phaseComplete && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Day {config.days}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {phaseMilestones.filter(m => m.isComplete).length}/{phaseMilestones.length} complete
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {phaseMilestones.map((milestone) => (
                <div 
                  key={milestone.key}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    milestone.isComplete 
                      ? "bg-emerald-50 border-emerald-200" 
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {milestone.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className={cn(
                        "font-medium text-sm",
                        milestone.isComplete ? "text-emerald-700" : "text-foreground"
                      )}>
                        {milestone.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={milestone.isComplete ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => navigate(milestone.href)}
                    className="gap-1"
                  >
                    {milestone.isComplete ? 'Review' : 'Start'}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Go Live Date */}
      <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-orange-500/10">
        <CardContent className="pt-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">Target Go-Live Date</p>
          <p className="text-2xl font-bold text-foreground">
            {format(goLiveDate, 'MMMM d, yyyy')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {daysUntilLive === 0 ? "That's today! 🚀" : `${daysUntilLive} days remaining`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
