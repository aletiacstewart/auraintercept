import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mic, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiCircleLogo from '@/assets/aura-intercept-logo.png';

export interface GlassHeaderProps {
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
  useDefaultLogo?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
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
  useDefaultLogo = false,
  showBackButton = false,
  onBackClick,
}) => {
  // Determine which logo to show
  const displayLogo = logoUrl || (useDefaultLogo ? aiCircleLogo : null);
  
  return (
    <div 
      className="p-3 text-white relative shrink-0"
      style={{
        background: 'rgba(2,8,18,0.97)',
        borderTop: '3px solid rgba(0,229,255,0.75)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(0,229,255,0.08), 0 0 40px rgba(0,229,255,0.04)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Back Button */}
          {showBackButton && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 hover:text-white hover:bg-white/20 rounded-full shrink-0"
              onClick={onBackClick}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Logo */}
          <div className="relative shrink-0">
            {rectangleLogo ? (
              <div className="h-12 px-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                {displayLogo && (
                  <img src={displayLogo} alt={companyName} className="h-10 object-contain" />
                )}
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                {displayLogo && (
                  <img src={displayLogo} alt={companyName} className="h-14 w-14 object-contain" />
                )}
              </div>
            )}
            {/* Online status indicator with ping ring */}
            <div className="absolute -bottom-0.5 -right-0.5">
              {isOnline && (
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
              <div className={cn(
                "relative h-3 w-3 rounded-full border-2 border-black/80",
                isOnline ? "bg-emerald-400" : "bg-gray-500"
              )} style={isOnline ? { boxShadow: '0 0 8px rgba(52,211,153,0.8)' } : {}} />
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm truncate" style={{ textShadow: '0 0 12px rgba(0,229,255,0.4)', letterSpacing: '0.02em' }}>{companyName}</h2>
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
              className="h-8 w-8 p-0 text-white/90 rounded-full transition-all duration-200"
              onClick={onPhoneClick}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'hsl(84,100%,60%)';
                el.style.background = 'hsl(84,100%,55%/0.12)';
                el.style.boxShadow = '0 0 14px hsl(84,100%,55%/0.45)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '';
                el.style.background = '';
                el.style.boxShadow = '';
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {showVoice && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-white/90 rounded-full transition-all duration-200"
              onClick={onVoiceClick}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'hsl(292,100%,75%)';
                el.style.background = 'hsl(292,100%,70%/0.12)';
                el.style.boxShadow = '0 0 14px hsl(292,100%,70%/0.45)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '';
                el.style.background = '';
                el.style.boxShadow = '';
              }}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
