import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIndustryPack } from '@/hooks/useIndustryPack';
import {
  getIndustryEmptyState,
  type EmptyStateSurface,
} from '@/lib/industryEmptyStates';
import { useToast } from '@/hooks/use-toast';

interface Props {
  surface: EmptyStateSurface;
  /** Optional override of the resolved CTA action. */
  onAction?: () => void;
  className?: string;
}

/**
 * Industry-aware empty state. Resolves copy + CTA from the active
 * industry pack so e.g. trades sees "Add a service area" while
 * real-estate sees "Add a listing" on the same surface.
 */
export function IndustryEmptyState({ surface, onAction, className }: Props) {
  const { pack } = useIndustryPack();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = getIndustryEmptyState(surface, pack);
  const Icon = state.icon;

  const handleClick = () => {
    if (onAction) return onAction();
    if (state.ctaRoute) return navigate(state.ctaRoute);
    if (state.ctaPrompt) {
      navigator.clipboard.writeText(state.ctaPrompt).catch(() => {});
      toast({ title: 'Copied to Aura', description: state.ctaPrompt });
    }
  };

  return (
    <Card
      className={`p-8 flex flex-col items-center text-center gap-3 border-dashed bg-card/40 ${className ?? ''}`}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{state.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{state.body}</p>
      </div>
      <Button onClick={handleClick} size="sm" className="mt-2">
        {state.ctaLabel}
      </Button>
    </Card>
  );
}