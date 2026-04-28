import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Crown, Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TIER_AGENT_CONFIG, type SubscriptionTier } from '@/lib/subscriptionAgentConfig';

const AGENT_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Booking Agent',
  followup: 'Follow-Up Agent',
  review: 'Review Agent',
  creative_content: 'Creative Content',
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  outreach: 'Outreach Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-In Agent',
  marketing: 'Marketing Agent',
  web_presence: 'Web Presence',
  social_scheduler: 'Social Scheduler Agent',
  social_analytics: 'Social Analytics',
  admin: 'Admin Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  inventory: 'Inventory Agent',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
};

const CONSOLE_NAMES: Record<string, string> = {
  customer_portal: 'Customer Portal',
  field_operations: 'Field Operations',
  business_management: 'Business Management',
  marketing_sales: 'Outreach & Sales Console',
  social_media: 'Social Media',
  creative_web_presence: 'Creative & Web Presence',
  analytics_reports: 'Analytics & Reports',
  ai_operatives_hub: 'AI Operatives Hub',
};

interface TierCardProps {
  tier: SubscriptionTier;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  upgradeFrom?: {
    tier: string;
    priceDiff: number;
  };
  highlighted?: boolean;
}

const TierCard: React.FC<TierCardProps> = ({
  tier,
  icon,
  color,
  bgColor,
  borderColor,
  upgradeFrom,
  highlighted = false,
}) => {
  const config = TIER_AGENT_CONFIG[tier];
  const navigate = useNavigate();

  return (
    <Card className={`${bgColor} ${borderColor} border-2 relative ${highlighted ? 'ring-2 ring-primary' : ''}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className={`text-xl ${color}`}>{config.label}</CardTitle>
          </div>
          <Badge className={`${color.replace('text-', 'bg-').replace('-400', '-600')} text-white`}>
            {config.price}
          </Badge>
        </div>
        {upgradeFrom && (
          <p className="text-sm text-muted-foreground mt-1">
            +${upgradeFrom.priceDiff.toLocaleString()}/mo from {upgradeFrom.tier}
          </p>
        )}
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agents */}
        {config.agents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-1">
              <Zap className="h-4 w-4" />
              AI Operatives ({config.agents.length})
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {config.agents.map(agent => (
                <div key={agent} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="truncate">{AGENT_NAMES[agent] || agent}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consoles */}
        {config.consoles.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Control Centers ({config.consoles.length})
            </h4>
            <div className="space-y-1">
              {config.consoles.map(console => (
                <div key={console} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>{CONSOLE_NAMES[console] || console}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full mt-4"
          variant="outline"
          onClick={() => navigate('/dashboard/subscription')}
        >
          View Full Details
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

const TierComparisonCards: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-card-foreground">Subscription Tiers & Upgrade Paths</h3>
      <p className="text-sm text-muted-foreground">
        See what each tier unlocks and the incremental cost to upgrade.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <TierCard
          tier="starter"
          icon={<Star className="h-5 w-5 text-teal-400" />}
          color="text-teal-400"
          bgColor="bg-teal-950/30"
          borderColor="border-teal-600/50"
        />

        <TierCard
          tier="connect"
          icon={<Zap className="h-5 w-5 text-sky-400" />}
          color="text-sky-400"
          bgColor="bg-sky-950/30"
          borderColor="border-sky-600/50"
          upgradeFrom={{ tier: 'Aura Core', priceDiff: 300 }}
          highlighted
        />

        <TierCard
          tier="performance"
          icon={<Crown className="h-5 w-5 text-purple-400" />}
          color="text-purple-400"
          bgColor="bg-purple-950/30"
          borderColor="border-purple-600/50"
          upgradeFrom={{ tier: 'Aura Boost', priceDiff: 500 }}
        />

        <TierCard
          tier="command"
          icon={<Crown className="h-5 w-5 text-amber-400" />}
          color="text-amber-400"
          bgColor="bg-amber-950/30"
          borderColor="border-amber-600/50"
          upgradeFrom={{ tier: 'Aura Pro', priceDiff: 1000 }}
        />
      </div>

      {/* Upgrade Summary */}
      <Card className="surface-elevated border-border/50">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-600">Starter</Badge>
              <span className="text-muted-foreground text-xs">$197 · 8</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Badge className="bg-sky-600">Connect</Badge>
              <span className="text-muted-foreground text-xs">$497 · 12</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600">Performance</Badge>
              <span className="text-muted-foreground text-xs">$997 · 16</span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600">Command</Badge>
              <span className="text-muted-foreground text-xs">$1,997 · 24</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TierComparisonCards;
