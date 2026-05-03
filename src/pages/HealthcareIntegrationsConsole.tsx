import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldOff, CheckCircle2, AlertTriangle, Plug } from "lucide-react";
import {
  HEALTHCARE_INTEGRATIONS,
  HEALTHCARE_INTEGRATIONS_OUT_OF_SCOPE,
  OUT_OF_SCOPE_REASON,
  type HealthcareIntegrationDef,
} from "@/lib/integrations/healthcare/registry";

interface CompanyIntegrationRow {
  id: string;
  provider_key: string;
  status: string;
  config: Record<string, unknown>;
  last_synced_at: string | null;
  last_error: string | null;
}

export default function HealthcareIntegrationsConsole() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const qc = useQueryClient();
  const [editing, setEditing] = useState<HealthcareIntegrationDef | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});

  const { data: rows, isLoading } = useQuery({
    queryKey: ["company_integrations", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<CompanyIntegrationRow[]> => {
      const { data, error } = await supabase
        .from("company_integrations")
        .select("id, provider_key, status, config, last_synced_at, last_error")
        .eq("company_id", companyId!);
      if (error) throw error;
      return (data ?? []) as CompanyIntegrationRow[];
    },
  });

  const byKey = new Map((rows ?? []).map((r) => [r.provider_key, r]));

  const upsert = useMutation({
    mutationFn: async ({ key, config }: { key: string; config: Record<string, unknown> }) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase.from("company_integrations").upsert(
        {
          company_id: companyId,
          provider_key: key,
          status: "connected",
          config,
          connected_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "company_id,provider_key" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integration saved");
      qc.invalidateQueries({ queryKey: ["company_integrations", companyId] });
      setEditing(null);
      setFormState({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: async (key: string) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("company_integrations")
        .update({ status: "not_connected", config: {}, connected_at: null })
        .eq("company_id", companyId)
        .eq("provider_key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Disconnected");
      qc.invalidateQueries({ queryKey: ["company_integrations", companyId] });
    },
  });

  const openConfigure = (def: HealthcareIntegrationDef) => {
    const existing = byKey.get(def.key);
    setFormState((existing?.config as Record<string, string>) ?? {});
    setEditing(def);
  };

  const handleSave = () => {
    if (!editing) return;
    for (const f of editing.fields) {
      if (f.required && !formState[f.name]?.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    upsert.mutate({ key: editing.key, config: formState });
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Healthcare Integrations"
          description="Optional connections for calendars, staff messaging, and recall lists. Scope is limited to scheduling + front-desk notifications — no PMS, EHR, clearinghouse, pharmacy, or lab connectors."
        />

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {HEALTHCARE_INTEGRATIONS.map((def) => {
              const row = byKey.get(def.key);
              const status = row?.status ?? "not_connected";
              const Icon = def.icon;
              return (
                <Card key={def.key} className="flex flex-col">
                  <CardHeader className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{def.label}</CardTitle>
                      </div>
                      <StatusPill status={status} />
                    </div>
                    <CardDescription className="mt-2 text-xs leading-relaxed">
                      {def.description}
                    </CardDescription>
                    {row?.last_error && (
                      <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {row.last_error}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex gap-2 pt-0">
                    <Button size="sm" onClick={() => openConfigure(def)} className="flex-1">
                      {status === "connected" ? "Configure" : "Connect"}
                    </Button>
                    {status === "connected" && (
                      <Button size="sm" variant="ghost" onClick={() => disconnect.mutate(def.key)}>
                        Disconnect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Not Supported — Out of Scope</CardTitle>
              </div>
              <CardDescription className="text-xs">{OUT_OF_SCOPE_REASON}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {HEALTHCARE_INTEGRATIONS_OUT_OF_SCOPE.map((p) => (
                <Badge key={p.key} variant="outline" className="opacity-60">
                  {p.label}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.label}</DialogTitle>
            <DialogDescription>{editing?.description}</DialogDescription>
          </DialogHeader>
          {editing?.fields.length ? (
            <div className="space-y-3">
              {editing.fields.map((f) => (
                <div key={f.name} className="space-y-1">
                  <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                  <Input
                    id={f.name}
                    type={f.type === "password" ? "password" : "text"}
                    placeholder={f.placeholder}
                    value={formState[f.name] ?? ""}
                    onChange={(e) => setFormState((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                  {f.helper && <p className="text-xs text-muted-foreground">{f.helper}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Plug className="inline h-4 w-4 mr-1" />
              This integration uses OAuth. Click Save to mark as connected — you'll be redirected to the provider on first use.
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save & Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "connected")
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> Connected
      </Badge>
    );
  if (status === "action_needed")
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" /> Action needed
      </Badge>
    );
  return <Badge variant="outline">Not connected</Badge>;
}