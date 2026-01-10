import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Copy, RefreshCw, Check, Smartphone, Monitor, Server } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface CalDAVSubscriptionProps {
  type: 'employee' | 'company';
  title?: string;
  description?: string;
}

export function CalDAVSubscription({ 
  type, 
  title = type === 'employee' ? 'My CalDAV Sync' : 'Company CalDAV Sync',
  description = type === 'employee' 
    ? 'Two-way sync your jobs with any CalDAV calendar'
    : 'Two-way sync all company appointments with CalDAV'
}: CalDAVSubscriptionProps) {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch the calendar feed token
  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['caldav-token', type, type === 'employee' ? user?.id : companyId],
    queryFn: async () => {
      if (type === 'employee' && user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('calendar_feed_token')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        return data?.calendar_feed_token;
      } else if (type === 'company' && companyId) {
        const { data, error } = await supabase
          .from('companies')
          .select('calendar_feed_token')
          .eq('id', companyId)
          .single();
        if (error) throw error;
        return data?.calendar_feed_token;
      }
      return null;
    },
    enabled: type === 'employee' ? !!user?.id : !!companyId,
  });

  // Regenerate token
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const newToken = crypto.randomUUID();
      if (type === 'employee' && user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ calendar_feed_token: newToken })
          .eq('id', user.id);
        if (error) throw error;
      } else if (type === 'company' && companyId) {
        const { error } = await supabase
          .from('companies')
          .update({ calendar_feed_token: newToken })
          .eq('id', companyId);
        if (error) throw error;
      }
      return newToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caldav-token', type] });
      toast.success('CalDAV URL regenerated. Old connections will stop working.');
    },
    onError: () => {
      toast.error('Failed to regenerate CalDAV URL');
    },
  });

  const caldavUrl = tokenData 
    ? `${SUPABASE_URL}/functions/v1/caldav-server/${type}/${tokenData}/`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caldavUrl);
      setCopied(true);
      toast.success('CalDAV URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-card-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-card-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
            <Badge variant="outline" className="text-xs text-card-foreground">
              Two-Way Sync
            </Badge>
            <Badge variant="outline" className="text-xs text-card-foreground">
              Apple / Android / Thunderbird
            </Badge>
          </div>

          {tokenData ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={caldavUrl}
                  readOnly
                  className="font-mono text-xs bg-white text-slate-800"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setInstructionsOpen(true)}
                  className="flex-1 min-w-[150px]"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Setup Instructions
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                  title="Generate new URL (old connections will stop working)"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-card-foreground">
              CalDAV sync not available. Please contact support.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>CalDAV Setup Instructions</DialogTitle>
            <DialogDescription>
              Two-way sync - changes you make in your calendar app will sync back
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">iPhone / Apple Calendar</h4>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Settings → Calendar → Accounts</li>
                <li>Tap "Add Account" → "Other"</li>
                <li>Tap "Add CalDAV Account"</li>
                <li>Enter Server: paste the URL above</li>
                <li>Username and Password: leave empty or enter anything</li>
                <li>Tap "Next" to verify and save</li>
              </ol>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Android (DAVx⁵)</h4>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Install DAVx⁵ from Play Store or F-Droid</li>
                <li>Tap "+" to add a new account</li>
                <li>Select "Login with URL"</li>
                <li>Paste the CalDAV URL above</li>
                <li>Username/Password: enter anything</li>
                <li>Select the calendar to sync</li>
              </ol>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">Outlook / Thunderbird / Other Clients</h4>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open Calendar settings</li>
                <li>Add a new CalDAV calendar (Outlook requires a CalDAV add-in)</li>
                <li>Paste the URL above as the server address</li>
                <li>Credentials: leave empty or enter anything</li>
              </ol>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>Two-Way Sync:</strong> Changes you make in your calendar app 
                (reschedule, cancel) will automatically sync back to the platform.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
