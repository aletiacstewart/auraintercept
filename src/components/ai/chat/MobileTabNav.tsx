import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
  featureColor?: string;
}

interface MobileTabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onHomeClick?: () => void;
}

const featureGlowMap: Record<string, string> = {
  'text-feature-overview':     '189,100%,65%',
  'text-feature-config':       '221,100%,65%',
  'text-feature-platform':     '189,100%,55%',
  'text-feature-fieldops':     '84,100%,55%',
  'text-feature-customers':    '38,100%,65%',
  'text-feature-employees':    '173,100%,55%',
  'text-feature-analytics':    '223,100%,65%',
  'text-feature-marketing':    '292,100%,70%',
  'text-feature-integrations': '282,80%,70%',
  'text-feature-quotes':       '48,100%,65%',
  'text-primary':              '189,100%,55%',
};

export const MobileTabNav: React.FC<MobileTabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onHomeClick,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFade = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateFade();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateFade, { passive: true });
    window.addEventListener('resize', updateFade);
    return () => {
      el.removeEventListener('scroll', updateFade);
      window.removeEventListener('resize', updateFade);
    };
  }, [tabs.length]);

  useEffect(() => {
    const btn = tabRefs.current[activeTab];
    if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    // If clicking on home/chat tab, trigger home reset callback
    if (tabId === 'chat' && onHomeClick) {
      onHomeClick();
    }
    onTabChange(tabId);
  };

  return (
    <div className="shrink-0 border-b relative" style={{ background: 'rgba(2,8,18,0.97)', borderColor: 'rgba(0,229,255,0.1)' }}>
      <div ref={scrollerRef} className="flex overflow-x-auto scrollbar-hide snap-x">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
          <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] text-[9px] font-medium transition-all duration-200 relative whitespace-nowrap rounded-lg snap-start',
                isActive 
                  ? 'text-white' 
                  : 'text-muted-foreground',
                tab.variant === 'destructive' && isActive && 'text-destructive'
              )}
              onMouseEnter={e => {
                if (!isActive) {
                  const hsl = tab.featureColor ? featureGlowMap[tab.featureColor] : null;
                  const el = e.currentTarget as HTMLElement;
                  if (hsl) {
                    el.style.color = `hsl(${hsl})`;
                    el.style.background = `hsl(${hsl}/0.08)`;
                    el.style.filter = `drop-shadow(0 0 6px hsl(${hsl}/0.5))`;
                  } else {
                    el.style.color = 'rgba(255,255,255,0.95)';
                    el.style.background = 'rgba(255,255,255,0.05)';
                  }
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = '';
                  el.style.background = '';
                  el.style.filter = '';
                }
              }}
            >
              <Icon className={cn("h-4 w-4", !isActive && tab.featureColor)} />
              <span className={cn("truncate max-w-[48px]", !isActive && tab.featureColor)}>{tab.label}</span>
              
              {/* Active indicator - glowing pill */}
              {isActive && (
                <div 
                  className="absolute inset-0 rounded-lg -z-10"
                  style={{
                    background: tab.variant === 'destructive' ? 'rgba(239,68,68,0.15)' : 'rgba(0,229,255,0.12)',
                    border: tab.variant === 'destructive' ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(0,229,255,0.35)',
                    boxShadow: tab.variant === 'destructive' ? '0 0 12px rgba(239,68,68,0.25)' : '0 0 14px rgba(0,229,255,0.25)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showRightFade && (
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-10 flex items-center justify-end pr-1"
          style={{ background: 'linear-gradient(to right, rgba(2,8,18,0) 0%, rgba(2,8,18,0.95) 70%)' }}
        >
          <ChevronRight className="h-4 w-4 animate-pulse" style={{ color: 'hsl(189,100%,65%)' }} />
        </div>
      )}
    </div>
  );
};
