import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, PhoneCall, MessageSquare } from 'lucide-react';
import { IndustryContent } from '@/lib/industryMarketingContent';

interface IndustryValuePropsProps {
  content: IndustryContent;
}

export function IndustryValueProps({ content }: IndustryValuePropsProps) {
  return (
    <section className="py-10 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            What Aura does for {content.label} businesses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real workflows your team deals with every day — handled automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {content.painPoints.map((p, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/40 rounded-2xl p-4 md:p-5 border border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <PhoneCall className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              Sample calls Aura handles for {content.label.toLowerCase()} businesses:
            </h3>
          </div>
          <div className="space-y-2">
            {content.sampleCalls.map((call, i) => (
              <div key={i} className="flex items-start gap-2 bg-background rounded-lg p-2.5 border border-border/40">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-foreground italic">"{call}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
