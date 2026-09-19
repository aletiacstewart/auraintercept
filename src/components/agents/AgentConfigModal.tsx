import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { AGENT_REGISTRY } from '@/lib/agentRegistry';
import { AgentSettingsPanel } from '@/components/ai/agents/AgentSettingsPanel';
import { AgentPromptLibrary } from '@/components/agents/AgentPromptLibrary';
import { AgentTestConsole } from '@/components/ai/agents/AgentTestConsole';
import { getAgentTypeForAgent } from '@/lib/agentTypes';
import { cn } from '@/lib/utils';

const STEPS = ['Basics', 'Connections', 'Prompt', 'Test & confirm'] as const;

interface AgentConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentType: string | null;
  isEnabled: boolean;
  settings: Record<string, any>;
  companyId: string | null;
  canManage: boolean;
  onToggle: (enabled: boolean) => void | Promise<void>;
  onSave: (settings: Record<string, any>) => Promise<void>;
}

export function AgentConfigModal({
  open,
  onOpenChange,
  agentType,
  isEnabled,
  settings,
  companyId,
  canManage,
  onToggle,
  onSave,
}: AgentConfigModalProps) {
  const [step, setStep] = useState(0);
  const [presetPrompt, setPresetPrompt] = useState<{ value: string; nonce: number } | null>(null);
  const def = agentType ? AGENT_REGISTRY[agentType] : null;
  const jobType = useMemo(() => (agentType ? getAgentTypeForAgent(agentType) : undefined), [agentType]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, agentType]);

  if (!def || !agentType) return null;

  const Icon = def.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', def.color)} />
            {def.name}
          </DialogTitle>
          <DialogDescription>{def.description}</DialogDescription>
        </DialogHeader>

        {/* Step rail */}
        <div className="flex items-center gap-2 flex-wrap">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                i === step ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1 pt-2">
          {step === 0 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-3 border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Turn this agent on</Label>
                    <p className="text-xs text-muted-foreground">Handles work automatically once active.</p>
                  </div>
                  <Switch checked={isEnabled} onCheckedChange={(v) => onToggle(v)} disabled={!canManage} />
                </div>
              </Card>
              <div>
                <p className="text-xs font-semibold mb-2">What it can do</p>
                <div className="flex flex-wrap gap-2">
                  {def.capabilities.map((c) => (
                    <Badge key={c} variant="outline" className="text-[11px]">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This agent works best with the following connected:
              </p>
              <div className="flex flex-wrap gap-2">
                {(jobType?.requiredIntegrations ?? ['voice']).map((i) => (
                  <Badge key={i} variant="outline" className="capitalize">{i}</Badge>
                ))}
              </div>
              <Card className="p-3 text-xs text-muted-foreground border-border/60">
                Connections are managed in Integrations. Anything missing simply limits what this
                agent can act on — it will still answer and hand off.
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <AgentPromptLibrary
                jobTypeId={jobType?.id}
                companyId={companyId}
                disabled={!canManage}
                onApply={(value) => setPresetPrompt({ value, nonce: Date.now() })}
              />
              <AgentSettingsPanel
                agentType={agentType}
                configFields={def.configFields}
                currentSettings={settings || {}}
                onSave={onSave}
                presetPrompt={presetPrompt}
              />
            </div>
          )}

          {step === 3 && (
            <AgentTestConsole
              agentType={agentType}
              agentName={def.name}
              isEnabled={isEnabled}
              companyId={companyId}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AgentConfigModal;
