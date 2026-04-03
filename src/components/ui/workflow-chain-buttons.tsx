import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface WorkflowChain {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  steps: string[];
  command: string;
}

interface WorkflowChainButtonsProps {
  chains: WorkflowChain[];
  onTrigger: (command: string) => void;
}

export const WorkflowChainButtons: React.FC<WorkflowChainButtonsProps> = ({ chains, onTrigger }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Zap className="h-4 w-4 text-primary" />
        End-to-End Workflows
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => (
          <Card
            key={chain.id}
            className="group cursor-pointer border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all"
            onClick={() => onTrigger(chain.command)}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <chain.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{chain.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{chain.description}</p>
              <div className="flex items-center gap-1 flex-wrap">
                {chain.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {step}
                    </span>
                    {i < chain.steps.length - 1 && (
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
