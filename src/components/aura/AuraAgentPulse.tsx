import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Route, 
  Receipt, 
  FileText, 
  Megaphone, 
  UserCheck,
  MessageSquare,
  Phone,
  Truck,
  Package,
  BarChart3,
  TrendingUp,
  Users
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type AgentStatus = 'active' | 'learning' | 'interacting' | 'resting';

interface AuraAgentPulseProps {
  agentType: string;
  status: AgentStatus;
  currentActivity?: string;
  customerName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AGENT_CONFIG: Record<string, { icon: typeof Calendar; label: string }> = {
  booking: { icon: Calendar, label: 'Scheduling' },
  dispatch: { icon: Truck, label: 'Dispatch' },
  route: { icon: Route, label: 'Route' },
  invoice: { icon: Receipt, label: 'Billing' },
  quoting: { icon: FileText, label: 'Quoting' },
  campaign: { icon: Megaphone, label: 'Campaign' },
  followup: { icon: UserCheck, label: 'Follow-up' },
  triage: { icon: MessageSquare, label: 'Triage' },
  admin: { icon: Phone, label: 'Admin' },
  inventory: { icon: Package, label: 'Inventory' },
  analytics: { icon: BarChart3, label: 'Analytics' },
  insights: { icon: TrendingUp, label: 'Insights' },
  eta: { icon: Route, label: 'ETA' },
  checkin: { icon: Users, label: 'Check-in' },
};

const STATUS_CONFIG: Record<AgentStatus, { 
  label: string; 
  description: string; 
  colorClass: string;
  bgClass: string;
  ringClass: string;
}> = {
  active: { 
    label: 'Active', 
    description: 'Everything is running smoothly. We\'ve got this.',
    colorClass: 'text-aura-emerald',
    bgClass: 'bg-aura-emerald/20',
    ringClass: 'ring-aura-emerald/50'
  },
  learning: { 
    label: 'Learning Mode', 
    description: 'Aura is eager to help but needs a little more info on this topic.',
    colorClass: 'text-aura-curious',
    bgClass: 'bg-aura-curious/20',
    ringClass: 'ring-aura-curious/50'
  },
  interacting: { 
    label: 'Interacting', 
    description: 'A meaningful conversation is happening with a customer.',
    colorClass: 'text-aura-connection',
    bgClass: 'bg-aura-connection/20',
    ringClass: 'ring-aura-connection/50'
  },
  resting: { 
    label: 'Standing By', 
    description: 'Ready and waiting to help your next customer.',
    colorClass: 'text-aura-resting',
    bgClass: 'bg-aura-resting/20',
    ringClass: 'ring-aura-resting/50'
  },
};

const SIZE_CONFIG = {
  sm: { container: 'w-8 h-8', icon: 'h-4 w-4' },
  md: { container: 'w-10 h-10', icon: 'h-5 w-5' },
  lg: { container: 'w-12 h-12', icon: 'h-6 w-6' },
};

function getTooltipMessage(
  agentType: string, 
  status: AgentStatus, 
  customerName?: string,
  currentActivity?: string
): string {
  const agentLabel = AGENT_CONFIG[agentType]?.label || 'Agent';
  
  if (status === 'interacting' && customerName) {
    return `I'm currently chatting with ${customerName} to get their issue resolved!`;
  }
  
  if (status === 'active' && currentActivity) {
    return currentActivity;
  }
  
  if (status === 'learning') {
    return `${agentLabel} Agent needs a little more knowledge to handle this topic effectively.`;
  }
  
  if (status === 'active') {
    return `${agentLabel} Agent is processing tasks and keeping things running smoothly.`;
  }
  
  return `${agentLabel} Agent is ready and waiting to help your next customer!`;
}

export function AuraAgentPulse({ 
  agentType, 
  status, 
  currentActivity,
  customerName,
  showLabel = false,
  size = 'md'
}: AuraAgentPulseProps) {
  const agentConfig = AGENT_CONFIG[agentType] || AGENT_CONFIG.triage;
  const statusConfig = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = agentConfig.icon;
  const tooltipMessage = getTooltipMessage(agentType, status, customerName, currentActivity);
  
  const isAnimated = status === 'active' || status === 'interacting';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {/* Pulse container */}
            <div 
              className={cn(
                "relative rounded-full flex items-center justify-center transition-all duration-500",
                sizeConfig.container,
                statusConfig.bgClass,
                isAnimated && "aura-breathing"
              )}
            >
              <Icon className={cn(sizeConfig.icon, statusConfig.colorClass)} />
              
              {/* Breathing ring effect for active states */}
              {isAnimated && (
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full aura-pulse-ring",
                    statusConfig.ringClass
                  )} 
                />
              )}
              
              {/* Status dot */}
              <div 
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                  status === 'active' && "bg-aura-emerald",
                  status === 'learning' && "bg-aura-curious",
                  status === 'interacting' && "bg-aura-connection",
                  status === 'resting' && "bg-aura-resting"
                )}
              />
            </div>
            
            {/* Optional label */}
            {showLabel && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/90">
                  {agentConfig.label}
                </span>
                <span className={cn("text-xs", statusConfig.colorClass)}>
                  {statusConfig.label}
                </span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {agentConfig.label} Agent
            </p>
            <p className="text-xs text-muted-foreground">
              {tooltipMessage}
            </p>
            {status === 'learning' && (
              <p className="text-xs text-aura-curious mt-2">
                💡 Help Aura grow! Add knowledge to improve this agent.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
