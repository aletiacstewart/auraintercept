import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Eye,
  Database,
  MessageSquare,
  Mail,
  Phone,
  CalendarClock,
  UserCog,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type {
  WorkflowChain,
  WorkflowSideEffect,
  WorkflowSideEffectChannel,
} from '@/components/ui/workflow-chain-buttons';

interface Props {
  chain: WorkflowChain | null;
  onCancel: () => void;
  onConfirm: (chain: WorkflowChain) => void;
}

const CHANNEL_META: Record<
  WorkflowSideEffectChannel,
  { label: string; icon: React.ElementType; tone: 'neutral' | 'warn' | 'alert' }
> = {
  sms: { label: 'SMS', icon: MessageSquare, tone: 'alert' },
  email: { label: 'Email', icon: Mail, tone: 'alert' },
  voice: { label: 'Voice call', icon: Phone, tone: 'alert' },
  calendar: { label: 'Calendar', icon: CalendarClock, tone: 'warn' },
  assignment: { label: 'Assignment', icon: UserCog, tone: 'warn' },
  db: { label: 'Data write', icon: Database, tone: 'warn' },
  none: { label: 'Read only', icon: Eye, tone: 'neutral' },
};

function toneClasses(tone: 'neutral' | 'warn' | 'alert'): string {
  if (tone === 'alert') return 'border-destructive/40 bg-destructive/10 text-destructive';
  if (tone === 'warn') return 'border-amber-500/40 bg-amber-500/10 text-amber-500';
  return 'border-border bg-muted/40 text-muted-foreground';
}

function hasCustomerFacingChannel(sideEffects?: WorkflowSideEffect[]): boolean {
  if (!sideEffects) return false;
  return sideEffects.some((s) => s.channel === 'sms' || s.channel === 'email' || s.channel === 'voice');
}

export const RunWithAuraConfirmDialog: React.FC<Props> = ({ chain, onCancel, onConfirm }) => {
  const open = chain !== null;
  const preview = chain?.preview;
  const showDisclaimer = hasCustomerFacingChannel(preview?.sideEffects);
  const hasExplicitPreview = Boolean(
    preview && (preview.reads?.length || preview.writes?.length || preview.sideEffects?.length),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Review before Aura runs
          </DialogTitle>
          <DialogDescription>
            {chain?.label
              ? `Confirm what Aura will do for "${chain.label}" before it touches your business.`
              : 'Confirm what Aura will do before it touches your business.'}
          </DialogDescription>
        </DialogHeader>

        {chain && (
          <div className="space-y-4 text-sm">
            {/* What it will do */}
            <section className="space-y-2">
              <h4 className="font-medium text-foreground">What it will do</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">{chain.description}</p>
              <div className="flex flex-wrap items-center gap-1">
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
            </section>

            {/* Data it will read */}
            {preview?.reads && preview.reads.length > 0 && (
              <section className="space-y-2">
                <h4 className="font-medium text-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" /> Data it will read
                </h4>
                <ul className="list-disc pl-5 space-y-0.5 text-xs text-muted-foreground">
                  {preview.reads.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </section>
            )}

            {/* Data it will write */}
            {preview?.writes && preview.writes.length > 0 && (
              <section className="space-y-2">
                <h4 className="font-medium text-foreground flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-amber-500" /> Data it will change
                </h4>
                <ul className="list-disc pl-5 space-y-0.5 text-xs text-muted-foreground">
                  {preview.writes.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </section>
            )}

            {/* Actions / side effects */}
            {preview?.sideEffects && preview.sideEffects.length > 0 && (
              <section className="space-y-2">
                <h4 className="font-medium text-foreground">Actions it will take</h4>
                <div className="space-y-1.5">
                  {preview.sideEffects.map((s, i) => {
                    const meta = CHANNEL_META[s.channel];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded border px-2 py-1.5 text-xs ${toneClasses(meta.tone)}`}
                      >
                        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <Badge variant="outline" className="mr-2 text-[10px] py-0 px-1 border-current">
                            {meta.label}
                          </Badge>
                          <span>{s.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {preview.estimatedVolume && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Estimated scope: {preview.estimatedVolume}
                  </p>
                )}
              </section>
            )}

            {/* Fallback when no preview metadata */}
            {!hasExplicitPreview && (
              <div className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>
                  Aura will interpret this command and may read your business data, write
                  records, and send customer-facing messages where appropriate. Review the
                  streamed response carefully.
                </p>
              </div>
            )}

            {/* Third-party fee disclaimer */}
            {showDisclaimer && (
              <div className="rounded border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Third-party fees:</strong> SMS, email and
                voice usage are billed directly by your own SignalWire / Resend / ElevenLabs
                account — separate from your Aura plan. Make sure those accounts are funded
                before confirming.
              </div>
            )}

            {/* Raw command (for transparency / power users) */}
            <details className="text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none hover:text-foreground">
                Show exact prompt sent to Aura
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-muted/40 p-2 text-foreground/80">
{chain.command}
              </pre>
            </details>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => chain && onConfirm(chain)}
            disabled={!chain}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Run now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};