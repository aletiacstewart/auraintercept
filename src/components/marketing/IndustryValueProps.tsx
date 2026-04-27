import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, PhoneCall, MessageSquare } from 'lucide-react';
import { IndustryContent } from '@/lib/industryMarketingContent';

interface IndustryValuePropsProps {
  content: IndustryContent;
}

export function IndustryValueProps({ content }: IndustryValuePropsProps) {
  return (
    <section className="py-16 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Aura does for {content.label} businesses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real workflows your team deals with every day — handled automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {content.painPoints.map((p, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/40 rounded-2xl p-6 md:p-8 border border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <PhoneCall className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Sample calls Aura handles for {content.label.toLowerCase()} businesses:
            </h3>
          </div>
          <div className="space-y-3">
            {content.sampleCalls.map((call, i) => (
              <div key={i} className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border/40">
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-foreground italic">"{call}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
