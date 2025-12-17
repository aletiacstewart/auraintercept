import React from 'react';
import { Bot } from 'lucide-react';
import { QuickActionGrid } from './QuickActionGrid';
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
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  companyName,
  title = "Welcome!",
  subtitle,
  actions,
  onAction,
}) => {
  return (
    <div className="text-center py-6 sm:py-8 animate-fade-in">
      {/* Animated bot icon */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <div className="absolute inset-0 h-16 w-16 sm:h-20 sm:w-20 rounded-full glass-primary opacity-20 animate-ping" />
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full glass-primary flex items-center justify-center glow-primary float-subtle">
          <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>
      </div>
      
      <h3 className="font-bold text-lg sm:text-xl mb-2 gradient-text">{title}</h3>
      <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-sm mx-auto px-4">
        {subtitle || `I'm your virtual assistant${companyName ? ` at ${companyName}` : ''}. How can I help you today?`}
      </p>
      
      <div className="max-w-md mx-auto px-4">
        <QuickActionGrid 
          actions={actions} 
          onAction={onAction} 
          columns={2}
        />
      </div>
    </div>
  );
};
