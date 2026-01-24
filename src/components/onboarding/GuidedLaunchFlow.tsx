import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2,
  ArrowRight,
  Phone,
  Calendar,
  Truck,
  Receipt,
  UserCheck,
  Megaphone,
  Bot,
  Sparkles
} from "lucide-react";
import { RoleMapping, RoleType } from "@/components/audit/RoleMappingSection";
import { LaunchPathSelector, LaunchPath } from "./LaunchPathSelector";
import { GoLiveTimeline, DEFAULT_MILESTONES, Milestone } from "./GoLiveTimeline";
import { TierType, TIER_RECOMMENDATIONS } from "@/components/audit/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GuidedLaunchFlowProps {
  roleMappings: RoleMapping[];
  recommendedTier: TierType;
  onBack: () => void;
}

const ROLE_TO_AGENT: Record<RoleType, { name: string; icon: React.ReactNode }> = {
  receptionist: { name: 'AI Receptionist', icon: <Phone className="h-4 w-4" /> },
  scheduler: { name: 'Booking Agent', icon: <Calendar className="h-4 w-4" /> },
  dispatcher: { name: 'Dispatch Agent', icon: <Truck className="h-4 w-4" /> },
  billing: { name: 'Quote & Invoice Agent', icon: <Receipt className="h-4 w-4" /> },
  followup: { name: 'Follow-up Agent', icon: <UserCheck className="h-4 w-4" /> },
  marketing: { name: 'Marketing Agent', icon: <Megaphone className="h-4 w-4" /> },
};

const HANDLED_BY_LABELS: Record<string, string> = {
  owner: 'Currently: You handle this',
  dedicated_staff: 'Currently: Dedicated staff',
  shared_staff: 'Currently: Shared staff',
  nobody: 'Currently: No one (gap)',
  software: 'Currently: Software/tools',
};

type FlowStep = 'summary' | 'path_selection' | 'timeline';

export function GuidedLaunchFlow({ roleMappings, recommendedTier, onBack }: GuidedLaunchFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('summary');
  const [selectedPath, setSelectedPath] = useState<LaunchPath | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [startDate] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { companyId, user } = useAuth();

  const tierRec = TIER_RECOMMENDATIONS[recommendedTier];

  // High pain roles that will benefit most from AI
  const highPainRoles = roleMappings.filter(m => m.painLevel >= 3);
  const ownerHandledRoles = roleMappings.filter(m => m.currentlyHandledBy === 'owner');

  // Initialize milestones with completion status
  useEffect(() => {
    const initialMilestones: Milestone[] = DEFAULT_MILESTONES.map(m => ({
      ...m,
      isComplete: false,
    }));
    setMilestones(initialMilestones);
  }, []);

  const handlePathSelection = async (path: LaunchPath) => {
    setSelectedPath(path);

    if (path === 'concierge') {
      // Open Calendly for concierge kickoff
      window.open('https://calendly.com/aura-intercept/concierge-kickoff', '_blank');
    }

    // Save to database if user is logged in
    if (companyId) {
      try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 14);

        await supabase.from('launch_progress').upsert({
          company_id: companyId,
          launch_type: path,
          target_go_live_date: targetDate.toISOString().split('T')[0],
          current_phase: 'setup',
          started_at: new Date().toISOString(),
        });

        // Save role mappings
        for (const mapping of roleMappings) {
          await supabase.from('role_mappings').upsert({
            company_id: companyId,
            role: mapping.role,
            currently_handled_by: mapping.currentlyHandledBy,
            pain_level: mapping.painLevel,
            mapped_agent_type: ROLE_TO_AGENT[mapping.role].name,
          });
        }

        toast.success('Launch plan saved!');
      } catch (error) {
        console.error('Error saving launch progress:', error);
      }
    }

    if (path === 'self_guided') {
      setCurrentStep('timeline');
    }
  };

  const handleStartLaunch = () => {
    // If user is logged in, go to dashboard
    // Otherwise, go to signup with launch data
    if (user) {
      navigate('/dashboard');
    } else {
      // Store launch data for after signup
      localStorage.setItem('pendingLaunchData', JSON.stringify({
        roleMappings,
        recommendedTier,
        launchPath: selectedPath,
      }));
      navigate('/signup');
    }
  };

  // Step: Role Summary
  if (currentStep === 'summary') {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary to-orange-500 text-white shadow-lg">
                <Bot className="h-8 w-8" />
              </div>
            </div>
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              Your AI Team is Ready
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-brand text-foreground mb-2">
              Here's how we'll set up your AI workforce
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Based on your role mapping, these AI agents will be auto-activated for you.
            </p>
          </div>

          {/* Pain Points Summary */}
          {(highPainRoles.length > 0 || ownerHandledRoles.length > 0) && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">High-Impact Automations Identified</p>
                    <p className="text-sm text-amber-700">
                      {ownerHandledRoles.length > 0 && (
                        <span>You're personally handling {ownerHandledRoles.length} role{ownerHandledRoles.length !== 1 ? 's' : ''}. </span>
                      )}
                      {highPainRoles.length > 0 && (
                        <span>{highPainRoles.length} role{highPainRoles.length !== 1 ? 's are' : ' is'} causing friction. </span>
                      )}
                      These are prime candidates for AI takeover.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role to Agent Mapping */}
          <Card className="mb-8 border border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Your AI Agent Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roleMappings.map((mapping) => {
                const agent = ROLE_TO_AGENT[mapping.role];
                const isPainPoint = mapping.painLevel >= 3;
                const isOwnerHandled = mapping.currentlyHandledBy === 'owner';
                
                return (
                  <div 
                    key={mapping.role}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      isPainPoint || isOwnerHandled
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {agent.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          {agent.name}
                          {(isPainPoint || isOwnerHandled) && (
                            <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                              Priority
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {HANDLED_BY_LABELS[mapping.currentlyHandledBy]}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Tier Summary */}
          <Card className="mb-8 border border-border bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recommended Plan</p>
                  <p className="text-xl font-bold text-foreground">{tierRec.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{tierRec.price}</p>
                  <p className="text-sm text-muted-foreground">
                    {tierRec.agentCount} agents • {tierRec.consoleCount} consoles
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onBack}>
              ← Back to Audit
            </Button>
            <Button onClick={() => setCurrentStep('path_selection')} className="gap-2">
              Choose Launch Path
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step: Path Selection
  if (currentStep === 'path_selection') {
    return (
      <LaunchPathSelector
        recommendedTier={recommendedTier}
        tierPrice={tierRec.price}
        onSelect={handlePathSelection}
        onBack={() => setCurrentStep('summary')}
      />
    );
  }

  // Step: Timeline (Self-Guided)
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            Self-Guided Launch
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-brand text-foreground mb-2">
            Your 14-Day Go-Live Timeline
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Follow this timeline to go live in 14 days. Complete tasks in order for the best results.
          </p>
        </div>

        {/* Timeline */}
        <GoLiveTimeline
          startDate={startDate}
          milestones={milestones}
        />

        {/* Start Button */}
        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleStartLaunch} className="gap-2">
            {user ? 'Go to Dashboard' : 'Create Account & Start'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Your progress will be saved and you can continue anytime.
          </p>
        </div>

        {/* Back */}
        <div className="text-center mt-4">
          <Button variant="ghost" onClick={() => setCurrentStep('path_selection')}>
            ← Back to Launch Path
          </Button>
        </div>
      </div>
    </div>
  );
}
