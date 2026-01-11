import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, RefreshCw, Link2, Unlink, CheckCircle2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function GoogleCalendarSettings() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth?action=callback`;

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    toast.success('Redirect URI copied to clipboard');
    setTimeout(() => setCopiedUri(false), 2000);
  };

  // Fetch Google Calendar connection status
  const { data: connection, isLoading } = useQuery({
    queryKey: ['google-calendar-connection', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('google_calendar_connections')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  // Connect to Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=authorize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get auth URL');
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      if (isInIframe) {
        // In embedded previews, open a same-origin page in a new tab; it will redirect to Google.
        // This avoids cross-origin iframe restrictions and browser "refused to connect" issues.
        window.open('/oauth/google-calendar', '_blank', 'noopener,noreferrer');
        return;
      }

      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Disconnect from Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth?action=disconnect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disconnect');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast.success('Disconnected from Google Calendar');
      setDisconnectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Trigger a full sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_sync', companyId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to sync');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast.success(`Synced ${data.synced || 0} appointments to Google Calendar`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connection?.sync_enabled;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Two-way sync with instant updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Two-Way Sync
            </Badge>
            <Badge variant="outline" className="text-xs text-white/70 border-white/30">
              Instant Updates
            </Badge>
            <Badge variant="outline" className="text-xs text-white/70 border-white/30">
              Requires Setup
            </Badge>
          </div>

          {isConnected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connected</p>
                  {connection.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {format(new Date(connection.last_sync_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </div>

              {connection.last_error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Sync Error</p>
                    <p className="text-xs text-muted-foreground">{connection.last_error}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDisconnectDialogOpen(true)}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {/* Setup Guide - Always shown */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <h4 className="text-sm font-medium mb-3">
              {isConnected ? 'Connection Setup Reference' : 'Setup Guide'}
            </h4>
            
            <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-card-foreground">
                <strong className="text-foreground">Important:</strong> The email you use to sign in to this platform must match the email on your Google account.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="step-1" className="border-b-0">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">1</Badge>
                    Create a Google Cloud Project
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-card-foreground pb-3">
                  <ol className="space-y-1.5 list-decimal list-inside ml-1">
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">console.cloud.google.com</a></li>
                    <li>Click the project dropdown at the top left (next to "Google Cloud")</li>
                    <li>Click <strong>"New Project"</strong> in the popup</li>
                    <li>Enter a project name (e.g., "Calendar Sync")</li>
                    <li>Click <strong>"Create"</strong> and wait for it to finish</li>
                    <li>Select your new project from the dropdown</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step-2" className="border-b-0">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">2</Badge>
                    Enable Google Calendar API
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-card-foreground pb-3">
                  <ol className="space-y-1.5 list-decimal list-inside ml-1">
                    <li>In the left sidebar, go to <strong>"APIs & Services"</strong> → <strong>"Library"</strong></li>
                    <li>Search for <strong>"Google Calendar API"</strong></li>
                    <li>Click on it and press the blue <strong>"Enable"</strong> button</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step-3" className="border-b-0">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">3</Badge>
                    Configure OAuth Consent Screen
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-card-foreground pb-3">
                  <ol className="space-y-1.5 list-decimal list-inside ml-1">
                    <li>Go to <strong>"APIs & Services"</strong> → <strong>"OAuth consent screen"</strong></li>
                    <li>Select <strong>"External"</strong> user type and click <strong>"Create"</strong></li>
                    <li>Fill in required fields:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                        <li>App name: Enter any name (e.g., "Calendar Sync")</li>
                        <li>User support email: Select your email</li>
                        <li>Developer contact email: Enter your email</li>
                      </ul>
                    </li>
                    <li>Click <strong>"Save and Continue"</strong></li>
                    <li>On the Scopes page, click <strong>"Save and Continue"</strong> (no changes needed)</li>
                    <li>On the <strong>"Test users"</strong> page:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                        <li>Click <strong>"+ Add Users"</strong></li>
                        <li>Enter your Google email address (must match your platform email!)</li>
                        <li>Click <strong>"Add"</strong></li>
                      </ul>
                    </li>
                    <li>Click <strong>"Save and Continue"</strong></li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step-4" className="border-b-0">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">4</Badge>
                    Create OAuth Credentials
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-card-foreground pb-3">
                  <ol className="space-y-1.5 list-decimal list-inside ml-1">
                    <li>Go to <strong>"APIs & Services"</strong> → <strong>"Credentials"</strong></li>
                    <li>Click <strong>"+ Create Credentials"</strong> at the top</li>
                    <li>Select <strong>"OAuth client ID"</strong></li>
                    <li>For Application type, choose <strong>"Web application"</strong></li>
                    <li>Name it anything (e.g., "Calendar Sync Client")</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step-5" className="border-b-0">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">5</Badge>
                    Add Redirect URI
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-card-foreground pb-3">
                  <ol className="space-y-1.5 list-decimal list-inside ml-1">
                    <li>In the OAuth client creation screen, scroll to <strong>"Authorized redirect URIs"</strong></li>
                    <li>Click <strong>"+ Add URI"</strong></li>
                    <li>Paste this exact URI:</li>
                  </ol>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 bg-white text-slate-800 px-2 py-1.5 rounded text-[10px] break-all">
                      {redirectUri}
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 shrink-0"
                      onClick={copyRedirectUri}
                    >
                      {copiedUri ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <ol start={4} className="space-y-1.5 list-decimal list-inside ml-1 mt-2">
                    <li>Click <strong>"Create"</strong></li>
                    <li>Copy and save the <strong>Client ID</strong> and <strong>Client Secret</strong> shown</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step-6" className="border-b-0">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">6</Badge>
                    Connect Your Calendar
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs text-card-foreground pb-3">
                  <ol className="space-y-1.5 list-decimal list-inside ml-1">
                    <li>Click the <strong>"Connect Google Calendar"</strong> button below</li>
                    <li>Sign in with the <strong>same email</strong> you added as a test user</li>
                    <li>Click <strong>"Continue"</strong> on the "Google hasn't verified this app" warning</li>
                    <li>Grant calendar permissions when prompted</li>
                    <li>You'll be redirected back once connected</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button
              variant="link"
              className="h-auto p-0 text-xs mt-3"
              asChild
            >
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Google Cloud Console
              </a>
            </Button>
          </div>

          {/* Connect button - only when not connected */}
          {!isConnected && (
            <>
              {isInIframe ? (
                <Button asChild className="w-full">
                  <a href="/oauth/google-calendar" target="_blank" rel="noopener noreferrer">
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect Google Calendar
                  </a>
                </Button>
              ) : (
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="w-full"
                >
                  <Link2 className={`h-4 w-4 mr-2 ${connectMutation.isPending ? 'animate-spin' : ''}`} />
                  Connect Google Calendar
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing appointments with Google Calendar. 
              Existing events in Google Calendar will remain but won't be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
