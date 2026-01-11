import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Headphones, 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Truck,
  MessageSquare,
  Star,
  BarChart3
} from "lucide-react";
import type { Scores, ScoreCategory } from "./types";
import { AGENT_RECOMMENDATIONS, CATEGORY_LABELS, CATEGORY_MAX_SCORES } from "./types";
import { cn } from "@/lib/utils";

interface AuditResultsProps {
  scores: Scores;
  onRestart: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones,
  Calendar,
  Users,
  BookOpen,
  Truck,
  MessageSquare,
  Star,
  BarChart3
};

export function AuditResults({ scores, onRestart }: AuditResultsProps) {
  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const hoursSaved = Math.round(totalScore * 0.5);
  
  // Find top priority agent
  const scoredAgents = AGENT_RECOMMENDATIONS.map(agent => ({
    ...agent,
    score: scores[agent.category],
    meetsThreshold: scores[agent.category] >= agent.threshold
  })).sort((a, b) => b.score - a.score);
  
  const topAgent = scoredAgents[0];
  const qualifiedAgents = scoredAgents.filter(a => a.meetsThreshold);
  
  // Calculate max possible score from all categories
  const maxPossibleScore = Object.values(CATEGORY_MAX_SCORES).reduce((sum, val) => sum + val, 0);
  const overallPercentage = Math.round((totalScore / maxPossibleScore) * 100);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Result Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="text-center pb-2 relative">
          <Badge variant="secondary" className="mx-auto mb-4 px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Audit Complete
          </Badge>
          <CardTitle className="text-3xl sm:text-4xl">
            Your AI Opportunity Score
          </CardTitle>
          <CardDescription className="text-lg">
            Based on your responses, here's where AI agents can transform your operations
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative">
              <div className="text-6xl sm:text-7xl font-bold text-primary">
                {totalScore}
              </div>
              <div className="text-white/80 text-center mt-1">
                out of {maxPossibleScore} points
              </div>
            </div>
            
            <div className="w-full max-w-md mt-6">
              <Progress value={overallPercentage} className="h-3" />
            </div>
            
            <div className="flex items-center gap-2 mt-6 p-4 rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">
                ~{hoursSaved} hours/week
              </span>
              <span className="text-white/80">potential time savings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Priority Agent */}
      {topAgent && (
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                Top Priority
              </Badge>
            </div>
            <div className="flex items-start gap-4">
              {(() => {
                const IconComponent = ICON_MAP[topAgent.icon];
                return IconComponent ? (
                  <div className="p-3 rounded-xl bg-primary/10">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                ) : null;
              })()}
              <div>
                <CardTitle className="text-2xl">{topAgent.title}</CardTitle>
                <CardDescription className="text-base mt-1 text-white/80">
                  Score: {topAgent.score} points in {CATEGORY_LABELS[topAgent.category]}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-destructive mb-1">Why This Matters:</h4>
              <p className="text-white/90">{topAgent.why}</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-1">The Impact:</h4>
              <p className="text-white/90">{topAgent.impact}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown by Category</CardTitle>
          <CardDescription className="text-white/80">
            See how your business scored in each automation opportunity area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(scores) as ScoreCategory[]).map((category) => {
            const agent = AGENT_RECOMMENDATIONS.find(a => a.category === category);
            const maxScore = CATEGORY_MAX_SCORES[category];
            const percentage = Math.round((scores[category] / maxScore) * 100);
            const meetsThreshold = agent && scores[category] >= agent.threshold;
            
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                    {meetsThreshold && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm text-white/80">
                    {scores[category]} / {maxScore}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={cn("h-2", meetsThreshold && "bg-primary/20")} 
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Other Recommended Agents */}
      {qualifiedAgents.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Agent Recommendations</CardTitle>
            <CardDescription>
              Based on your scores, these agents would also benefit your operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qualifiedAgents.slice(1).map((agent) => {
              const IconComponent = ICON_MAP[agent.icon];
              return (
                <div 
                  key={agent.category}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card/50"
                >
                  {IconComponent && (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{agent.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {agent.score} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {agent.impact}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* CTA Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-card border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready to Automate?</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Our team will walk you through exactly how these AI agents integrate 
              with your existing systems and provide a custom implementation roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" className="gap-2">
                Book Implementation Call
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onRestart} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake Audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
