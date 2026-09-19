import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegrationDef } from '@/lib/integrationConfig';

export type IntegrationStatus = 'connected' | 'attention' | 'not_connected';

const STATUS_BADGE: Record<IntegrationStatus, { label: string; className: string }> = {
  connected: { label: 'Connected', className: 'bg-green-500/10 text-green-600 border-green-500/30' },
  attention: { label: 'Needs attention', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  not_connected: { label: 'Not connected', className: 'bg-muted text-muted-foreground border-border/50' },
};

interface IntegrationCardProps {
  integration: IntegrationDef;
  status: IntegrationStatus;
  loading?: boolean;
  onSetup: (integration: IntegrationDef) => void;
}

export function IntegrationCard({ integration, status, loading, onSetup }: IntegrationCardProps) {
  const Icon = integration.icon;
  const badge = STATUS_BADGE[status];

  return (
    <Card className={cn('relative border-border/50 transition-all', status === 'connected' && 'border-green-500/30')}>
      <div className="absolute right-3 top-3">
        <Badge variant="outline" className={cn('text-[10px]', badge.className)}>
          {status === 'connected' && <Check className="mr-1 h-2.5 w-2.5" />}
          {status === 'attention' && <AlertTriangle className="mr-1 h-2.5 w-2.5" />}
          {badge.label}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', integration.color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-base">{integration.name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground">{integration.description}</p>
        <p className="text-xs text-foreground/70">
          <span className="font-medium">Used for:</span> {integration.requiredFor}
        </p>
        {integration.pricingNote && (
          <p className="rounded border border-border/30 bg-muted/50 p-2 text-xs text-foreground/80">{integration.pricingNote}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          About {integration.estimatedTime} to set up
        </div>

        {loading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              variant={status === 'connected' ? 'outline' : 'default'}
              onClick={() => onSetup(integration)}
            >
              {status === 'connected' ? 'Manage' : 'Set up'}
            </Button>
            {integration.docsUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" aria-label={`${integration.name} help`}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
