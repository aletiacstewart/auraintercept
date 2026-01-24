import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  Route, 
  Receipt, 
  FileText, 
  Shield, 
  Megaphone, 
  UserCheck,
  Sparkles,
  MessageSquare,
  Phone,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AuraEventCardProps {
  event: {
    id: string;
    source_agent: string;
    target_agent: string | null;
    event_type: string;
    status: string;
    payload: any;
    created_at: string;
  };
}

const AGENT_CONFIG: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  booking: { icon: Calendar, label: 'Scheduling Agent', color: 'text-feature-appointments' },
  dispatch: { icon: Truck, label: 'Dispatch Agent', color: 'text-feature-fieldops' },
  route: { icon: Route, label: 'Route Agent', color: 'text-feature-fieldops' },
  invoice: { icon: Receipt, label: 'Billing Agent', color: 'text-feature-invoices' },
  quoting: { icon: FileText, label: 'Quoting Agent', color: 'text-feature-quotes' },
  warranty: { icon: Shield, label: 'Warranty Agent', color: 'text-feature-warranties' },
  campaign: { icon: Megaphone, label: 'Campaign Agent', color: 'text-feature-marketing' },
  followup: { icon: UserCheck, label: 'Follow-up Agent', color: 'text-secondary' },
  triage: { icon: MessageSquare, label: 'Triage Agent', color: 'text-primary' },
  admin: { icon: Phone, label: 'Admin Agent', color: 'text-accent' },
};

function getHumanizedMessage(event: AuraEventCardProps['event']): string {
  const { source_agent, event_type, payload } = event;
  const customerName = payload?.customer_name || payload?.customerName || 'a customer';
  const amount = payload?.amount || payload?.total || payload?.value;
  const service = payload?.service_type || payload?.serviceType || 'service';
  const techName = payload?.technician_name || payload?.technicianName || 'the technician';
  
  // Booking events
  if (source_agent === 'booking' || event_type.includes('booking') || event_type.includes('appointment')) {
    if (amount) {
      return `Aura just saved you time! Scheduling Agent booked a $${amount} ${service} for ${customerName}.`;
    }
    return `New appointment scheduled for ${customerName} - ${service}.`;
  }
  
  // Dispatch/Route events
  if (source_agent === 'dispatch' || source_agent === 'route' || event_type.includes('dispatch') || event_type.includes('route')) {
    return `Teamwork in action: Dispatch Agent optimized ${techName}'s route to beat the afternoon traffic.`;
  }
  
  // Invoice events
  if (source_agent === 'invoice' || event_type.includes('invoice') || event_type.includes('payment')) {
    if (amount) {
      return `Aura handled the follow-up: Billing Agent successfully cleared a $${amount.toLocaleString()} invoice while you were away.`;
    }
    return `Invoice processed for ${customerName}.`;
  }
  
  // Quote events
  if (source_agent === 'quoting' || event_type.includes('quote')) {
    if (amount) {
      return `New opportunity incoming: Quoting Agent prepared a $${amount.toLocaleString()} estimate for ${customerName}.`;
    }
    return `Quote generated for ${customerName}.`;
  }
  
  // Warranty events
  if (source_agent === 'warranty' || event_type.includes('warranty')) {
    return `Coverage secured: Warranty Agent registered a new protection plan for ${customerName}.`;
  }
  
  // Campaign events
  if (source_agent === 'campaign' || event_type.includes('campaign') || event_type.includes('marketing')) {
    return `Marketing in motion: Campaign Agent launched a new outreach to boost engagement.`;
  }
  
  // Follow-up events
  if (source_agent === 'followup' || event_type.includes('followup') || event_type.includes('follow-up')) {
    return `Staying connected: Follow-up Agent reached out to ${customerName} to ensure satisfaction.`;
  }
  
  // Default message
  const agentLabel = AGENT_CONFIG[source_agent]?.label || 'Aura';
  return `${agentLabel} completed: ${event_type.replace(/_/g, ' ')}.`;
}

function isHighValueEvent(event: AuraEventCardProps['event']): boolean {
  const { payload, event_type } = event;
  const amount = payload?.amount || payload?.total || payload?.value || 0;
  
  // Bookings over $300 or invoices over $500
  if (event_type.includes('booking') || event_type.includes('appointment')) {
    return amount >= 300;
  }
  if (event_type.includes('invoice') || event_type.includes('payment')) {
    return amount >= 500;
  }
  return false;
}

export function AuraEventCard({ event }: AuraEventCardProps) {
  const [showSparkle, setShowSparkle] = useState(false);
  const isHighValue = isHighValueEvent(event);
  const agentConfig = AGENT_CONFIG[event.source_agent] || AGENT_CONFIG.triage;
  const Icon = agentConfig.icon;
  const message = getHumanizedMessage(event);
  
  useEffect(() => {
    if (isHighValue) {
      setShowSparkle(true);
      const timer = setTimeout(() => setShowSparkle(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isHighValue, event.id]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "relative p-4 rounded-2xl border transition-all duration-300 animate-fade-in",
              "surface-elevated border-border/20 hover:border-secondary/30",
              "shadow-lg shadow-primary/5 cursor-default",
              showSparkle && "aura-sparkle-burst"
            )}
          >
            {/* Agent indicator with breathing animation */}
            <div className="flex items-start gap-3">
              <div className={cn(
                "relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                "bg-secondary/10 aura-breathing"
              )}>
                <Icon className={cn("h-5 w-5", agentConfig.color)} />
                {/* Active pulse ring */}
                <div className="absolute inset-0 rounded-full aura-pulse-ring" />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Agent label */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn("text-xs font-medium", agentConfig.color)}>
                    {agentConfig.label}
                  </span>
                  <span className="text-xs text-white/50">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                {/* Humanized message */}
                <p className="text-sm text-white/90 leading-relaxed">
                  {message}
                </p>
              </div>
              
              {/* High-value sparkle icon */}
              {isHighValue && (
                <Sparkles className={cn(
                  "h-5 w-5 text-warning flex-shrink-0",
                  showSparkle && "animate-pulse"
                )} />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs"
        >
          <p className="text-xs">
            {event.status === 'processed' 
              ? "This task was completed successfully! ✨"
              : event.status === 'processing'
              ? "Aura is actively working on this..."
              : "Waiting in queue to be handled."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
