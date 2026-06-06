import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RunWithAuraConfirmDialog } from '@/components/ai/RunWithAuraConfirmDialog';

export type WorkflowSideEffectChannel =
  | 'sms'
  | 'email'
  | 'voice'
  | 'assignment'
  | 'calendar'
  | 'db'
  | 'none';

export interface WorkflowSideEffect {
  channel: WorkflowSideEffectChannel;
  description: string;
}

export interface WorkflowPreview {
  reads?: string[];
  writes?: string[];
  sideEffects?: WorkflowSideEffect[];
  estimatedVolume?: string;
}

export interface WorkflowChain {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  steps: string[];
  command: string;
  /** Optional route to the working surface for this workflow (e.g. /dashboard/quotes). */
  targetRoute?: string;
  /** Optional transparency metadata shown in the "Review before Aura runs" dialog. */
  preview?: WorkflowPreview;
}

interface WorkflowChainButtonsProps {
  chains: WorkflowChain[];
  onTrigger: (command: string) => void;
}

export const WorkflowChainButtons: React.FC<WorkflowChainButtonsProps> = ({ chains, onTrigger }) => {
  const navigate = useNavigate();
  const [pending, setPending] = React.useState<WorkflowChain | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Zap className="h-4 w-4 text-primary" />
        End-to-End Workflows
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => (
          <Card
            key={chain.id}
            className="group border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card transition-all"
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <chain.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">{chain.label}</span>
              </div>
              <p className="text-xs text-white leading-relaxed">{chain.description}</p>
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
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 text-xs flex-1"
                  onClick={() => setPending(chain)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Run with Aura
                </Button>
                {chain.targetRoute && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => navigate(chain.targetRoute!)}
                  >
                    Open Page
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <RunWithAuraConfirmDialog
        chain={pending}
        onCancel={() => setPending(null)}
        onConfirm={(chain) => {
          setPending(null);
          onTrigger(chain.command);
        }}
      />
    </div>
  );
};
