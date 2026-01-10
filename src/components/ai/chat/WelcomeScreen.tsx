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
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  companyName,
  title = "Welcome!",
  subtitle,
  actions,
  onAction,
  showHowToGuide = true,
  consoleType = 'customer',
}) => {
  return (
    <div className="py-4 px-4 animate-fade-in w-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-foreground/70 text-xs max-w-lg mx-auto">
          {subtitle || `I'm your virtual assistant${companyName ? ` at ${companyName}` : ''}. How can I help?`}
        </p>
      </div>
      
      {/* Full Width Layout */}
      <div className="w-full space-y-4">
        {/* How To Guide - Collapsible at top */}
        {showHowToGuide && (
          <div className="w-full max-w-4xl mx-auto">
            <AgentHowToGuide defaultExpanded={false} className="max-w-none" consoleType={consoleType} />
          </div>
        )}
        
        {/* Quick Actions - Full width grid */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-2 text-center">
            <p className="text-xs font-medium text-foreground/70">Quick Actions</p>
          </div>
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
