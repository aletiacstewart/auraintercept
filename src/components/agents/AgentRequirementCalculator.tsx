import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, ArrowRight, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { 
  AGENT_DEPENDENCIES, 
  getRequiredTierForAgent,
  TIER_AGENT_CONFIG,
  SubscriptionTier 
} from '@/lib/subscriptionAgentConfig';

// Agent display names and descriptions
const AGENT_INFO: Record<string, { name: string; description: string; icon: string }> = {
  triage: { name: 'AI Receptionist', description: 'Core intake & call routing', icon: '🎧' },
  followup: { name: 'Follow-up Agent', description: 'Customer callbacks & engagement', icon: '📞' },
  review: { name: 'Review Agent', description: 'Reputation management', icon: '⭐' },
  booking: { name: 'Booking Agent', description: 'Online appointment booking', icon: '📅' },
  dispatch: { name: 'Dispatch/GPS Console', description: 'Job assignment & coordination', icon: '🚚' },
  route: { name: 'Route Agent', description: 'Optimal route planning', icon: '🗺️' },
  eta: { name: 'ETA Agent', description: 'Arrival time tracking', icon: '⏱️' },
  checkin: { name: 'Check-in Agent', description: 'Job status updates', icon: '✅' },
  quoting: { name: 'Quoting Agent', description: 'Estimate creation', icon: '💼' },
  invoice: { name: 'Invoice Agent', description: 'Billing automation', icon: '💳' },
  admin: { name: 'Admin Agent', description: 'Business management', icon: '👔' },
  inventory: { name: 'Inventory Agent', description: 'Stock tracking', icon: '📦' },
  campaign: { name: 'Campaign Agent', description: 'Marketing automation', icon: '📣' },
  marketing: { name: 'Lead Agent', description: 'Lead qualification', icon: '🎯' },
  lead: { name: 'Lead Agent', description: 'Lead qualification', icon: '🎯' },
  social_content: { name: 'Social Content', description: 'Content creation', icon: '✏️' },
  social_scheduler: { name: 'Social Scheduler', description: 'Post scheduling', icon: '📆' },
  social_analytics: { name: 'Social Analytics', description: 'Engagement metrics', icon: '📊' },
  creative: { name: 'Creative Agent', description: 'Content generation', icon: '🎨' },
  web_presence: { name: 'Web Presence Agent', description: 'Website management', icon: '🌐' },
  insights: { name: 'Insights Agent', description: 'Business intelligence', icon: '💡' },
  performance: { name: 'Performance Agent', description: 'KPI tracking', icon: '📈' },
  revenue: { name: 'Revenue Agent', description: 'Financial analysis', icon: '💰' },
  forecast: { name: 'Forecast Agent', description: 'Predictive analytics', icon: '🔮' },
  analytics: { name: 'Analytics Agent', description: 'Data analysis', icon: '📊' },
};

// 4-TIER STRUCTURE
const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'bg-slate-600',
  starter: 'bg-teal-500',
  connect: 'bg-sky-500',
  performance: 'bg-purple-600',
  command: 'bg-amber-600',
};

const TIER_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 497,
  connect: 897,
  performance: 1797,
  command: 2997,
};

