import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Crown, Check, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TIER_AGENT_CONFIG } from '@/lib/subscriptionAgentConfig';

const AGENT_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  followup: 'Follow-up Agent',
  review: 'Review Agent',
  booking: 'Scheduling Agent',
  dispatch: 'Dispatch Agent',
  route: 'Route Agent',
  eta: 'ETA Agent',
  checkin: 'Check-in Agent',
  quoting: 'Quoting Agent',
  invoice: 'Invoice Agent',
  admin: 'Admin Agent',
  inventory: 'Inventory Agent',
  warranty: 'Warranty Agent',
  campaign: 'Campaign Agent',
  lead: 'Lead Agent',
  promo: 'Promo Agent',
  social_content: 'Signal Creator',
  social_scheduler: 'Signal Scheduler',
  social_analytics: 'Signal Analytics',
  insights: 'Insights Agent',
  performance: 'Performance Agent',
  revenue: 'Revenue Agent',
  forecast: 'Forecast Agent',
  analytics: 'Analytics Agent',
};

const CONSOLE_NAMES: Record<string, string> = {
  customer_portal: 'Customer Portal',
  field_operations: 'Field Operations',
  business_management: 'Business Management',
  marketing_sales: 'Marketing & Sales',
  social_media: 'Social Signal',
  analytics_reports: 'Analytics & Reports',
};

interface TierCardProps {
  tier: 'core' | 'single_point' | 'multi_track' | 'command';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  upgradeFrom?: {
    tier: string;
    priceDiff: number;
  };
  additionalFeatures?: string[];
}

const TierCard: React.FC<TierCardProps> = ({ 
  tier, 
  icon, 
  color, 
  bgColor, 
  borderColor,
  upgradeFrom,
  additionalFeatures = []
}) => {
  const config = TIER_AGENT_CONFIG[tier];
  const navigate = useNavigate();
  
  return (
    <Card className={`${bgColor} ${borderColor} border-2`}>
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
        {/* Additional Features (for Core tier or included add-ons) */}
        {additionalFeatures.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Included Features
            </h4>
            <div className="space-y-1">
              {additionalFeatures.map(feature => (
                <div key={feature} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agents */}
        {config.agents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-1">
              <Zap className="h-4 w-4" />
              AI Operatives ({config.agents.length})
            </h4>
            <div className="grid grid-cols-2 gap-1">
              {config.agents.slice(0, 8).map(agent => (
                <div key={agent} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="truncate">{AGENT_NAMES[agent] || agent}</span>
                </div>
              ))}
              {config.agents.length > 8 && (
                <div className="text-xs text-primary">
                  +{config.agents.length - 8} more operatives
                </div>
              )}
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
      <h3 className="text-lg font-semibold text-card-foreground">Upgrade Paths & Cost Implications</h3>
      <p className="text-sm text-muted-foreground">
        See what each tier unlocks and the incremental cost to upgrade.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TierCard
          tier="core"
          icon={<MessageSquare className="h-5 w-5 text-emerald-400" />}
          color="text-emerald-400"
          bgColor="bg-emerald-950/30"
          borderColor="border-emerald-600/50"
          additionalFeatures={[
            'Talk to Aura',
            'Social Signal',
            'Web Presence (1pg)',
            '2 Employee Accounts',
          ]}
        />
        
        <TierCard
          tier="single_point"
          icon={<Zap className="h-5 w-5 text-amber-400" />}
          color="text-amber-400"
          bgColor="bg-amber-950/30"
          borderColor="border-amber-600/50"
          upgradeFrom={{ tier: 'Core', priceDiff: 1000 }}
        />
        
        <TierCard
          tier="multi_track"
          icon={<Users className="h-5 w-5 text-sky-400" />}
          color="text-sky-400"
          bgColor="bg-sky-950/30"
          borderColor="border-sky-600/50"
          upgradeFrom={{ tier: 'Single-Point', priceDiff: 2497 }}
          additionalFeatures={[
            'Social Signal',
            'Web Presence (1pg)',
          ]}
        />
        
        <TierCard
          tier="command"
          icon={<Crown className="h-5 w-5 text-violet-400" />}
          color="text-violet-400"
          bgColor="bg-violet-950/30"
          borderColor="border-violet-600/50"
          upgradeFrom={{ tier: 'Multi-Track', priceDiff: 3000 }}
          additionalFeatures={[
            'Social Signal',
            'Web Presence (1pg)',
          ]}
        />
      </div>

      {/* Upgrade Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600">Core</Badge>
              <span className="text-muted-foreground">$500/mo</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600">Single-Point</Badge>
              <span className="text-muted-foreground">$1,500/mo</span>
              <span className="text-emerald-400">(+$1,000)</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Badge className="bg-sky-600">Multi-Track</Badge>
              <span className="text-muted-foreground">$3,997/mo</span>
              <span className="text-emerald-400">(+$2,497)</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-600">Command</Badge>
              <span className="text-muted-foreground">$6,997/mo</span>
              <span className="text-emerald-400">(+$3,000)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TierComparisonCards;
