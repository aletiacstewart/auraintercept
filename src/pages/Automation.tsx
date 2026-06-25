import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bot, CheckCircle2, Clock, Info, ShieldAlert, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ActionPreview } from "@/components/automation/ActionPreview";

const AGENTS: { id: string; label: string; description: string }[] = [
  { id: "triage", label: "Front Desk (Triage)", description: "Greets callers, answers FAQs, routes requests." },
  { id: "customer_journey", label: "Customer Journey", description: "Books appointments, reminders, follow-ups, reviews." },
  { id: "outreach", label: "Outreach & Sales", description: "Quote nudges, re-engagement, lead drip." },
  { id: "creative_content", label: "Creative Content", description: "Drafts social, blog, and campaign content." },
  { id: "web_presence", label: "Web Presence", description: "Updates site content, FAQs, knowledge base." },
  { id: "dispatch", label: "Dispatch", description: "Assigns jobs to technicians by skill, load, proximity." },
  { id: "field_navigation", label: "Field Navigation", description: "Route, ETA, on-the-way SMS, check-in." },
  { id: "business_finance", label: "Business & Finance", description: "Invoices, payments, collections, reporting." },
  { id: "analytics_intelligence", label: "Analytics Intelligence", description: "KPIs, anomaly alerts, forecasts." },
  { id: "admin", label: "Admin Assistant", description: "Internal tasks, scheduling, ops housekeeping." },
];

const MODE_LABEL: Record<string, string> = {
  off: "Off",
  suggest: "Approval-first",
  auto_safe: "Auto (safe)",
  auto_all: "Auto (all)",
};