const AgentRequirementCalculator: React.FC = () => {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());

  // Get all unique agents from the config
  const allAgents = useMemo(() => {
    const agents = new Set<string>();
    Object.values(TIER_AGENT_CONFIG).forEach(config => {
      config.agents.forEach(agent => agents.add(agent));
    });
    return Array.from(agents).filter(a => AGENT_INFO[a]);
  }, []);

  // Calculate required agents including dependencies
  const calculateRequirements = useMemo(() => {
    const required = new Set<string>();
    const processAgent = (agent: string) => {
      if (required.has(agent)) return;
      required.add(agent);
      const deps = AGENT_DEPENDENCIES[agent] || [];
      deps.forEach(dep => processAgent(dep));
    };
    
    selectedAgents.forEach(agent => processAgent(agent));
    return required;
  }, [selectedAgents]);

  // Determine minimum tier needed
  const minimumTier = useMemo(() => {
    let maxTier: SubscriptionTier = 'free';
    calculateRequirements.forEach(agent => {
      const tierNeeded = getRequiredTierForAgent(agent);
      if (tierNeeded) {
        const tierOrder: SubscriptionTier[] = ['free', 'starter', 'connect', 'performance', 'command'];
        if (tierOrder.indexOf(tierNeeded) > tierOrder.indexOf(maxTier)) {
          maxTier = tierNeeded;
        }
      }
    });
    return maxTier;
  }, [calculateRequirements]);

  const toggleAgent = (agent: string) => {
    const newSet = new Set(selectedAgents);
    if (newSet.has(agent)) {
      newSet.delete(agent);
    } else {
      newSet.add(agent);
    }
    setSelectedAgents(newSet);
  };

  const clearSelection = () => setSelectedAgents(new Set());

  // Group agents by tier for display
  const agentsByTier = useMemo(() => {
    const grouped: Record<SubscriptionTier, string[]> = {
      free: [],
      starter: [],
      connect: [],
      performance: [],
      command: [],
    };
    
    allAgents.forEach(agent => {
      const tier = getRequiredTierForAgent(agent);
      if (tier) grouped[tier].push(agent);
    });
    
    return grouped;
  }, [allAgents]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Calculator className="h-5 w-5 text-primary" />
          What Do I Need? Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select the agents you want, and we'll show you all required prerequisites and the minimum tier needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Selection Grid */}
        <div className="space-y-4">
          {(['connect', 'performance', 'command'] as SubscriptionTier[]).map(tier => (
            agentsByTier[tier].length > 0 && (
              <div key={tier} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${TIER_COLORS[tier]} text-white`}>
                    {TIER_AGENT_CONFIG[tier].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {TIER_AGENT_CONFIG[tier].price}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {agentsByTier[tier].map(agent => {
                    const info = AGENT_INFO[agent];
                    if (!info) return null;
                    const isSelected = selectedAgents.has(agent);
                    const isRequired = calculateRequirements.has(agent) && !isSelected;
                    
                    return (
                      <div
                        key={agent}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                          ${isSelected 
                            ? 'bg-primary/20 border-primary' 
                            : isRequired 
                              ? 'bg-amber-500/10 border-amber-500/50' 
                              : 'bg-card hover:bg-accent border-border'
                          }
                        `}
                        onClick={() => toggleAgent(agent)}
                      >
                        <Checkbox 
                          checked={isSelected || isRequired}
                          className={isRequired ? 'border-amber-500 data-[state=checked]:bg-amber-500' : ''}
                        />
                        <span className="text-lg">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {info.name}
                          </p>
                          {isRequired && (
                            <p className="text-xs text-amber-500">Required dependency</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Results Panel */}
        {selectedAgents.size > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-card-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Your Requirements
              </h4>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {/* Selected Agents */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">You Selected:</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(selectedAgents).map(agent => (
                    <Badge key={agent} variant="secondary" className="text-xs">
                      {AGENT_INFO[agent]?.icon} {AGENT_INFO[agent]?.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Required Dependencies */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Also Required:
                </p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(calculateRequirements)
                    .filter(a => !selectedAgents.has(a))
                    .map(agent => (
                      <Badge key={agent} variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                        {AGENT_INFO[agent]?.icon} {AGENT_INFO[agent]?.name}
                      </Badge>
                    ))
                  }
                  {Array.from(calculateRequirements).filter(a => !selectedAgents.has(a)).length === 0 && (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              {/* Tier & Cost */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Minimum Tier Required:</p>
                <div className="flex items-center gap-2">
                  <Badge className={`${TIER_COLORS[minimumTier]} text-white text-lg px-3 py-1`}>
                    {TIER_AGENT_CONFIG[minimumTier].label}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-primary">
                    ${TIER_PRICES[minimumTier]}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Total Agents Count */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Total agents included at this tier: {' '}
                <span className="font-semibold text-card-foreground">
                  {TIER_AGENT_CONFIG[minimumTier].agents.length} agents
                </span>
              </p>
            </div>
          </div>
        )}

        {selectedAgents.size === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select agents above to see requirements and pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentRequirementCalculator;
