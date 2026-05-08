import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Users, UserCircle, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperSwitcher, isSuperSwitcherActive, emailToIndustry, type SwitchRole } from '@/hooks/useSuperSwitcher';

export function SwitcherPill() {
  const { user } = useAuth();
  const { enter, exit } = useSuperSwitcher();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);

  useEffect(() => { setActive(isSuperSwitcherActive()); }, [user?.id]);
  if (!active || !user?.email) return null;

  const ctx = emailToIndustry(user.email);
  if (!ctx) return null;

  const otherRoles: SwitchRole[] = (['company', 'employee', 'customer'] as SwitchRole[]).filter((r) => r !== ctx.role);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-primary/40 rounded-full shadow-lg pl-3 pr-2 py-1.5 flex items-center gap-2 backdrop-blur">
      <Crown className="w-3.5 h-3.5 text-primary" />
      <Badge variant="outline" className="text-[10px]">{ctx.industry}</Badge>
      <span className="text-[11px] text-muted-foreground capitalize">{ctx.role}</span>
      <div className="w-px h-4 bg-border mx-0.5" />
      {otherRoles.map((r) => (
        <Button key={r} size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => enter(ctx.industry, r)}>
          {r === 'company' && <Building2 className="w-3 h-3 mr-1" />}
          {r === 'employee' && <Users className="w-3 h-3 mr-1" />}
          {r === 'customer' && <UserCircle className="w-3 h-3 mr-1" />}
          {r === 'company' ? 'Owner' : r.charAt(0).toUpperCase() + r.slice(1)}
        </Button>
      ))}
      <Button size="sm" variant="default" className="h-7 px-2 text-[11px]" onClick={exit}>
        <ArrowLeft className="w-3 h-3 mr-1" />Hub
      </Button>
    </div>
  );
}