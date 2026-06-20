import { Button } from '@/components/ui/button';
import { Sparkles, Phone } from 'lucide-react';
import { IndustryContent } from '@/lib/industryMarketingContent';

interface IndustryHeroProps {
  content: IndustryContent;
  onStartDemo: () => void;
}

export function IndustryHero({ content, onStartDemo }: IndustryHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
      <div className="container max-w-5xl mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <span className="text-base">{content.emoji}</span>
          Built for {content.label}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          {content.hero.headline}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          {content.hero.subheadline}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" variant="gradient" onClick={onStartDemo} className="text-base">
            <Sparkles className="w-5 h-5" />
            Try the demo (48 hrs free)
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base">
            <a href="tel:+15127372424">
              <Phone className="w-5 h-5" />
              Talk to a human
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          No commitment. Full access for 60 days.
        </p>
      </div>
    </section>
  );
}
