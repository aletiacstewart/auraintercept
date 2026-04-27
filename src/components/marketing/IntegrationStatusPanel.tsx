import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { DEMO_FEATURE_STATUS, DEMO_FEATURE_DISCLAIMER } from '@/lib/demoFeatureStatus';

export function IntegrationStatusPanel() {
  return (
    <section className="py-16 bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3">Demo Transparency</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What is live — and what is mocked
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Most features run end-to-end against a real database in your demo company. A few features need 3rd-party services to operate live; in the demo we provide a realistic mock so you can still see them in action.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {DEMO_FEATURE_STATUS.map((row) => {
            const isLive = row.status === 'live';
            return (
              <Card key={row.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isLive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isLive ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground">{row.feature}</h3>
                        <Badge variant={isLive ? 'default' : 'secondary'} className="text-[10px]">
                          {isLive ? 'LIVE' : 'MOCK DEMO'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{row.description}</p>
                      {row.requires && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1.5 flex items-start gap-1">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" />
                          <span><span className="font-medium">Real version needs:</span> {row.requires}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6 max-w-3xl mx-auto">
          {DEMO_FEATURE_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}