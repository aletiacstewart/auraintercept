import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Users, UserCircle, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperSwitcher, isSuperSwitcherActive, emailToIndustry, type SwitchRole } from '@/hooks/useSuperSwitcher';

export function SwitcherPill() {
  const { user } = useAuth();
  const { enter, exit } = useSuperSwitcher();
  const [active, setActive] = useState(false);

  useEffect(() => { setActive(isSuperSwitcherActive()); }, [user?.id]);
  if (!active || !user?.email) return null;

  const ctx = emailToIndustry(user.email);
  if (!ctx) return null;

  const otherRoles: SwitchRole[] = (['company', 'employee', 'customer'] as SwitchRole[]).filter((r) => r !== ctx.role);

  return (
    <div className="sticky top-0 z-[60] w-full bg-primary/10 border-b border-primary/40 backdrop-blur supports-[backdrop-filter]:bg-primary/10">
      <div className="max-w-[1400px] mx-auto px-3 py-1.5 flex items-center gap-2 flex-wrap">
        <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">Super Demo</span>
        <Badge variant="outline" className="text-[10px]">{ctx.industry}</Badge>
        <span className="text-[11px] text-muted-foreground capitalize">{ctx.role}</span>
        <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
        <span className="text-[11px] text-muted-foreground hidden md:inline">Switch role:</span>
        {otherRoles.map((r) => (
          <Button key={r} size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => enter(ctx.industry, r)}>
            {r === 'company' && <Building2 className="w-3 h-3 mr-1" />}
            {r === 'employee' && <Users className="w-3 h-3 mr-1" />}
            {r === 'customer' && <UserCircle className="w-3 h-3 mr-1" />}
            {r === 'company' ? 'Owner' : r.charAt(0).toUpperCase() + r.slice(1)}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="default" className="h-7 px-3 text-[11px] font-semibold" onClick={exit}>
            <ArrowLeft className="w-3 h-3 mr-1" />Super Admin Hub
          </Button>
        </div>
      </div>
    </div>
  );
}