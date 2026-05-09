import { useAuth } from "@/contexts/AuthContext";
import { useTavilyUsage } from "@/hooks/useTavilyUsage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Shield } from "lucide-react";

export default function TavilyLimits() {
  const { companyId } = useAuth();
  const { monthly, recent, loading, refresh } = useTavilyUsage(companyId);

  const pct = monthly ? Math.min(100, Math.round((monthly.credits / Math.max(1, monthly.cap)) * 100)) : 0;

  const statusVariant = (s: string): "default" | "secondary" | "destructive" => {
    if (s === "sent") return "default";
    if (s === "blocked_monthly") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Tavily Research Limits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tavily AI research is capped at 1,000 credits/month per company — shared
            across the company, its employees, and its customers. Credits reset on the
            1st of every month and unused credits do not roll over.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This month</CardTitle>
          <CardDescription>{monthly?.period_key}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{monthly?.credits ?? 0}</span>
            <span className="text-muted-foreground">/ {monthly?.cap ?? 1000} credits</span>
          </div>
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">{pct}% of monthly credits used</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit costs</CardTitle>
          <CardDescription>How each Tavily operation consumes credits.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-1 text-muted-foreground">
          <p>· Search (Basic): <strong>1 credit</strong> / query</p>
          <p>· Search (Advanced): <strong>2 credits</strong> / query</p>
          <p>· Extract (Basic): <strong>1 credit</strong> per 5 URLs</p>
          <p>· Extract (Advanced): <strong>2 credits</strong> per 5 URLs</p>
          <p>· Map (Basic): 1 credit per 10 URLs · Map (with instructions): 1 credit per 5 URLs</p>
          <p>· Crawl: Map pricing + Extract pricing combined</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Recent Tavily activity
          </CardTitle>
          <CardDescription>Last 25 calls including blocked attempts.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Tavily activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-b border-border/50 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {r.operation}
                      {r.depth ? ` · ${r.depth}` : ""}
                      {r.url_count ? ` · ${r.url_count} URLs` : ""}
                      {` · ${r.credits} credit${r.credits === 1 ? "" : "s"}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.source ?? "—"} · {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base">How the cap behaves</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>· Counts every Tavily call made by the company, its employees, AND its customers.</p>
          <p>· When the cap is reached, content generators continue without research instead of failing.</p>
          <p>· To customize per-company caps, set <code className="text-xs">companies.tavily_caps</code> to <code className="text-xs">{`{"monthly":2000}`}</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}