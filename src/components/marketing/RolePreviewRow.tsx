import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Wrench, User, ArrowRight } from 'lucide-react';

interface RolePreviewRowProps {
  onTryDemo: () => void;
}

const ROLES = [
  {
    icon: LayoutDashboard,
    title: 'Owner Dashboard',
    description: 'See every call, lead, job, and dollar flowing through your business — in real time.',
    highlights: ['Live call & lead feed', 'Revenue analytics', 'Aura command center'],
  },
  {
    icon: Wrench,
    title: 'Technician App',
    description: 'Mobile-first PWA your techs use in the field. Routes, jobs, photos, invoices — all in one.',
    highlights: ['Today\'s jobs', 'One-tap navigation', 'Photo & note capture'],
  },
  {
    icon: User,
    title: 'Customer Portal',
    description: 'What your customers see — book service, see ETAs, chat with Aura, pay invoices.',
    highlights: ['Self-service booking', 'Live ETA tracking', '24/7 AI chat'],
  },
];

export function RolePreviewRow({ onTryDemo }: RolePreviewRowProps) {
  return (
    <section className="py-16 bg-muted/20">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Try every view, all in one demo
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            One sign-up gets you 3 logins — admin, employee, and customer — so you can see Aura from every angle.
          </p>
        </div>

        <Card className="border-border/60 hover:border-primary/40 transition-colors">
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-6">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{r.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{r.description}</p>
                    <ul className="space-y-1.5">
                      {r.highlights.map((h) => (
                        <li key={h} className="text-xs text-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                One demo unlocks <span className="text-foreground font-medium">all 3 logins</span> — admin, employee &amp; customer.
              </p>
              <Button size="lg" onClick={onTryDemo} className="sm:min-w-[240px]">
                Try all 3 views — Free demo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