type AutonomyRow = {
  id?: string;
  company_id: string;
  agent_id: string;
  mode: "off" | "suggest" | "auto_safe" | "auto_all";
  confidence_threshold: number;
  max_value_usd: number;
  daily_action_cap: number;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

type ProposedAction = {
  id: string;
  agent_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  risk_tier: "low" | "medium" | "high";
  confidence: number;
  estimated_value_usd: number;
  status: string;
  result_summary: string | null;
  created_at: string;
  executed_at: string | null;
};

const STATUS_FILTERS: { id: string; label: string; matches: (s: string) => boolean }[] = [
  { id: "all", label: "All", matches: () => true },
  { id: "pending", label: "Awaiting approval", matches: (s) => s === "pending" },
  { id: "auto_executed", label: "Auto-executed", matches: (s) => s === "auto_executed" },
  { id: "approved", label: "Approved", matches: (s) => s === "approved" },
  { id: "rejected", label: "Rejected", matches: (s) => s === "rejected" },
  { id: "failed", label: "Failed", matches: (s) => s === "failed" || s.startsWith("failed") },
];

export default function Automation() {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, AutonomyRow>>({});
  const [pageSize, setPageSize] = useState(50);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["agent-autonomy", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_agent_autonomy")
        .select("*")
        .eq("company_id", companyId!);
      if (error) throw error;
      return (data ?? []) as AutonomyRow[];
    },
  });

  useEffect(() => {
    if (!settings || !companyId) return;
    const next: Record<string, AutonomyRow> = {};
    for (const a of AGENTS) {
      const existing = settings.find((s) => s.agent_id === a.id);
      next[a.id] = existing ?? {
        company_id: companyId,
        agent_id: a.id,
        mode: "suggest",
        confidence_threshold: 0.8,
        max_value_usd: 100,
        daily_action_cap: 50,
        quiet_hours_start: null,
        quiet_hours_end: null,
      };
    }
    setDrafts(next);
  }, [settings, companyId]);

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ["proposed-actions", companyId],
    enabled: !!companyId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_proposed_actions")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ProposedAction[];
    },
  });

  // Realtime: surface new agent actions instantly instead of waiting for poll
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`agent-actions-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_proposed_actions", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["proposed-actions", companyId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, qc]);

  const pending = useMemo(() => queue?.filter((a) => a.status === "pending") ?? [], [queue]);

  const filtered = useMemo(() => {
    const all = queue ?? [];
    const statusDef = STATUS_FILTERS.find((s) => s.id === statusFilter) ?? STATUS_FILTERS[0];
    return all.filter((a) =>
      statusDef.matches(a.status) && (agentFilter === "all" || a.agent_id === agentFilter),
    );
  }, [queue, statusFilter, agentFilter]);

  const visibleRecent = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);
  const totalRecent = filtered.length;

  const knownAgents = useMemo(() => {
    const ids = new Set<string>(AGENTS.map((a) => a.id));
    (queue ?? []).forEach((a) => ids.add(a.agent_id));
    return Array.from(ids);
  }, [queue]);

  async function saveAgent(agentId: string) {
    const row = drafts[agentId];
    if (!row || !companyId) return;
    const { error } = await supabase
      .from("company_agent_autonomy")
      .upsert(row, { onConflict: "company_id,agent_id" });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: `${agentId} autonomy updated.` });
    qc.invalidateQueries({ queryKey: ["agent-autonomy", companyId] });
  }

  async function review(id: string, op: "approve" | "reject") {
    const { error } = await supabase.functions.invoke(
      `agent-action-executor?op=${op}`,
      { body: { id } },
    );
    if (error) {
      toast({ title: `${op} failed`, description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["proposed-actions", companyId] });
  }

  function updateDraft(agentId: string, patch: Partial<AutonomyRow>) {
    setDrafts((d) => ({ ...d, [agentId]: { ...d[agentId], ...patch } }));
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          icon={Bot}
          title="Automation"
          description="Decide how autonomously each AI operative acts on your behalf — and review what they did."
          featureColor="platform"
        />

        <Tabs defaultValue="inbox" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inbox">
              Action Queue
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Per-Agent Settings</TabsTrigger>
            <TabsTrigger value="history">
              Recent Activity
              {(queue?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">{queue!.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-3">
            {queueLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : pending.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                  Nothing pending. Aura will queue actions here when human approval is required.
                </CardContent>
              </Card>
            ) : (
              pending.map((a) => (
                <Card key={a.id}>
                  <CardContent className="py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{a.agent_id}</Badge>
                        <span className="font-medium">{a.action_type}</span>
                        <Badge
                          variant={a.risk_tier === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {a.risk_tier} risk · {(a.confidence * 100).toFixed(0)}% conf
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {a.result_summary ?? "Awaiting approval"} ·{" "}
                        {formatDistanceToNow(new Date(a.created_at))} ago
                      </p>
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View preview
                        </summary>
                        <div className="mt-2">
                          <ActionPreview actionType={a.action_type} payload={a.payload as Record<string, unknown>} />
                        </div>
                      </details>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => review(a.id, "approve")}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => review(a.id, "reject")}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-3">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm space-y-1.5">
                  <p className="font-medium text-foreground">What these limits mean</p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">Min Confidence</span> — How sure the agent must be (0.00–1.00) before acting on its own. Anything below this is sent to your Action Queue for approval. Higher = stricter.
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">Max Value / Action ($)</span> — The largest dollar amount the agent can commit in a single action (refund, discount, ad spend, quote send, etc.). Actions above this dollar value require your approval.
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">Daily Auto Cap</span> — The maximum number of auto-executed actions this agent can take per day. Once hit, everything else queues for approval until tomorrow.
                  </p>
                </div>
              </CardContent>
            </Card>
            {settingsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              AGENTS.map((agent) => {
                const d = drafts[agent.id];
                if (!d) return null;
                return (
                  <Card key={agent.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-base">{agent.label}</CardTitle>
                          <CardDescription>{agent.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{MODE_LABEL[d.mode]}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div>
                        <Label className="text-xs">Mode</Label>
                        <Select value={d.mode} onValueChange={(v) => updateDraft(agent.id, { mode: v as AutonomyRow["mode"] })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            <SelectItem value="suggest">Approval-first</SelectItem>
                            <SelectItem value="auto_safe">Auto (safe only)</SelectItem>
                            <SelectItem value="auto_all">Auto (everything)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Min confidence</Label>
                        <Input
                          type="number" min={0} max={1} step={0.05}
                          value={d.confidence_threshold}
                          onChange={(e) => updateDraft(agent.id, { confidence_threshold: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max value / action ($)</Label>
                        <Input
                          type="number" min={0} step={10}
                          value={d.max_value_usd}
                          onChange={(e) => updateDraft(agent.id, { max_value_usd: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Daily auto cap</Label>
                        <Input
                          type="number" min={0} step={1}
                          value={d.daily_action_cap}
                          onChange={(e) => updateDraft(agent.id, { daily_action_cap: Number(e.target.value) })}
                        />
                      </div>
                      <Button size="sm" onClick={() => saveAgent(agent.id)}>Save</Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            <Card className="border-border/60">
              <CardContent className="py-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Status:</span>
                {STATUS_FILTERS.map((s) => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant={statusFilter === s.id ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
                <span className="text-xs text-muted-foreground ml-3 mr-1">Agent:</span>
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All agents</SelectItem>
                    {knownAgents.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="ml-auto text-xs text-muted-foreground">
                  Showing {Math.min(pageSize, totalRecent)} of {totalRecent}
                </span>
              </CardContent>
            </Card>
            {queueLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : visibleRecent.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                No activity matches these filters.
              </CardContent></Card>
            ) : (
              <>
                {visibleRecent.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="py-3 space-y-2">
                      <div className="flex items-center gap-3">
                        {a.status === "auto_executed" || a.status === "approved" ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : a.status === "rejected" ? (
                          <X className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : a.status === "failed" || a.status.startsWith("failed") ? (
                          <X className="w-4 h-4 text-destructive shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-accent shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{a.agent_id}</Badge>
                            <span>{a.action_type}</span>
                            <Badge variant="secondary" className="text-[10px]">{a.status.replace("_", " ")}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(a.created_at))} ago
                            {a.result_summary ? ` · ${a.result_summary}` : ""}
                          </div>
                        </div>
                      </div>
                      <details>
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View preview
                        </summary>
                        <div className="mt-2">
                          <ActionPreview actionType={a.action_type} payload={a.payload as Record<string, unknown>} />
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
                {totalRecent > pageSize && (
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setPageSize((n) => n + 50)}>
                      Load 50 more
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </DashboardLayout>
  );
}