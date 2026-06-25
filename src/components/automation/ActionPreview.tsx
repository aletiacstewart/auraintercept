import { useState } from 'react';
import { Mail, MessageSquare, Calendar, Receipt, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AnyPayload = Record<string, any>;

interface Props {
  actionType: string;
  payload: AnyPayload;
}

/**
 * Renders a channel-specific preview of what an automated draft will look like
 * when it is sent (SMS bubble, email envelope, calendar invite, invoice card).
 * Falls back to a raw JSON view for unknown action types, and offers a
 * "Show raw JSON" toggle on every preview for power users.
 */
export function ActionPreview({ actionType, payload }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const p = payload || {};

  return (
    <div className="space-y-2">
      {actionType === 'draft_sms' && <SmsPreview p={p} />}
      {actionType === 'draft_email' && <EmailPreview p={p} />}
      {actionType === 'create_appointment' && <AppointmentPreview p={p} />}
      {actionType === 'draft_invoice' && <InvoicePreview p={p} />}
      {!['draft_sms', 'draft_email', 'create_appointment', 'draft_invoice'].includes(actionType) && (
        <RawJson p={p} />
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[11px] text-muted-foreground"
        onClick={() => setShowRaw((s) => !s)}
      >
        {showRaw ? 'Hide' : 'Show'} raw JSON
      </Button>
      {showRaw && <RawJson p={p} />}
    </div>
  );
}

function RawJson({ p }: { p: AnyPayload }) {
  return (
    <pre className="text-[11px] bg-muted/60 p-2 rounded overflow-auto max-h-48 border border-border/60">
      {JSON.stringify(p, null, 2)}
    </pre>
  );
}

function SmsPreview({ p }: { p: AnyPayload }) {
  const body = String(p.message ?? p.body ?? '');
  const to = String(p.to ?? p.lead_phone ?? '—');
  const from = String(p.from ?? p.from_number ?? 'Your business number');
  const chars = body.length;
  const segments = Math.max(1, Math.ceil(chars / 160));
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>SMS</span>
        <span>·</span>
        <span>From <span className="text-foreground font-medium">{from}</span></span>
        <span>·</span>
        <span>To <span className="text-foreground font-medium">{to}</span></span>
      </div>
      <div className="rounded-2xl bg-primary/10 border border-primary/30 px-3 py-2 text-sm whitespace-pre-wrap max-w-md">
        {body || <em className="text-muted-foreground">(empty message)</em>}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {chars} chars · {segments} segment{segments === 1 ? '' : 's'} · Reply STOP to opt out
      </div>
    </div>
  );
}

function EmailPreview({ p }: { p: AnyPayload }) {
  const subject = String(p.subject ?? '(no subject)');
  const fromName = String(p.from_name ?? p.company_name ?? 'Your business');
  const fromEmail = String(p.from_email ?? 'no-reply@auraintercept.ai');
  const replyTo = p.reply_to ? String(p.reply_to) : null;
  const to = String(p.to ?? p.lead_email ?? '—');
  const body = String(p.body ?? p.html ?? '');
  const ctaUrl = p.cta_url ? String(p.cta_url) : null;
  const ctaLabel = p.cta_label ? String(p.cta_label) : (ctaUrl ? 'Open' : null);

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="bg-muted/40 px-3 py-2 text-xs space-y-0.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">From</span>
          <span className="text-foreground font-medium">{fromName} &lt;{fromEmail}&gt;</span>
        </div>
        <div><span className="text-muted-foreground">To </span><span className="text-foreground">{to}</span></div>
        {replyTo && <div><span className="text-muted-foreground">Reply-To </span><span className="text-foreground">{replyTo}</span></div>}
        <div><span className="text-muted-foreground">Subject </span><span className="text-foreground font-semibold">{subject}</span></div>
      </div>
      <div className="p-4 space-y-3 max-w-xl">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {body || <em className="text-muted-foreground">(empty body)</em>}
        </div>
        {ctaUrl && (
          <a
            href={ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {ctaLabel} <ChevronRight className="h-4 w-4" />
          </a>
        )}
        {ctaUrl && (
          <div className="text-[10px] text-muted-foreground break-all">{ctaUrl}</div>
        )}
        <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/60">
          You're receiving this because of your relationship with {fromName}. Unsubscribe links are appended automatically on send.
        </div>
      </div>
    </div>
  );
}

function AppointmentPreview({ p }: { p: AnyPayload }) {
  const dt = p.datetime ? new Date(String(p.datetime)) : null;
  const dtStr = dt && !isNaN(dt.getTime()) ? dt.toLocaleString() : 'TBD (next available)';
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-1.5 max-w-md">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>Appointment</span>
      </div>
      <div className="text-sm"><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{String(p.customer_name ?? '—')}</span></div>
      <div className="text-sm"><span className="text-muted-foreground">Service:</span> {String(p.service_type ?? 'Consultation')}</div>
      <div className="text-sm"><span className="text-muted-foreground">When:</span> {dtStr}</div>
      <div className="text-sm"><span className="text-muted-foreground">Duration:</span> {Number(p.duration_minutes ?? 60)} min</div>
      {p.notes && <div className="text-xs text-muted-foreground pt-1">{String(p.notes)}</div>}
    </div>
  );
}

function InvoicePreview({ p }: { p: AnyPayload }) {
  const total = Number(p.total ?? 0);
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-1.5 max-w-md">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Receipt className="h-3.5 w-3.5" />
        <span>Invoice (draft)</span>
      </div>
      <div className="text-sm"><span className="text-muted-foreground">Bill to:</span> <span className="font-medium">{String(p.customer_name ?? '—')}</span></div>
      {p.customer_email && <div className="text-sm"><span className="text-muted-foreground">Email:</span> {String(p.customer_email)}</div>}
      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-base font-semibold">${total.toFixed(2)}</span>
      </div>
      {p.notes && <div className="text-xs text-muted-foreground pt-1">{String(p.notes)}</div>}
    </div>
  );
}