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
  onHomeClick?: () => void;
}

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
    <div className="shrink-0 border-b border-slate-600/50 bg-slate-700/80">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-all relative',
                isActive 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white',
                tab.variant === 'destructive' && isActive && 'text-destructive'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{tab.label}</span>
              
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
