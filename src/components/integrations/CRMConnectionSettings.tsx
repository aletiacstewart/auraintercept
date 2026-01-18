import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Loader2,
  RefreshCw,
  Unlink,
  Settings2,
  History,
  Zap,
  Webhook,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { CRMSyncHistory } from './CRMSyncHistory';

// CRM Provider configurations
const CRM_PROVIDERS = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing, sales, and service platform',
    color: 'bg-orange-500',
    icon: '🟠',
    docsUrl: 'https://app.hubspot.com/settings',
    authType: 'api_key' as const,
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'pat-xxx...', type: 'password' as const, required: true, helpText: 'Private App access token from HubSpot Settings' },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM platform',
    color: 'bg-blue-500',
    icon: '☁️',
    docsUrl: 'https://login.salesforce.com',
    authType: 'api_key' as const,
    fields: [
      { key: 'instance_url', label: 'Instance URL', placeholder: 'https://yourorg.salesforce.com', type: 'text' as const, required: true, helpText: 'Your Salesforce org URL' },
      { key: 'api_key', label: 'Access Token', placeholder: 'Your access token', type: 'password' as const, required: true, helpText: 'Security token or OAuth access token' },
    ],
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Cloud-based CRM solution',
    color: 'bg-red-500',
    icon: '🔴',
    docsUrl: 'https://crm.zoho.com',
    authType: 'api_key' as const,
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'Your Zoho API key', type: 'password' as const, required: true, helpText: 'From Zoho Developer Console' },
    ],
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales-focused CRM',
    color: 'bg-green-500',
    icon: '🟢',
    docsUrl: 'https://app.pipedrive.com/settings/api',
    authType: 'api_key' as const,
    fields: [
      { key: 'api_key', label: 'API Token', placeholder: 'Your Pipedrive API token', type: 'password' as const, required: true, helpText: 'From Settings → Personal preferences → API' },
    ],
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Send data to your own endpoint',
    color: 'bg-purple-500',
    icon: '🔗',
    docsUrl: '',
    authType: 'webhook' as const,
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://your-endpoint.com/webhook', type: 'text' as const, required: true, helpText: 'URL to receive CRM events' },
      { key: 'secret', label: 'Secret Key (optional)', placeholder: 'Webhook signing secret', type: 'password' as const, required: false, helpText: 'For request verification' },
    ],
  },
];

type CRMProvider = 'hubspot' | 'salesforce' | 'zoho' | 'pipedrive' | 'webhook';

interface CRMConnection {
  id: string;
  company_id: string;
  provider: CRMProvider;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at: string | null;
  settings: Record<string, unknown> | null;
  sync_contacts: boolean;
  sync_leads: boolean;
  sync_deals: boolean;
  sync_activities: boolean;
}

