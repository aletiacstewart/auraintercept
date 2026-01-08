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
    <div className="py-4 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-muted-foreground text-xs max-w-md mx-auto px-2">
          {subtitle || `I'm your virtual assistant${companyName ? ` at ${companyName}` : ''}. How can I help?`}
        </p>
      </div>
      
      {/* Two Column Layout - more compact */}
      <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto px-2">
        {/* Left Column - How To Guide */}
        {showHowToGuide && (
          <div className="order-2 md:order-1">
            <AgentHowToGuide defaultExpanded={false} className="max-w-none" consoleType={consoleType} />
          </div>
        )}
        
        {/* Right Column - Action Buttons */}
        <div className={showHowToGuide ? "order-1 md:order-2" : "md:col-span-2"}>
          <div className="mb-2 text-center md:text-left">
            <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
          </div>
          <QuickActionGrid 
            actions={actions} 
            onAction={onAction} 
            columns={2}
          />
        </div>
      </div>
    </div>
  );
};
