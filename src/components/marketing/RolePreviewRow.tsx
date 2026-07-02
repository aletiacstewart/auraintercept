import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Wrench, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRolePreviewCopy } from '@/lib/industryRolePreview';

interface RolePreviewRowProps {
  onTryDemo: () => void;
  industryId?: string;
}

export function RolePreviewRow({ onTryDemo, industryId }: RolePreviewRowProps) {
  const copy = getRolePreviewCopy(industryId);
  const industryQs = industryId && industryId !== 'default' ? `&industry=${encodeURIComponent(industryId)}` : '';
  const ROLES = [
    {
      icon: LayoutDashboard,
      ...copy.owner,
      cta: { label: 'Sign up your company', to: `/auth?mode=company&tab=signup&tier=command${industryQs}`, onClick: onTryDemo, note: 'Start your 60-Day Live Demo — full owner access.' },
    },
    {
      icon: Wrench,
      ...copy.field,
      cta: { label: 'Employee sign-in', to: '/signin?mode=employee', note: 'Employees join with a registration code from their company.' },
    },
    {
      icon: User,
      ...copy.customer,
      cta: { label: 'Customer sign-up', to: '/customer-auth?tab=signup', note: 'Customers create their own accounts to book & message.' },
    },
  ];
  return (
    <section className="py-10 bg-muted/20">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            One platform. Three logins.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is a Live Demo for companies. Sign up your business, then invite your employees and customers to create their own accounts.
          </p>
        </div>

        <Card className="border-border/60 hover:border-primary/40 transition-colors">
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="flex flex-col">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-base text-foreground mb-1">{r.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{r.description}</p>
                    <ul className="space-y-1.5 mb-4">
                      {r.highlights.map((h) => (
                        <li key={h} className="text-xs text-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-2">
                      <Button asChild size="sm" className="w-full" onClick={r.cta.onClick}>
                        <Link to={r.cta.to}>
                          {r.cta.label}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{r.cta.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