export function CRMConnectionSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<typeof CRM_PROVIDERS[0] | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [disconnectProvider, setDisconnectProvider] = useState<CRMProvider | null>(null);
  const [showSyncHistory, setShowSyncHistory] = useState(false);

  // Fetch CRM connections
  const { data: connections, isLoading } = useQuery({
    queryKey: ['crm-connections', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return data as CRMConnection[];
    },
    enabled: !!companyId,
  });

  // Save CRM connection
  const saveMutation = useMutation({
    mutationFn: async ({ provider, credentials }: { provider: CRMProvider; credentials: Record<string, string> }) => {
      if (!companyId) throw new Error('No company ID');

      // Test connection first
      const { data: testResult, error: testError } = await supabase.functions.invoke('crm-adapter', {
        body: {
          action: 'testConnection',
          companyId,
          provider,
          credentials,
        },
      });

      if (testError) throw testError;
      if (!testResult?.success) {
        throw new Error(testResult?.error || 'Connection test failed');
      }

      // Check if connection exists
      const existingConnection = connections?.find(c => c.provider === provider);

      if (existingConnection) {
        const { error } = await supabase
          .from('crm_connections')
          .update({
            settings: credentials,
            status: 'connected',
            connected_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', existingConnection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crm_connections')
          .insert({
            company_id: companyId,
            provider,
            settings: credentials,
            status: 'connected',
            connected_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success('CRM connected successfully!');
      setSelectedProvider(null);
      setFormData({});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect CRM');
    },
  });

  // Disconnect CRM
  const disconnectMutation = useMutation({
    mutationFn: async (provider: CRMProvider) => {
      const connection = connections?.find(c => c.provider === provider);
      if (!connection) throw new Error('Connection not found');

      const { error } = await supabase
        .from('crm_connections')
        .update({ status: 'disconnected', settings: null })
        .eq('id', connection.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success('CRM disconnected');
      setDisconnectProvider(null);
    },
    onError: () => toast.error('Failed to disconnect CRM'),
  });

  // Update sync settings
  const updateSyncMutation = useMutation({
    mutationFn: async ({ connectionId, field, value }: { connectionId: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('crm_connections')
        .update({ [field]: value })
        .eq('id', connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
    },
    onError: () => toast.error('Failed to update sync settings'),
  });

  // Manual sync
  const syncNowMutation = useMutation({
    mutationFn: async (provider: CRMProvider) => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase.functions.invoke('crm-adapter', {
        body: {
          action: 'sync_all',
          companyId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success('Sync completed!');
    },
    onError: () => toast.error('Sync failed'),
  });

  const handleOpenSetup = (provider: typeof CRM_PROVIDERS[0]) => {
    const connection = connections?.find(c => c.provider === provider.id);
    if (connection?.settings) {
      setFormData(connection.settings as Record<string, string>);
    } else {
      setFormData({});
    }
    setSelectedProvider(provider);
  };

  const handleSave = () => {
    if (!selectedProvider) return;
    const missingFields = selectedProvider.fields
      .filter(f => f.required && !formData[f.key])
      .map(f => f.label);
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    saveMutation.mutate({ provider: selectedProvider.id as CRMProvider, credentials: formData });
  };

  const getConnectionForProvider = (providerId: string) => {
    return connections?.find(c => c.provider === providerId && c.status === 'connected');
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const connectedCRMs = connections?.filter(c => c.status === 'connected') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">CRM Integrations</h2>
          <p className="text-sm text-muted-foreground">Connect your CRM to sync customer data automatically</p>
        </div>
        {connectedCRMs.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowSyncHistory(true)}>
            <History className="w-4 h-4 mr-2" />
            Sync History
          </Button>
        )}
      </div>

      {/* Connected CRMs */}
      {connectedCRMs.length > 0 && (
        <div className="space-y-4">
          {connectedCRMs.map(connection => {
            const provider = CRM_PROVIDERS.find(p => p.id === connection.provider);
            if (!provider) return null;

            return (
              <Card key={connection.id} className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl', provider.color)}>
                        {provider.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {provider.name}
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {connection.last_sync_at 
                            ? `Last synced ${formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })}`
                            : 'Never synced'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncNowMutation.mutate(connection.provider)}
                        disabled={syncNowMutation.isPending}
                      >
                        {syncNowMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Sync Now</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSetup(provider)}
                      >
                        <Settings2 className="w-4 h-4" />
                        <span className="ml-2 hidden sm:inline">Settings</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDisconnectProvider(connection.provider)}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                      <Label htmlFor={`sync-contacts-${connection.id}`} className="text-sm font-normal cursor-pointer">
                        Sync Contacts
                      </Label>
                      <Switch
                        id={`sync-contacts-${connection.id}`}
                        checked={connection.sync_contacts}
                        onCheckedChange={(checked) => updateSyncMutation.mutate({ connectionId: connection.id, field: 'sync_contacts', value: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                      <Label htmlFor={`sync-leads-${connection.id}`} className="text-sm font-normal cursor-pointer">
                        Sync Leads
                      </Label>
                      <Switch
                        id={`sync-leads-${connection.id}`}
                        checked={connection.sync_leads}
                        onCheckedChange={(checked) => updateSyncMutation.mutate({ connectionId: connection.id, field: 'sync_leads', value: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                      <Label htmlFor={`sync-deals-${connection.id}`} className="text-sm font-normal cursor-pointer">
                        Sync Deals
                      </Label>
                      <Switch
                        id={`sync-deals-${connection.id}`}
                        checked={connection.sync_deals}
                        onCheckedChange={(checked) => updateSyncMutation.mutate({ connectionId: connection.id, field: 'sync_deals', value: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50">
                      <Label htmlFor={`sync-activities-${connection.id}`} className="text-sm font-normal cursor-pointer">
                        Sync Activities
                      </Label>
                      <Switch
                        id={`sync-activities-${connection.id}`}
                        checked={connection.sync_activities}
                        onCheckedChange={(checked) => updateSyncMutation.mutate({ connectionId: connection.id, field: 'sync_activities', value: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available CRMs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CRM_PROVIDERS.filter(p => !getConnectionForProvider(p.id)).map(provider => (
          <Card key={provider.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl', provider.color)}>
                  {provider.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                  <CardDescription className="text-xs">{provider.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenSetup(provider)}
                >
                  {provider.authType === 'webhook' ? <Webhook className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Connect
                </Button>
                {provider.docsUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider && (
                <>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-lg', selectedProvider.color)}>
                    {selectedProvider.icon}
                  </div>
                  Connect {selectedProvider.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>Enter your API credentials to connect</DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4 pt-4">
              {selectedProvider.fields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    />
                    {field.type === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => togglePasswordVisibility(field.key)}
                      >
                        {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                  {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedProvider(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectProvider} onOpenChange={() => setDisconnectProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect CRM?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing data with your CRM. Your existing data will remain, but no new data will be synced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => disconnectProvider && disconnectMutation.mutate(disconnectProvider)}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sync History Dialog */}
      <Dialog open={showSyncHistory} onOpenChange={setShowSyncHistory}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CRM Sync History</DialogTitle>
            <DialogDescription>Recent synchronization activity</DialogDescription>
          </DialogHeader>
          <CRMSyncHistory />
        </DialogContent>
      </Dialog>
    </div>
  );
}
