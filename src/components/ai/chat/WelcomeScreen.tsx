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
}) => {
  return (
    <div className="py-4 px-4 animate-fade-in w-full">
      {/* Full Width Layout */}
      <div className="w-full space-y-4">
        {/* Header Action (e.g., Industry Templates) */}
        {headerAction && (
          <div className="w-full max-w-4xl mx-auto flex justify-end">
            {headerAction}
          </div>
        )}
        
        {/* How To Guide - Collapsible at top */}
        {showHowToGuide && (
          <div className="w-full max-w-4xl mx-auto">
            <AgentHowToGuide defaultExpanded={false} className="max-w-none" consoleType={consoleType} />
          </div>
        )}
        
        {/* Quick Actions - Full width grid */}
        <div className="w-full max-w-4xl mx-auto">
          <QuickActionGrid 
            actions={actions} 
            onAction={onAction} 
            columns={4}
          />
        </div>
      </div>
    </div>
  );
};
