import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Wrench, User, ArrowRight } from 'lucide-react';
import { getRolePreviewCopy } from '@/lib/industryRolePreview';

interface RolePreviewRowProps {
  onTryDemo: () => void;
  industryId?: string;
}

export function RolePreviewRow({ onTryDemo, industryId }: RolePreviewRowProps) {
  const copy = getRolePreviewCopy(industryId);
  const ROLES = [
    { icon: LayoutDashboard, ...copy.owner },
    { icon: Wrench, ...copy.field },
    { icon: User, ...copy.customer },
  ];
  return (
    <section className="py-10 bg-muted/20">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Try every view, all in one demo
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            One sign-up gets you 3 logins — admin, employee, and customer — so you can see Aura from every angle.
          </p>
        </div>

        <Card className="border-border/60 hover:border-primary/40 transition-colors">
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="flex flex-col">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-base text-foreground mb-1">{r.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{r.description}</p>
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
            <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                One demo unlocks <span className="text-foreground font-medium">all 3 logins</span> — {copy.loginRoles}.
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
