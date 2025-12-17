import React from 'react';
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
    <div className="text-center py-4 animate-fade-in">
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-muted-foreground text-xs mb-4 max-w-xs mx-auto px-2">
        {subtitle || `I'm your virtual assistant${companyName ? ` at ${companyName}` : ''}. How can I help?`}
      </p>
      
      <div className="max-w-sm mx-auto px-2">
        <QuickActionGrid 
          actions={actions} 
          onAction={onAction} 
          columns={2}
        />
      </div>
    </div>
  );
};
