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
  Star,
  Rocket,
  Download,
  FileText,
} from "lucide-react";
import { TierType, TierScores, TIER_RECOMMENDATIONS } from "./types";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { AuditChecklistPDF } from "./AuditChecklistPDF";
import { getIndustryContent } from "@/lib/industryMarketingContent";

interface AuditResultsProps {
  tierPercentages: TierScores;
  recommendedTier: TierType;
  onRestart: () => void;
  answers?: Record<string, string>;
  industryId?: string | null;
}

const TIER_ICONS: Record<TierType, React.ReactNode> = {
  CORE: <Zap className="h-6 w-6" />,
  BOOST: <Rocket className="h-6 w-6" />,
  PRO: <Users className="h-6 w-6" />,
  ELITE: <Crown className="h-6 w-6" />,
};

const TIER_COLORS: Record<TierType, string> = {
  CORE: 'from-blue-500 to-cyan-500',
  BOOST: 'from-violet-500 to-purple-500',
  PRO: 'from-emerald-500 to-teal-500',
  ELITE: 'from-primary to-orange-500',
};

const TIER_BG_COLORS: Record<TierType, string> = {
  CORE: 'bg-primary/5 border-primary/30',
  BOOST: 'bg-accent/10 border-accent/30',
  PRO: 'bg-emerald-500/10 border-emerald-500/30',
  ELITE: 'bg-primary/10 border-primary/40',
};

const TIER_ORDER: TierType[] = ['CORE', 'BOOST', 'PRO', 'ELITE'];

// ROI estimates by tier
const TIER_ROI_ESTIMATES: Record<TierType, { hoursSaved: number; leadsRecovered: number; revenueImpact: string }> = {
  CORE: { hoursSaved: 8, leadsRecovered: 4, revenueImpact: '$2,000-4,000' },
  BOOST: { hoursSaved: 15, leadsRecovered: 8, revenueImpact: '$6,000-12,000' },
  PRO: { hoursSaved: 30, leadsRecovered: 15, revenueImpact: '$15,000-30,000' },
  ELITE: { hoursSaved: 50, leadsRecovered: 25, revenueImpact: '$30,000-60,000' },
};

