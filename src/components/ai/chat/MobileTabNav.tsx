import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
}

interface MobileTabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const MobileTabNav: React.FC<MobileTabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="shrink-0 border-b glass-panel">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 min-w-[4.5rem] flex flex-col items-center gap-1 py-2.5 px-3 text-xs font-medium transition-all duration-200 relative',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground',
                tab.variant === 'destructive' && isActive && 'text-destructive'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 transition-transform duration-200',
                isActive && 'scale-110'
              )} />
              <span className="truncate max-w-full">{tab.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full',
                  tab.variant === 'destructive' ? 'bg-destructive' : 'bg-primary glow-primary'
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
