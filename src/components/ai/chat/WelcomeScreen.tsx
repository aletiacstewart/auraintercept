import React from 'react';
import { QuickActionGrid } from './QuickActionGrid';
import { AgentHowToGuide, ConsoleType } from './AgentHowToGuide';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  message: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface WelcomeScreenProps {
  companyName?: string;
  title?: string;
  subtitle?: string;
  actions: QuickAction[];
  onAction: (message: string, actionId: string) => void;
  showHowToGuide?: boolean;
  consoleType?: ConsoleType;
  headerAction?: React.ReactNode;
  feedbackRating?: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  companyName,
  title = "Welcome!",
  subtitle,
  actions,
  onAction,
  showHowToGuide = true,
  consoleType = 'customer',
  headerAction,
  feedbackRating,
}) => {
  return (
    <div className="py-4 px-4 animate-fade-in w-full relative">
      {/* Cyber dot-grid watermark */}
      <div className="absolute inset-0 cyber-dot-grid opacity-40 pointer-events-none" />
      {/* Full Width Layout */}
      <div className="w-full space-y-4 relative z-10">
        {/* Header Action (e.g., Industry Templates) */}
        {headerAction && (
          <div className="w-full max-w-4xl mx-auto flex justify-end">
            {headerAction}
          </div>
        )}
        
        {/* How To Guide - Collapsible at top */}
        {showHowToGuide && (
          <div className="w-full max-w-4xl mx-auto">
            <AgentHowToGuide defaultExpanded={false} className="max-w-none" consoleType={consoleType} feedbackRating={feedbackRating} />
          </div>
        )}

        {/* Title + subtitle */}
        <div className="w-full max-w-4xl mx-auto text-center space-y-2 pt-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Quick action grid */}
        {actions && actions.length > 0 && (
          <div className="w-full max-w-4xl mx-auto">
            <QuickActionGrid actions={actions} onAction={onAction} />
          </div>
        )}
      </div>
    </div>
  );
};
