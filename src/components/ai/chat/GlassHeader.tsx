import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mic, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  logoFallback?: React.ReactNode;
  agentLabel: string;
  agentColor: string;
  agentBgColor: string;
  showPhone?: boolean;
  showVoice?: boolean;
  onPhoneClick?: () => void;
  onVoiceClick?: () => void;
  isOnline?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  companyName,
  logoUrl,
  logoFallback,
  agentLabel,
  agentColor,
  agentBgColor,
  showPhone,
  showVoice,
  onPhoneClick,
  onVoiceClick,
  isOnline = true,
}) => {
  return (
    <div className="glass-primary p-3 sm:p-4 text-white relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 tech-grid opacity-10" />
      
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo with glow effect */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden glow-primary">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
              ) : (
                logoFallback || <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              )}
            </div>
            {/* Online status indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
              isOnline ? "bg-green-400 pulse-dot" : "bg-gray-400"
            )} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm sm:text-base truncate">{companyName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge 
                className={cn(
                  'text-[10px] sm:text-xs px-2 py-0.5 font-medium border-0',
                  agentBgColor, 
                  agentColor
                )}
              >
                <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                {agentLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {showPhone && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
              onClick={onPhoneClick}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {showVoice && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
              onClick={onVoiceClick}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
