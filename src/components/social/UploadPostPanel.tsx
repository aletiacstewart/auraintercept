import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ExternalLink,
  Key,
  Link2,
  Loader2,
  RefreshCw,
  Share2,
  Unplug,
} from 'lucide-react';

interface UploadPostStatus {
  configured: boolean;
  needsApiKey?: boolean;
  profileExists?: boolean;
  profile?: string;
  enabled: boolean;
  autoPublish: boolean;
  accounts: { platform: string; username?: string | null }[];
  usingPlatformKey: boolean;
  lastSyncedAt?: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  threads: 'Threads',
  x: 'X (Twitter)',
  pinterest: 'Pinterest',
  google_business: 'Google Business',
};

async function callUploadPost(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('upload-post', { body: payload });
  if (error) {
    const details =
      typeof (error as any)?.context?.text === 'function'
        ? await (error as any).context.text()
        : error.message;
    throw new Error(details || error.message);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

interface UploadPostPanelProps {
  companyId?: string | null;
  companyLogoUrl?: string | null;
}

export function UploadPostPanel({ companyId, companyLogoUrl }: UploadPostPanelProps) {
  const queryClient = useQueryClient();
  const [apiKeyInput, setApiKeyInput] = useState('');

  const { data: status, isLoading } = useQuery<UploadPostStatus>({
    queryKey: ['upload-post-status', companyId],
    queryFn: () => callUploadPost({ action: 'status', companyId }),
    enabled: !!companyId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['upload-post-status', companyId] });

  const saveKey = useMutation({
    mutationFn: () => callUploadPost({ action: 'save_key', companyId, apiKey: apiKeyInput }),
    onSuccess: () => {
      toast.success('Upload-Post key saved');
      setApiKeyInput('');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const connect = useMutation({
    mutationFn: () =>
      callUploadPost({
        action: 'connect_link',
        companyId,
        redirectUrl: window.location.href,
        logoUrl: companyLogoUrl || undefined,
      }),
    onSuccess: (res: any) => {
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        toast.success('Connect your accounts in the new tab, then hit Refresh');
      } else {
        toast.error('Upload-Post did not return a connect link');
      }
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSettings = useMutation({
    mutationFn: (patch: { enabled?: boolean; autoPublish?: boolean }) =>
      callUploadPost({ action: 'settings', companyId, ...patch }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: () => callUploadPost({ action: 'disconnect', companyId }),
    onSuccess: () => {
      toast.success('Disconnected from Upload-Post');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sign in to a company workspace to set up automatic posting.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your posting connection...
      </div>
    );
  }

  const accounts = status?.accounts ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-2">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Automatic Posting</CardTitle>
            </div>
            {accounts.length > 0 ? (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {accounts.length} account{accounts.length === 1 ? '' : 's'} connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Not connected</Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Connect your social accounts once, and your Social Media agent can publish approved posts
            for you. Upload-Post is billed to you directly by Upload-Post.com, separately from your
            Aura plan.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status?.needsApiKey || !status?.configured ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Key className="h-3.5 w-3.5" /> Upload-Post API key
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Upload-Post API key"
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => saveKey.mutate()}
                  disabled={!apiKeyInput.trim() || saveKey.isPending}
                >
                  {saveKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find it in your Upload-Post dashboard under API Keys.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => connect.mutate()} disabled={connect.isPending} className="gap-2">
                  {connect.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {accounts.length > 0 ? 'Manage accounts' : 'Connect accounts'}
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </Button>
                <Button variant="outline" onClick={() => invalidate()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Unplug className="h-4 w-4" /> Disconnect
                </Button>
              </div>

              {accounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((a) => (
                    <Badge key={a.platform} variant="secondary" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      {PLATFORM_LABELS[a.platform] ?? a.platform}
                      {a.username ? <span className="opacity-70">· {a.username}</span> : null}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-3 rounded-lg border border-border/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Publish through Upload-Post</p>
                    <p className="text-xs text-muted-foreground">
                      Send approved posts to your connected accounts.
                    </p>
                  </div>
                  <Switch
                    checked={!!status?.enabled}
                    onCheckedChange={(v) => updateSettings.mutate({ enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Post automatically</p>
                    <p className="text-xs text-muted-foreground">
                      Off: scheduled posts wait for your approval. On: they go out on schedule.
                    </p>
                  </div>
                  <Switch
                    checked={!!status?.autoPublish}
                    disabled={!status?.enabled}
                    onCheckedChange={(v) => updateSettings.mutate({ autoPublish: v })}
                  />
                </div>
              </div>

              {status?.usingPlatformKey && (
                <p className="text-xs text-muted-foreground">
                  Using the Aura Intercept Upload-Post account. Add your own key above to bill and
                  manage it yourself.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
