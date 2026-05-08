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

  useEffect(() => {
    const refresh = () => setActive(isSuperSwitcherActive());
    refresh();
    window.addEventListener('super-switcher:switching', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('super-switcher:switching', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [user?.id]);
  if (!active || !user?.email) return null;

  const ctx = emailToIndustry(user.email);
  if (!ctx) return null;

  const otherRoles: SwitchRole[] = (['company', 'employee', 'customer'] as SwitchRole[]).filter((r) => r !== ctx.role);

  return (
    <>
      {/* Top-left floating context pill with role switchers */}
      <div className="fixed top-2 left-2 z-[70] pointer-events-auto flex items-center gap-1.5 bg-background/90 border border-primary/40 rounded-full shadow-lg px-2.5 py-1 backdrop-blur">
        <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide hidden sm:inline">Super Demo</span>
        <Badge variant="outline" className="text-[10px] hidden md:inline-flex">{ctx.industry}</Badge>
        <span className="text-[11px] text-muted-foreground capitalize hidden md:inline">{ctx.role}</span>
        <div className="w-px h-4 bg-border mx-0.5 hidden sm:block" />
        {otherRoles.map((r) => (
          <Button key={r} size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => enter(ctx.industry, r)} title={`Switch to ${r}`}>
            {r === 'company' && <Building2 className="w-3 h-3 sm:mr-1" />}
            {r === 'employee' && <Users className="w-3 h-3 sm:mr-1" />}
            {r === 'customer' && <UserCircle className="w-3 h-3 sm:mr-1" />}
            <span className="hidden sm:inline">{r === 'company' ? 'Owner' : r.charAt(0).toUpperCase() + r.slice(1)}</span>
          </Button>
        ))}
      </div>

      {/* Top-right floating Super Admin Hub button — always visible */}
      <div className="fixed top-2 right-2 z-[70] pointer-events-auto">
        <Button size="sm" variant="default" className="h-8 px-3 text-[11px] font-semibold shadow-lg" onClick={exit}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />Super Admin Hub
        </Button>
      </div>
    </>
  );
}