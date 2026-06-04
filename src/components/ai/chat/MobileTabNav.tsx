import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const ActiveIcon = active?.icon;

  return (
    <div className="shrink-0 border-b border-border/40 bg-card/95 px-2 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-primary/25 bg-background/80 px-3 text-left text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active?.variant === 'destructive' && 'border-destructive/35 text-destructive'
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              {ActiveIcon && <ActiveIcon className={cn('h-4 w-4 shrink-0', active?.featureColor)} />}
              <span className="block min-w-0 truncate">{active?.label ?? 'Menu'}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="w-[var(--radix-dropdown-menu-trigger-width)] p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <DropdownMenuItem
                key={tab.id}
                onSelect={() => handleTabClick(tab.id)}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                  isActive && 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary',
                  tab.variant === 'destructive' && isActive && 'bg-destructive/10 text-destructive focus:bg-destructive/10 focus:text-destructive'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', !isActive && tab.featureColor)} />
                <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                {isActive && <Check className="h-4 w-4 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
