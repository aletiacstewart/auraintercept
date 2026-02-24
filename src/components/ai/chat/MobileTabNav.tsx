import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

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
  const handleTabClick = (tabId: string) => {
    // If clicking on home/chat tab, trigger home reset callback
    if (tabId === 'chat' && onHomeClick) {
      onHomeClick();
    }
    onTabChange(tabId);
  };

  return (
    <div className="shrink-0 border-b border-border/50" style={{ background: 'hsl(208 30% 18%)' }}>
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
          <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] text-[9px] font-medium transition-all duration-200 relative whitespace-nowrap rounded-lg',
                isActive 
                  ? 'text-white' 
                  : 'text-white/60',
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
              
              {/* Active indicator */}
              {isActive && (
                <div className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full',
                  tab.variant === 'destructive' ? 'bg-destructive' : 'bg-primary'
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
