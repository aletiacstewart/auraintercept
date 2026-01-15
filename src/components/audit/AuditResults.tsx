import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Users, 
  Crown,
  TrendingUp,
  Clock,
  Phone
} from "lucide-react";
import { TierType, TierScores, TIER_RECOMMENDATIONS } from "./types";
import { useNavigate } from "react-router-dom";

interface AuditResultsProps {
  tierPercentages: TierScores;
  recommendedTier: TierType;
  onRestart: () => void;
}

const TIER_ICONS: Record<TierType, React.ReactNode> = {
  SINGLE_POINT: <Zap className="h-6 w-6" />,
  MULTI_TRACK: <Users className="h-6 w-6" />,
  COMMAND: <Crown className="h-6 w-6" />,
};

const TIER_COLORS: Record<TierType, string> = {
  SINGLE_POINT: 'from-blue-500 to-cyan-500',
  MULTI_TRACK: 'from-emerald-500 to-teal-500',
  COMMAND: 'from-primary to-orange-500',
};

const TIER_BG_COLORS: Record<TierType, string> = {
  SINGLE_POINT: 'bg-blue-50 border-blue-200',
  MULTI_TRACK: 'bg-emerald-50 border-emerald-200',
  COMMAND: 'bg-primary/10 border-primary/30',
};

export function AuditResults({ tierPercentages, recommendedTier, onRestart }: AuditResultsProps) {
  const navigate = useNavigate();
  const recommendation = TIER_RECOMMENDATIONS[recommendedTier];
  
  // Calculate estimated hours saved based on fit percentage
  const avgFit = tierPercentages[recommendedTier];
  const estimatedHoursSaved = Math.round((avgFit / 100) * 20); // Max 20 hrs/week

  const handleViewPricing = () => {
    navigate('/');
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleBookCall = () => {
    window.open('https://calendly.com/aura-intercept/implementation', '_blank');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Hero Result Card */}
        <Card className={`relative overflow-hidden mb-8 border-2 ${TIER_BG_COLORS[recommendedTier]}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${TIER_COLORS[recommendedTier]} opacity-5`} />
          <CardHeader className="text-center relative">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full bg-gradient-to-br ${TIER_COLORS[recommendedTier]} text-white shadow-lg`}>
                {TIER_ICONS[recommendedTier]}
              </div>
            </div>
            <Badge className="mx-auto mb-4 bg-white text-foreground/70 border border-border shadow-sm">
              Your Recommended Plan
            </Badge>
            <CardTitle className="text-3xl sm:text-4xl font-brand uppercase tracking-wider text-foreground">
              {recommendation.label}
            </CardTitle>
            <p className="text-xl font-semibold text-primary mt-2">
              {recommendation.price}
            </p>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              {recommendation.description}
            </p>
          </CardHeader>
          <CardContent className="relative">
            {/* Match Percentage Display */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md border border-border">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{tierPercentages[recommendedTier]}%</span>
                <span className="text-muted-foreground">Fit Score</span>
              </div>
            </div>

            {/* Estimated Impact */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              <div className="text-center p-5 rounded-xl bg-white/80 border border-border shadow-sm">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{estimatedHoursSaved}+</p>
                <p className="text-sm text-muted-foreground">Hours saved/week</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-white/80 border border-border shadow-sm">
                <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{recommendation.agentCount}</p>
                <p className="text-sm text-muted-foreground">AI Agents included</p>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-border shadow-sm">
              <h3 className="font-semibold mb-4 text-center text-foreground">What's Included</h3>
              <ul className="space-y-3">
                {recommendation.keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tier Comparison */}
        <Card className="mb-8 border border-border bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center text-foreground">
              Your Fit Score by Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(['SINGLE_POINT', 'MULTI_TRACK', 'COMMAND'] as TierType[]).map((tier) => {
              const tierRec = TIER_RECOMMENDATIONS[tier];
              const percentage = tierPercentages[tier];
              const isRecommended = tier === recommendedTier;
              
              return (
                <div 
                  key={tier} 
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isRecommended 
                      ? TIER_BG_COLORS[tier] 
                      : 'border-border bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isRecommended 
                          ? `bg-gradient-to-br ${TIER_COLORS[tier]} text-white shadow-sm` 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {TIER_ICONS[tier]}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-2 text-foreground">
                          {tierRec.label}
                          {isRecommended && (
                            <Badge variant="default" className="text-xs">
                              Best Match
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{tierRec.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{percentage}%</p>
                      <p className="text-xs text-muted-foreground">fit</p>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isRecommended ? '' : 'opacity-60'}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-card border-border">
          <CardContent className="pt-8 pb-8 text-center">
            <h3 className="text-xl font-bold mb-2 text-card-foreground">Ready to Automate?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started with a free trial or book an implementation call to discuss your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleViewPricing}
                className="gap-2"
              >
                View Full Pricing
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleBookCall}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Book Implementation Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Retake Button */}
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={onRestart} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retake Audit
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-lg mx-auto">
          This audit provides general recommendations based on your responses. 
          Actual results may vary based on your specific business operations and implementation.
          All plans include a 30-day free trial.
        </p>
      </div>
    </div>
  );
}
