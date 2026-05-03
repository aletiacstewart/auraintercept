import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { CalendarDays, Users, Repeat, AlertCircle } from 'lucide-react';
import type { ResolvedWorkspace } from '@/lib/workspace/types';

interface Props {
  workspace: ResolvedWorkspace;
  companyId: string;
}

export function AppointmentConsole({ workspace }: Props) {
  const resourceLabel =
    (workspace.promptOverrides as { terminology?: { resource?: string } })?.terminology
      ?.resource ?? 'Resource';
  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title={`${workspace.industryName} — Appointments`}
        description={`Calendar-first console for ${workspace.industryName.toLowerCase()} bookings`}
        featureColor="customer"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> Appointments today
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" /> {resourceLabel}s in use
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Repeat className="h-4 w-4" /> Rebookings (week)
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
        <Card className="p-4 surface-elevated-dark">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" /> No-show recovery
          </div>
          <div className="mt-2 text-3xl font-semibold">—</div>
        </Card>
      </div>
      <Card className="p-6 surface-elevated-dark">
        <p className="text-card-foreground/80">
          {resourceLabel} schedule, recurring bookings, deposit collection, and no-show recovery
          will appear here. This console is structurally different from the field dispatch view —
          no truck map, no dispatch board.
        </p>
      </Card>
    </div>
  );
}