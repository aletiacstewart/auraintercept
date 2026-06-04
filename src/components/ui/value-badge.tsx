import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueBadgeProps {
  label: string;
  className?: string;
  variant?: 'default' | 'subtle';
}

export const ValueBadge: React.FC<ValueBadgeProps> = ({ label, className, variant = 'default' }) => {
  return (
    <span className={cn(
      "inline-flex max-w-full items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 leading-tight sm:whitespace-nowrap",
      variant === 'default'
        ? "bg-primary/10 text-primary border border-primary/20"
        : "text-muted-foreground",
      className
    )}>
      <Sparkles className="h-2.5 w-2.5 shrink-0" />
      <span className="min-w-0 break-words">{label}</span>
    </span>
  );
};
