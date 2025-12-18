import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  agentLabel: string;
  agentColor: string;
  agentBgColor: string;
  showPhone?: boolean;
  showVoice?: boolean;
  onPhoneClick?: () => void;
  onVoiceClick?: () => void;
  isOnline?: boolean;
  rectangleLogo?: boolean;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  companyName,
  logoUrl,
  agentLabel,
  agentColor,
  agentBgColor,
  showPhone,
  showVoice,
  onPhoneClick,
  onVoiceClick,
  isOnline = true,
  rectangleLogo = false,
}) => {
  return (
    <div className="glass-primary p-3 text-white relative shrink-0">
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Logo */}
          <div className="relative shrink-0">
            {rectangleLogo ? (
              <div className="h-12 px-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                {logoUrl && (
                  <img src={logoUrl} alt={companyName} className="h-10 object-contain" />
                )}
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                {logoUrl && (
                  <img src={logoUrl} alt={companyName} className="h-14 w-14 object-contain" />
                )}
              </div>
            )}
            {/* Online status indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
              isOnline ? "bg-green-400 pulse-dot" : "bg-gray-400"
            )} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm truncate">{companyName}</h2>
            <Badge 
              className={cn(
                'text-[10px] px-1.5 py-0 font-medium border-0 h-4',
                agentBgColor, 
                agentColor
              )}
            >
              {agentLabel}
            </Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {showPhone && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
              onClick={onPhoneClick}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {showVoice && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full"
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
