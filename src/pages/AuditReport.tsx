import { useMemo, useState } from "react";
import { AUDIT_FINDINGS, AUDIT_DATE, type Severity, type Area, type AuditFinding } from "@/lib/auditFindings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";

const SEVERITY_ORDER: Severity[] = ["P0", "P1", "P2", "P3"];
const SEVERITY_TONE: Record<Severity, string> = {
  P0: "bg-destructive/15 text-destructive border-destructive/40",
  P1: "bg-orange-500/15 text-orange-500 border-orange-500/40",
  P2: "bg-amber-500/15 text-amber-500 border-amber-500/40",
  P3: "bg-muted text-muted-foreground border-border",
};

const ALL_AREAS = Array.from(new Set(AUDIT_FINDINGS.map((f) => f.area))) as Area[];

export default function AuditReport() {
  const [severity, setSeverity] = useState<Severity | "ALL">("ALL");
  const [area, setArea] = useState<Area | "ALL">("ALL");

  const filtered = useMemo(() => {
    return AUDIT_FINDINGS.filter(
      (f) => (severity === "ALL" || f.severity === severity) && (area === "ALL" || f.area === area),
    ).sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  }, [severity, area]);

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
    AUDIT_FINDINGS.forEach((f) => (c[f.severity] += 1));
    return c;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO path="/dashboard/audit-report" title="Platform Audit Report — Aura Intercept" description="Internal audit findings across consoles, agents, help, CSS and integrations." />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">Platform Operations · {AUDIT_DATE}</p>
          <h1 className="text-3xl font-semibold">Platform Audit Report</h1>
          <p className="text-muted-foreground max-w-2xl">
            Read-only audit across every console, dashboard, agent, help doc, guide, layout, workflow, handoff,
            integration setup, and settings page. Findings are sorted by severity. Click a file path to copy it.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEVERITY_ORDER.map((s) => (
            <Card key={s} className="p-4 surface-elevated-dark border-border/50">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={SEVERITY_TONE[s]}>{s}</Badge>
                <span className="text-2xl font-semibold">{counts[s]}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {s === "P0" && "Broken / security"}
                {s === "P1" && "Standard / naming violation"}
                {s === "P2" && "Cosmetic / CSS drift"}
                {s === "P3" && "Polish"}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-4 surface-elevated-dark border-border/50 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mr-2">Severity</span>
            {(["ALL", ...SEVERITY_ORDER] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={severity === s ? "default" : "outline"}
                onClick={() => setSeverity(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mr-2">Area</span>
            <Button size="sm" variant={area === "ALL" ? "default" : "outline"} onClick={() => setArea("ALL")}>ALL</Button>
            {ALL_AREAS.map((a) => (
              <Button key={a} size="sm" variant={area === a ? "default" : "outline"} onClick={() => setArea(a)}>
                {a}
              </Button>
            ))}
          </div>
        </Card>

        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground font-medium">{filtered.length}</span> of {AUDIT_FINDINGS.length} findings.
          Full markdown report:{" "}
          <a
            href="/__l5e/documents/platform-audit-2026-05-16.md"
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            platform-audit-2026-05-16.md
          </a>
        </p>

        <div className="space-y-3">
          {filtered.map((f) => (
            <FindingCard key={f.id} f={f} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FindingCard({ f }: { f: AuditFinding }) {
  return (
    <Card className="p-4 surface-elevated-dark border-border/50 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>
            <Badge variant="outline" className="text-xs">{f.area}</Badge>
            <Badge variant="outline" className="text-xs">fix: {f.fixSize}</Badge>
          </div>
          <h3 className="font-medium leading-snug">{f.title}</h3>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Observed</p>
          <p className="text-card-foreground/90">{f.observed}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Expected</p>
          <p className="text-card-foreground/90">{f.expected}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Files</p>
        <ul className="text-sm font-mono text-card-foreground/80 space-y-0.5">
          {f.files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                className="text-left hover:text-primary"
                onClick={() => navigator.clipboard?.writeText(file.path)}
                title="Copy path"
              >
                {file.path}
                {file.lines ? <span className="text-muted-foreground">:{file.lines}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {f.memoryRef && (
        <p className="text-xs text-muted-foreground">
          Standard: <span className="font-mono">{f.memoryRef}</span>
        </p>
      )}
    </Card>
  );
}