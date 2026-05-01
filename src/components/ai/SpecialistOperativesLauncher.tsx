import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, FileCheck, Ruler, ShieldCheck, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import {
  SPECIALIST_LABELS,
  SPECIALIST_DESCRIPTIONS,
  tierAllowsSpecialists,
  type IndustrySpecialistOperative,
} from '@/lib/subscriptionAgentConfig';

const ICONS: Record<IndustrySpecialistOperative, React.ElementType> = {
  diagnostic: Stethoscope,
  permit_code: FileCheck,
  site_survey: Ruler,
  insurance_claim: ShieldCheck,
};

interface SpecialistOperativesLauncherProps {
  /** Which specialists to surface (default: all 4) */
  show?: IndustrySpecialistOperative[];
  /** Optional title override */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  className?: string;
}

/**
 * Inline launcher that links to the Specialist Operatives Console with the
 * matching tab pre-selected. Drop into any console where specialists are useful.
 */
export function SpecialistOperativesLauncher({
  show = ['diagnostic', 'permit_code', 'site_survey', 'insurance_claim'],
  title = 'Specialist Operatives',
  subtitle = 'Industry-specific AI specialists — open one to start a focused chat.',
  className,
}: SpecialistOperativesLauncherProps) {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { subscriptionTier } = useSubscription();
  const { pack } = useIndustryPack();

  const isPlatformAdmin = userRole === 'platform_admin';
  const tierUnlocked = isPlatformAdmin || tierAllowsSpecialists(subscriptionTier);
  const industrySet = new Set(pack?.extra_operatives ?? []);

  return (
    <Card className={cn('p-4 border-border/60', className)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{title}</h3>
            {!tierUnlocked && <Badge variant="outline" className="text-[10px]">Pro & Elite</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/ai-consoles/specialists')}
          className="text-xs"
        >
          Open all <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {show.map((id) => {
          const Icon = ICONS[id];
          const inIndustry = isPlatformAdmin || industrySet.has(id);
          const locked = !tierUnlocked;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(`/dashboard/ai-consoles/specialists?agent=${id}`)}
              className={cn(
                'group text-left rounded-md border border-border/60 p-3 transition-colors',
                'hover:border-primary/60 hover:bg-primary/5',
                locked && 'opacity-70',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium truncate">{SPECIALIST_LABELS[id]}</span>
                {locked && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
                {!locked && !inIndustry && (
                  <Badge variant="secondary" className="text-[9px] ml-auto">Industry</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {SPECIALIST_DESCRIPTIONS[id]}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}