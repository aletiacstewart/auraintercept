import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Zap, 
  Calendar, 
  Settings, 
  Video, 
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LaunchPath = 'concierge' | 'self_guided';

interface LaunchPathSelectorProps {
  recommendedTier: string;
  tierPrice: string;
  onSelect: (path: LaunchPath) => void;
  onBack: () => void;
}

export function LaunchPathSelector({ 
  recommendedTier, 
  tierPrice, 
  onSelect, 
  onBack 
}: LaunchPathSelectorProps) {
  const isHighTier = ['PERFORMANCE', 'COMMAND'].includes(recommendedTier);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Step 3: Choose Your Launch Path
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-brand text-foreground mb-2">
            How would you like to get started?
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {isHighTier 
              ? "Your plan includes concierge onboarding. Choose how you'd like to launch."
              : "Get up and running with guided support or take the self-paced approach."
            }
          </p>
        </div>

        {/* Path Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Concierge Launch */}
          <Card 
            className={cn(
              "relative border-2 cursor-pointer transition-all hover:shadow-lg",
              isHighTier ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onClick={() => onSelect('concierge')}
          >
            {isHighTier && (
              <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground">
                Included with {tierPrice}
              </Badge>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-orange-500 text-white shadow-lg">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Concierge Launch</CardTitle>
                  {!isHighTier && (
                    <p className="text-sm text-muted-foreground">$500 one-time</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We do it for you. Our team handles all setup, testing, and launch.
              </p>
              
              <ul className="space-y-2">
                {[
                  { icon: Calendar, text: '45-minute kickoff call' },
                  { icon: Settings, text: 'We configure everything' },
                  { icon: Video, text: 'Test calls with you' },
                  { icon: CheckCircle2, text: 'Go live in 7-14 days' },
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.text}
                  </li>
                ))}
              </ul>

              <Button className="w-full gap-2 mt-4">
                Schedule Kickoff Call
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Self-Guided */}
          <Card 
            className="border-2 border-border cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            onClick={() => onSelect('self_guided')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-muted text-foreground shadow">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Self-Guided</CardTitle>
                  <p className="text-sm text-muted-foreground">Free</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set it up yourself with our 14-day guided timeline and video tutorials.
              </p>
              
              <ul className="space-y-2">
                {[
                  { icon: Calendar, text: '14-day launch timeline' },
                  { icon: Video, text: 'Step-by-step video guides' },
                  { icon: HelpCircle, text: 'In-app help & tooltips' },
                  { icon: CheckCircle2, text: 'Go live at your pace' },
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.text}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full gap-2 mt-4">
                Start Self-Guided Setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison */}
        <Card className="border border-border bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Time to Live</p>
                <div className="flex justify-around">
                  <div>
                    <p className="font-bold text-primary">7-14 days</p>
                    <p className="text-xs text-muted-foreground">Concierge</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">14-21 days</p>
                    <p className="text-xs text-muted-foreground">Self-Guided</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Your Effort</p>
                <div className="flex justify-around">
                  <div>
                    <p className="font-bold text-primary">2-3 hours</p>
                    <p className="text-xs text-muted-foreground">Concierge</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">8-12 hours</p>
                    <p className="text-xs text-muted-foreground">Self-Guided</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Support Level</p>
                <div className="flex justify-around">
                  <div>
                    <p className="font-bold text-primary">1:1 Calls</p>
                    <p className="text-xs text-muted-foreground">Concierge</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">In-App</p>
                    <p className="text-xs text-muted-foreground">Self-Guided</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Role Mapping
          </Button>
        </div>
      </div>
    </div>
  );
}