export function AuditResults({ tierPercentages, recommendedTier, onRestart, answers = {}, industryId = null }: AuditResultsProps) {
  const navigate = useNavigate();
  const recommendation = TIER_RECOMMENDATIONS[recommendedTier];
  const roiEstimate = TIER_ROI_ESTIMATES[recommendedTier];
  const fitScore = tierPercentages[recommendedTier];
  const industry = getIndustryContent(industryId);
  
  // Calculate scaled hours based on fit percentage
  const avgFit = tierPercentages[recommendedTier];
  const scaledHours = Math.round((avgFit / 100) * roiEstimate.hoursSaved);

  const handleViewPricing = () => {
    navigate('/');
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };


  // Get the next tier up for upgrade suggestion
  const currentTierIndex = TIER_ORDER.indexOf(recommendedTier);
  const nextTierUp = currentTierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIndex + 1] : null;
  const nextTierRec = nextTierUp ? TIER_RECOMMENDATIONS[nextTierUp] : null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Cyber dot-grid overlay */}
      <div className="absolute inset-0 cyber-dot-grid opacity-40 pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Results Hero Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
              style={{
                borderColor: "rgba(0,229,255,0.3)",
                background: "rgba(0,229,255,0.06)",
                color: "#7ef0ff",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              Audit Complete
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-brand uppercase tracking-tight mb-3"
            style={{
              background:
                "linear-gradient(135deg, #00F2FF 0%, #FFFFFF 45%, #00E5FF 70%, #00E5FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Your Aura Intercept Match
          </h1>
          <p className="text-muted-foreground">
            Recommended plan: <span className="text-cyan-300 font-semibold">{recommendation.label}</span>
          </p>
          {industryId && industryId !== 'other' && (
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
              <span>{industry.emoji}</span>
              <span>Tailored for {industry.label}</span>
            </p>
          )}
        </div>

        {/* Hero Result Card */}
        <Card
          className={`relative overflow-hidden mb-8 border-2 ${TIER_BG_COLORS[recommendedTier]}`}
          style={{
            boxShadow: "0 0 24px rgba(0,229,255,0.06)",
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${TIER_COLORS[recommendedTier]} opacity-5`} />
          <CardHeader className="text-center relative">
            <div className="flex justify-center mb-4">
              <div
                className={`p-4 rounded-full bg-gradient-to-br ${TIER_COLORS[recommendedTier]} text-white`}
                style={{ boxShadow: "0 0 30px rgba(0,229,255,0.35)" }}
              >
                {TIER_ICONS[recommendedTier]}
              </div>
            </div>
            <Badge className="mx-auto mb-4 bg-card text-card-foreground border border-border shadow-sm">
              Your Recommended Plan
            </Badge>
            <CardTitle className="text-3xl sm:text-4xl font-brand uppercase tracking-wider text-foreground">
              {recommendation.label}
            </CardTitle>
            <p className="text-xl font-semibold text-primary mt-2">
              {recommendation.price}
            </p>
            <p className="text-sm text-muted-foreground">
              {recommendation.employeeLimit} • {recommendation.implementationFee} implementation
            </p>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              {recommendation.description}
            </p>
          </CardHeader>
          <CardContent className="relative">
            {/* Match Percentage Display */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-3 bg-card rounded-full px-6 py-3 border border-[rgba(0,229,255,0.18)]"
                style={{ boxShadow: "0 0 24px rgba(0,229,255,0.06)" }}
              >
                <TrendingUp className="h-5 w-5 text-cyan-300" />
                <span className="text-2xl font-bold text-foreground">{tierPercentages[recommendedTier]}%</span>
                <span className="text-muted-foreground">Fit Score</span>
              </div>
            </div>

            {/* Estimated Impact - 3 columns */}
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
              <div
                className="text-center p-4 rounded-xl bg-card/60 border border-[rgba(0,229,255,0.18)]"
                style={{ boxShadow: "0 0 24px rgba(0,229,255,0.06)" }}
              >
                <Clock className="h-5 w-5 mx-auto mb-2 text-cyan-300" />
                <p className="text-xl font-bold text-foreground">{scaledHours}+</p>
                <p className="text-xs text-muted-foreground">Hours saved/week</p>
              </div>
              <div
                className="text-center p-4 rounded-xl bg-card/60 border border-[rgba(0,229,255,0.18)]"
                style={{ boxShadow: "0 0 24px rgba(0,229,255,0.06)" }}
              >
                <Zap className="h-5 w-5 mx-auto mb-2 text-cyan-300" />
                <p className="text-xl font-bold text-foreground">{recommendation.agentCount}</p>
                <p className="text-xs text-muted-foreground">AI Operatives</p>
              </div>
              <div
                className="text-center p-4 rounded-xl bg-card/60 border border-[rgba(0,229,255,0.18)]"
                style={{ boxShadow: "0 0 24px rgba(0,229,255,0.06)" }}
              >
                <Star className="h-5 w-5 mx-auto mb-2 text-cyan-300" />
                <p className="text-xl font-bold text-foreground">{recommendation.consoleCount}</p>
                <p className="text-xs text-muted-foreground">Control Centers</p>
              </div>
            </div>

            {/* ROI Estimate */}
            <div
              className="bg-card rounded-xl p-4 mb-6 border border-[rgba(0,229,255,0.18)]"
              style={{ boxShadow: "0 0 24px rgba(0,229,255,0.06)" }}
            >
              <h3 className="font-semibold mb-3 text-center text-foreground text-sm uppercase tracking-wide">
                Estimated Monthly Impact
              </h3>
              <div className="flex justify-center items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-foreground">{roiEstimate.leadsRecovered}</p>
                  <p className="text-xs text-muted-foreground">Leads recovered</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="font-bold text-emerald-400">{roiEstimate.revenueImpact}</p>
                  <p className="text-xs text-muted-foreground">Revenue impact/mo</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div
              className="bg-card rounded-xl p-6 mb-6 border border-[rgba(0,229,255,0.18)]"
              style={{ boxShadow: "0 0 24px rgba(0,229,255,0.06)" }}
            >
              <h3 className="font-semibold mb-4 text-center text-foreground">What's Included</h3>
              <ul className="space-y-3">
                {recommendation.keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade Consideration */}
            {nextTierUp && nextTierRec && (
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <h4 className="font-semibold text-sm mb-2 text-foreground">
                  Consider {nextTierRec.label} ({nextTierRec.price})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Upgrade to unlock {nextTierRec.agentCount - recommendation.agentCount} more AI Operatives 
                  {nextTierRec.consoleCount - recommendation.consoleCount > 0 
                    ? ` and ${nextTierRec.consoleCount - recommendation.consoleCount} additional Control Centers`
                    : ''} for enhanced automation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4-Tier Comparison */}
        <Card className="mb-8 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center text-foreground">
              Your Fit Score Across All Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {TIER_ORDER.map((tier) => {
              const tierRec = TIER_RECOMMENDATIONS[tier];
              const percentage = tierPercentages[tier];
              const isRecommended = tier === recommendedTier;
              
              return (
                <div 
                  key={tier} 
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isRecommended 
                      ? TIER_BG_COLORS[tier] 
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isRecommended 
                          ? `bg-gradient-to-br ${TIER_COLORS[tier]} text-white shadow-sm` 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {TIER_ICONS[tier]}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-2 text-foreground text-sm">
                          {tierRec.label}
                          {isRecommended && (
                            <Badge variant="default" className="text-xs">
                              Best Match
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tierRec.price} • {tierRec.agentCount} operatives • {tierRec.consoleCount} consoles
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">{percentage}%</p>
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

        {/* Download Setup Checklist PDF */}
        <Card className="mb-8 border-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary text-primary-foreground shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Download Your Personalized Setup Checklist
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  An 8-page PDF tailored to your {recommendation.label} plan and your answers — share it with partners, decision makers, or your team.
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>What's included in your plan</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Documents to gather before you launch</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Third-party setups required for your tier</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Your phone setup path (port, new, or forward)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>30-day guided launch roadmap</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Side-by-side comparison of all 4 plans</span>
                  </li>
                </ul>
                <PDFDownloadLink
                  document={
                    <AuditChecklistPDF
                      recommendedTier={recommendedTier}
                      fitScore={fitScore}
                      answers={answers}
                      industryId={industryId}
                    />
                  }
                  fileName={`aura-setup-plan-${industryId && industryId !== 'other' ? `${industryId}-` : ''}${recommendation.label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`}
                >
                  {({ loading }) => (
                    <Button size="lg" className="gap-2" disabled={loading}>
                      <Download className="h-4 w-4" />
                      {loading ? 'Preparing your PDF...' : 'Download Setup Checklist (PDF)'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-card border-border">
          <CardContent className="pt-8 pb-8 text-center">
            <h3 className="text-xl font-bold mb-2 text-card-foreground">Ready to Deploy Your AI Workforce?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start your 30-day guided launch and we'll set up your AI workforce with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleViewPricing}
                className="gap-2"
              >
                Start Your 30-Day Launch
                <ArrowRight className="h-4 w-4" />
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
          All plans include a 60-Day Live Trial — the first 30 days are dedicated to onboarding, then 30 days of full live use. One-time onboarding fees (50% of beta monthly, due at start of trial): $249 (Core), $497 (Boost), $994 (Pro), $1,990 (Elite).
        </p>
      </div>
    </div>
  );
}
