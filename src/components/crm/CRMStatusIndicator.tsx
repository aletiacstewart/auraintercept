import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Link2Off, RefreshCw, ExternalLink } from 'lucide-react';
import { useCRMConnection } from '@/hooks/useCRMConnection';
import { formatDistanceToNow } from 'date-fns';

interface CRMStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const providerLogos: Record<string, string> = {
  hubspot: '🟠',
  salesforce: '☁️',
  zoho: '📊',
  pipedrive: '🔵',
};

const providerNames: Record<string, string> = {
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
  zoho: 'Zoho CRM',
  pipedrive: 'Pipedrive',
};

export const CRMStatusIndicator: React.FC<CRMStatusIndicatorProps> = ({
  showDetails = false,
  compact = false,
  className = '',
}) => {
  const {
    isConnected,
    provider,
    status,
    lastSyncAt,
    isCheckingConnection,
    refetchConnection,
  } = useCRMConnection();

  if (isCheckingConnection) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <RefreshCw className="h-3 w-3 animate-spin" />
        {!compact && 'Checking CRM...'}
      </Badge>
    );
  }

  if (!isConnected) {
    if (compact) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={`gap-1 opacity-50 ${className}`}>
                <Link2Off className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>No CRM connected</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null; // Don't show anything if not connected and not compact
  }

  const logo = provider ? providerLogos[provider] : '🔗';
  const name = provider ? providerNames[provider] : 'CRM';
  const lastSyncText = lastSyncAt
    ? `Last sync: ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`
    : 'Never synced';

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={`gap-1 ${className}`}>
              <span>{logo}</span>
              <Link2 className="h-3 w-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name} connected</p>
            <p className="text-xs text-muted-foreground">{lastSyncText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className="gap-1">
        <span>{logo}</span>
        <Link2 className="h-3 w-3" />
        {name}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">{lastSyncText}</span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => refetchConnection()}
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
};

interface CRMSyncButtonProps {
  onSync: () => void;
  isSyncing?: boolean;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const CRMSyncButton: React.FC<CRMSyncButtonProps> = ({
  onSync,
  isSyncing = false,
  label = 'Sync to CRM',
  variant = 'outline',
  size = 'sm',
  className = '',
}) => {
  const { isConnected } = useCRMConnection();

  if (!isConnected) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onSync}
      disabled={isSyncing}
      className={`gap-1 ${className}`}
    >
      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
      {label}
    </Button>
  );
};

interface ViewInCRMButtonProps {
  crmEntityId?: string;
  entityType?: 'contact' | 'deal' | 'activity';
  className?: string;
}

export const ViewInCRMButton: React.FC<ViewInCRMButtonProps> = ({
  crmEntityId,
  entityType = 'contact',
  className = '',
}) => {
  const { isConnected, provider } = useCRMConnection();

  if (!isConnected || !crmEntityId) return null;

  const getCRMUrl = () => {
    if (provider === 'hubspot') {
      const typeMap = {
        contact: 'contacts',
        deal: 'deals',
        activity: 'contacts', // Activities are viewed on contact page
      };
      return `https://app.hubspot.com/contacts/${typeMap[entityType]}/${crmEntityId}`;
    }
    // Add other providers as needed
    return null;
  };

  const url = getCRMUrl();
  if (!url) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${className}`}
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>View in {provider ? providerNames[provider] : 'CRM'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
