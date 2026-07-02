import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mic, ArrowLeft, Radio } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import aiCircleLogo from '@/assets/aura-intercept-logo.png';
import { formatUptime } from '@/hooks/useCompanyUptime';

export interface GlassHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  agentLabel: string;
  agentColor?: string;
  agentBgColor?: string;
  showPhone?: boolean;
  showVoice?: boolean;
  onPhoneClick?: () => void;
  onVoiceClick?: () => void;
  isOnline?: boolean;
  rectangleLogo?: boolean;
  useDefaultLogo?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  subtitle?: string;
  showStatusChips?: boolean;
  companyCreatedAt?: string | null;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  companyName,
  logoUrl,
  agentLabel,
  showPhone,
  showVoice,
  onPhoneClick,
  onVoiceClick,
  isOnline = true,
  rectangleLogo = false,
  useDefaultLogo = false,
  showBackButton = false,
  onBackClick,
  subtitle,
  showStatusChips = true,
  companyCreatedAt,
}) => {
  const displayLogo = logoUrl || (useDefaultLogo ? aiCircleLogo : null);
  const [liveDateTime, setLiveDateTime] = useState({ date: '', time: '' });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = days[now.getDay()];
      const month = months[now.getMonth()];
      const date = now.getDate().toString().padStart(2, '0');
      const year = now.getFullYear();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setLiveDateTime({ date: `${day} · ${month} ${date}, ${year}`, time: `${h}:${m}:${s}` });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const uptimeDisplay = companyCreatedAt ? formatUptime(companyCreatedAt) : null;

  return (
    <div
      className="relative min-w-0 shrink-0 overflow-hidden p-3 text-white"
      style={{
        background: 'rgba(2,8,18,0.97)',
        borderTop: '3px solid rgba(0,229,255,0.75)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(0,229,255,0.08)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="relative flex min-w-0 items-center justify-between gap-2">
        {/* LEFT: Logo + Name */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {showBackButton && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-foreground hover:text-white hover:bg-white/20 rounded-full shrink-0"
                    onClick={onBackClick}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Go back</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div className="relative shrink-0">
            {rectangleLogo ? (
              <div className="h-10 px-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                {displayLogo && <img src={displayLogo} alt={companyName} className="h-8 object-contain" />}
              </div>
            ) : (
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.3)', boxShadow: '0 0 12px rgba(0,229,255,0.2)' }}
              >
                {displayLogo && <img src={displayLogo} alt={companyName} className="h-10 w-10 object-contain" />}
              </div>
            )}
            {/* Online ping */}
            <div className="absolute -bottom-0.5 -right-0.5">
              {isOnline && <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />}
              <div
                className={cn('relative h-3 w-3 rounded-full border-2 border-black/80', isOnline ? 'bg-emerald-400' : 'bg-gray-500')}
                style={isOnline ? { boxShadow: '0 0 8px rgba(52,211,153,0.8)' } : {}}
              />
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-xs uppercase tracking-wider truncate" style={{ textShadow: '0 0 12px rgba(0,229,255,0.5)', letterSpacing: '0.08em' }}>
              {companyName}
            </h2>
            <p className="text-[9px] text-cyan-400/70 uppercase tracking-widest truncate">
              {subtitle || agentLabel}
            </p>
          </div>
        </div>

        {/* RIGHT: Status chips + actions */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {showStatusChips && isOnline && (
            <>
              {/* DATE + LIVE TIME chip */}
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.35)', color: 'rgb(0,229,255)', boxShadow: '0 0 8px rgba(0,229,255,0.2)' }}
              >
                <Radio className="h-2.5 w-2.5 shrink-0" />
                <span>{liveDateTime.date} · {liveDateTime.time}</span>
              </div>
              {/* Mobile: time only */}
              <div
                className="hidden min-[400px]:flex sm:hidden items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.35)', color: 'rgb(0,229,255)', boxShadow: '0 0 8px rgba(0,229,255,0.2)' }}
              >
                <Radio className="h-2.5 w-2.5 shrink-0" />
                {liveDateTime.time}
              </div>
              {/* PLATFORM UPTIME chip — desktop only */}
              {uptimeDisplay && (
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.35)', color: 'rgb(52,211,153)', boxShadow: '0 0 8px rgba(52,211,153,0.2)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Online {uptimeDisplay}</span>
                </div>
              )}
              {/* Fallback: Portal Online when no uptime yet */}
              {!uptimeDisplay && (
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.35)', color: 'rgb(52,211,153)', boxShadow: '0 0 8px rgba(52,211,153,0.2)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Portal Online
                </div>
              )}
            </>
          )}

          <TooltipProvider delayDuration={200}>
          {showPhone && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-foreground rounded-full transition-all duration-200"
                  onClick={onPhoneClick}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = 'hsl(84,100%,60%)';
                    el.style.background = 'rgba(100,220,50,0.12)';
                    el.style.boxShadow = '0 0 14px rgba(100,220,50,0.45)';
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
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Start phone call</p></TooltipContent>
            </Tooltip>
          )}
          {showVoice && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-foreground rounded-full transition-all duration-200"
                  onClick={onVoiceClick}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = 'hsl(292,100%,75%)';
                    el.style.background = 'rgba(180,50,255,0.12)';
                    el.style.boxShadow = '0 0 14px rgba(180,50,255,0.45)';
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
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Voice input</p></TooltipContent>
            </Tooltip>
          )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
