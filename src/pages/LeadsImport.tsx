import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ACCEPT = ".csv,.xlsx,.xls,.pdf,.docx";
const MAX_BYTES = 20 * 1024 * 1024;

export default function LeadsImport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [autoMode, setAutoMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState<string>('history');

  useEffect(() => {
    const jobParam = searchParams.get('job');
    if (jobParam) {
      setActiveJob(jobParam);
      setDefaultTab('review');
    }
  }, [searchParams]);

  const { data: profile } = useQuery({
    queryKey: ["profile-co", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("company_id").eq("id", user!.id).single();
      return data;
    },
  });
  const companyId = profile?.company_id;

  const { data: jobs = [] } = useQuery({
    queryKey: ["lead-import-jobs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("lead_import_jobs").select("*").eq("company_id", companyId!).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    refetchInterval: 4000,
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["lead-import-rows", activeJob],
    enabled: !!activeJob,
    queryFn: async () => {
      const { data } = await supabase.from("lead_import_rows").select("*").eq("job_id", activeJob!).order("row_index");
      return data || [];
    },
    refetchInterval: 4000,
  });

  const handleUpload = async (file: File) => {
    if (!companyId) { toast.error("No company"); return; }
    if (file.size > MAX_BYTES) { toast.error("File too large (20MB max)"); return; }
    setUploading(true);
    try {
      const path = `${companyId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("lead-imports").upload(path, file);
      if (upErr) throw upErr;
      const { data: job, error: jobErr } = await supabase.from("lead_import_jobs").insert({
        company_id: companyId,
        uploaded_by: user!.id,
        source_filename: file.name,
        mime_type: file.type,
        storage_path: path,
        mode: autoMode ? "auto" : "review",
        status: "uploaded",
      }).select().single();
      if (jobErr) throw jobErr;
      await supabase.functions.invoke("lead-import-parse", { body: { job_id: job.id } });
      toast.success("Uploaded — Leads AI is parsing");
      setActiveJob(job.id);
      qc.invalidateQueries({ queryKey: ["lead-import-jobs", companyId] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const commitMut = useMutation({
    mutationFn: async ({ job_id, row_ids, approve_all }: { job_id: string; row_ids?: string[]; approve_all?: boolean }) => {
      const { error } = await supabase.functions.invoke("lead-import-commit", { body: { job_id, row_ids, approve_all } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Leads imported");
      qc.invalidateQueries({ queryKey: ["lead-import-rows", activeJob] });
      qc.invalidateQueries({ queryKey: ["lead-import-jobs", companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectRow = async (id: string) => {
    await supabase.from("lead_import_rows").update({ decision: "rejected" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["lead-import-rows", activeJob] });
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Upload}
            title="Import Old Leads"
            description="Upload CSV, Excel, PDF, or Word. Aura's Leads agent parses and adds them."
            featureColor="integrations"
            action={
              <Button aria-label="Back" variant="ghost" size="icon" asChild>
                <Link to="/dashboard/leads"><ArrowLeft className="w-4 h-4" /></Link>
              </Button>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-primary" /> Upload a file</CardTitle>
              <CardDescription>Accepted: .csv, .xlsx, .xls, .pdf, .docx (max 20 MB)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border border-border/60 bg-muted/30">
                <div>
                  <Label className="font-medium">Auto-add & dedupe</Label>
                  <p className="text-xs text-muted-foreground">Off = review each row before importing. On = import immediately, skip duplicates.</p>
                </div>
                <Switch checked={autoMode} onCheckedChange={setAutoMode} />
              </div>

              <label className="block">
                <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center hover:bg-muted/30 cursor-pointer transition-colors">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  )}
                  <p className="mt-2 text-sm">{uploading ? "Uploading…" : "Click or drop a file here"}</p>
                </div>
                <input
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
                />
              </label>

              <Alert>
                <AlertDescription className="text-xs">
                  The Leads AI agent reads your file, extracts name / email / phone / address / notes, and deduplicates against existing leads. PDFs and Word docs are normalized by the AI.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Tabs value={defaultTab} onValueChange={setDefaultTab}>
            <TabsList>
              <TabsTrigger value="history">Import history</TabsTrigger>
              <TabsTrigger value="review" disabled={!activeJob}>Review {activeJob ? `(${rows.filter((r: any) => r.decision === "pending").length})` : ""}</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-2">
              {jobs.length === 0 && <p className="text-sm text-muted-foreground">No imports yet.</p>}
              {jobs.map((j: any) => (
                <Card key={j.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setActiveJob(j.id)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{j.source_filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(j.created_at).toLocaleString()} · {j.mode} · {j.total_rows} rows · {j.imported_count} imported · {j.duplicate_count} dup · {j.error_count} err
                      </p>
                    </div>
                    <Badge variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "outline"}>{j.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="review">
              {activeJob && (
                <Card>
                  <CardHeader className="flex flex-row justify-between items-start space-y-0">
                    <div>
                      <CardTitle className="text-base">Review rows</CardTitle>
                      <CardDescription>Approve or reject each parsed row.</CardDescription>
                    </div>
                    <Button size="sm" disabled={commitMut.isPending || rows.filter((r: any) => r.decision === "pending").length === 0}
                            onClick={() => commitMut.mutate({ job_id: activeJob!, approve_all: true })}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve all pending
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r: any) => {
                          const n = r.normalized || {};
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs text-muted-foreground">{r.row_index + 1}</TableCell>
                              <TableCell>{n.name || "—"}</TableCell>
                              <TableCell>{n.email || "—"}</TableCell>
                              <TableCell>{n.phone || "—"}</TableCell>
                              <TableCell>
                                {r.decision === "duplicate" ? (
                                  <Badge variant="outline" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />duplicate</Badge>
                                ) : (
                                  <Badge variant={r.decision === "imported" ? "default" : r.decision === "rejected" || r.decision === "error" ? "destructive" : "outline"} className="text-xs">{r.decision}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {r.decision === "pending" && (
                                  <div className="flex gap-1 justify-end">
                                    <Button size="sm" variant="outline" onClick={() => commitMut.mutate({ job_id: activeJob!, row_ids: [r.id] })}>Add</Button>
                                    <Button size="sm" variant="ghost" onClick={() => rejectRow(r.id)}>Skip</Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}