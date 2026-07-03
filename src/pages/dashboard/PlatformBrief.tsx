import { useMemo, useState } from "react";
import { Download, Copy, RefreshCw, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LAUNCH_PRICING, formatPrice, type TierKey } from "@/lib/launchPricing";
import { AGENT_STYLES } from "@/lib/agentStyles";
import { buildPlatformBrief } from "@/lib/platformBrief";

export default function PlatformBrief() {
  const [generatedAt, setGeneratedAt] = useState<string>(() => new Date().toISOString());
  const brief = useMemo(() => buildPlatformBrief(generatedAt), [generatedAt]);
  const [copied, setCopied] = useState(false);

  const regenerate = () => setGeneratedAt(new Date().toISOString());

  const download = () => {
    const blob = new Blob([brief], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-intercept-platform-brief-${generatedAt.slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Platform brief downloaded");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    toast.success("Brief copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const tierCount = Object.keys(LAUNCH_PRICING.tiers).length;
  const uniqueAgentLabels = new Set(Object.values(AGENT_STYLES).map((a) => a.label));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Platform Brief Export</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              One-click markdown snapshot of the entire Aura Intercept platform — pricing, agents,
              consoles, edge functions, integrations, industry packs, and constraints. Paste it
              into Claude, ChatGPT, or any other assistant for full-context architectural advice.
              No secrets, no PII, no live data are included.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>
            <Download className="mr-2 h-4 w-4" /> Download .md
          </Button>
          <Button variant="outline" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" /> {copied ? "Copied" : "Copy to clipboard"}
          </Button>
          <Button variant="ghost" onClick={regenerate}>
            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pricing tiers" value={tierCount} />
          <StatCard label="Operative labels" value={uniqueAgentLabels.size} />
          <StatCard label="Edge functions" value={102} />
          <StatCard label="Routes" value={130} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Brief preview</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{brief.length.toLocaleString()} chars</Badge>
                <Badge variant="outline">
                  Generated {new Date(generatedAt).toLocaleString()}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words text-xs bg-muted/40 border rounded-md p-4 max-h-[60vh] overflow-y-auto font-mono">
              {brief}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to use with Claude</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click <strong>Download .md</strong> above (or Copy to clipboard).</li>
              <li>Open a new conversation in Claude, ChatGPT, or Codex.</li>
              <li>Attach the file (or paste the contents) as the first message.</li>
              <li>
                Add your question, e.g. <em>"Audit my AI operatives for redundancy"</em> or
                <em> "Suggest UX improvements to the technician console."</em>
              </li>
              <li>Regenerate anytime after platform changes — this is a snapshot, not a live feed.</li>
            </ol>
            <p className="pt-2 border-t border-border">
              To give Claude even deeper context, also share your GitHub repo URL (Plus menu →
              GitHub → Connect project) and a Share Preview link (Share → Share preview).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

// Silence unused warnings for imports kept for future extension
void formatPrice;
export type _TierKey = TierKey;