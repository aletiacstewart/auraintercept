import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Database, ExternalLink, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { CRM_PROVIDERS, type CrmProviderId, getCrmProvider } from "@/lib/crmProviders";

export default function CRMIntegration() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openProvider, setOpenProvider] = useState<CrmProviderId | null>(null);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [syncDirection, setSyncDirection] = useState<"push" | "pull" | "two_way">("two_way");

  const { data: profile } = useQuery({
    queryKey: ["profile-company", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("company_id").eq("id", user!.id).single();
      return data;
    },
  });
  const companyId = profile?.company_id;

  const { data: connections = [], refetch } = useQuery({
    queryKey: ["crm-connections", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("crm_connections").select("*").eq("company_id", companyId!);
      return data || [];
    },
  });

  const openSetup = (id: CrmProviderId) => {
    const existing = connections.find((c: any) => c.provider === id);
    setCreds(((existing?.credentials as Record<string, string>) || {}) as Record<string, string>);
    setSyncDirection((existing?.sync_direction as any) || "two_way");
    setOpenProvider(id);
  };

  const testMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("crm-test-connection", {
        body: { provider: openProvider, credentials: creds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Connected: ${r.label || "OK"}`);
      else toast.error(`Test failed: ${r?.error}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!companyId || !openProvider) throw new Error("Missing context");
      const test = await supabase.functions.invoke("crm-test-connection", {
        body: { provider: openProvider, credentials: creds },
      });
      const ok = (test.data as any)?.ok;
      const { error } = await supabase.from("crm_connections").upsert({
        company_id: companyId,
        provider: openProvider,
        auth_type: getCrmProvider(openProvider)!.authType,
        credentials: creds,
        sync_direction: syncDirection,
        status: ok ? "connected" : "error",
        external_account_label: (test.data as any)?.label,
        last_error: ok ? null : (test.data as any)?.error,
      }, { onConflict: "company_id,provider" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("CRM connection saved");
      qc.invalidateQueries({ queryKey: ["crm-connections", companyId] });
      setOpenProvider(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const syncMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("crm-sync-leads", { body: { company_id: companyId, mode: "both" } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sync started"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Disconnected");
      qc.invalidateQueries({ queryKey: ["crm-connections", companyId] });
    },
  });

  const provider = openProvider ? getCrmProvider(openProvider) : null;

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Database}
            title="CRM Integration"
            description="Connect your CRM to sync leads two ways"
            featureColor="integrations"
            action={
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard/integrations"><ArrowLeft className="w-4 h-4" /></Link>
              </Button>
            }
          />

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>You bring your own CRM account</AlertTitle>
            <AlertDescription>
              Aura connects to your existing CRM using your credentials. Your CRM vendor bills you directly for their plan — Aura never marks up or resells CRM usage.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CRM_PROVIDERS.map((p) => {
              const conn = connections.find((c: any) => c.provider === p.id);
              const status = conn?.status || "disconnected";
              return (
                <Card key={p.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <Badge variant={status === "connected" ? "default" : status === "error" ? "destructive" : "outline"}>
                        {status}
                      </Badge>
                    </div>
                    <CardDescription>{p.blurb}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {conn?.last_sync_at && (
                      <p className="text-xs text-muted-foreground">Last sync: {new Date(conn.last_sync_at).toLocaleString()}</p>
                    )}
                    {conn?.last_error && (
                      <p className="text-xs text-destructive">Error: {conn.last_error}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant={conn ? "outline" : "default"} onClick={() => openSetup(p.id)}>
                        {conn ? "Edit" : "Connect"}
                      </Button>
                      {conn && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
                            {syncMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            <span className="ml-1">Sync now</span>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => disconnectMut.mutate(conn.id)}>Disconnect</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Sheet open={!!openProvider} onOpenChange={(o) => !o && setOpenProvider(null)}>
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            {provider && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {provider.name}
                    {provider.docsUrl && (
                      <a href={provider.docsUrl} target="_blank" rel="noreferrer" className="text-muted-foreground">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </SheetTitle>
                  <SheetDescription>{provider.blurb}</SheetDescription>
                </SheetHeader>

                <div className="space-y-5 py-4">
                  <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                    <p className="font-medium mb-2">Setup steps</p>
                    <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                      {provider.instructions.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>

                  {provider.costNote && (
                    <Alert>
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertDescription className="text-xs">{provider.costNote}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {provider.fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label>{f.label}{f.required && " *"}</Label>
                        <Input
                          type={f.type}
                          placeholder={f.placeholder}
                          value={creds[f.key] || ""}
                          onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
                        />
                        {f.helpText && <p className="text-xs text-muted-foreground">{f.helpText}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sync direction</Label>
                    <Select value={syncDirection} onValueChange={(v) => setSyncDirection(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="two_way">Two-way (push + pull)</SelectItem>
                        <SelectItem value="push">Push only (Aura → CRM)</SelectItem>
                        <SelectItem value="pull">Pull only (CRM → Aura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={() => testMut.mutate()} disabled={testMut.isPending} variant="outline">
                      {testMut.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Test connection
                    </Button>
                    <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                      {saveMut.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Save & connect
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </PageContainer>
    </DashboardLayout>
  );
}