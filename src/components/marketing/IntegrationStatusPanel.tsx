import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { DEMO_FEATURE_STATUS, DEMO_FEATURE_DISCLAIMER } from '@/lib/demoFeatureStatus';

export function IntegrationStatusPanel() {
  return (
    <section className="py-10 bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-4">
          <Badge variant="outline" className="mb-1">Demo Transparency</Badge>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
            Every demo is 100% mock data
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            No real customers, calls, texts, emails, or charges. Everything below runs against your isolated 24-hour demo company.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DEMO_FEATURE_STATUS.map((row) => {
            const isLive = row.status === 'live';
            return (
              <Card key={row.id} className="border-border/60">
                <CardContent className="p-2.5">
                  <div className="flex items-start gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isLive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-xs text-foreground leading-tight">{row.feature}</h3>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          MOCK DEMO
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{row.description}</p>
                      {row.requires && (
                        <p className="text-[10px] text-muted-foreground/80 mt-1 flex items-start gap-1 leading-snug">
                          <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-1"><span className="font-medium">Needs:</span> {row.requires}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3 max-w-3xl mx-auto">
          {DEMO_FEATURE_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}