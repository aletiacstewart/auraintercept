import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperSwitcher } from '@/hooks/useSuperSwitcher';

/**
 * Inline header button that returns a Super Demo session back to the
 * /super-switcher hub. Rendered inside each demo dashboard header
 * (company, employee/technician, customer) so the path back is always
 * visible — the floating <SwitcherPill /> can be missed.
 */
export function SuperHubInlineButton({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}) {
  const { user } = useAuth();
  const { exit } = useSuperSwitcher();
  if (!user?.email?.endsWith('@demo.com')) return null;
  return (
    <Button
      size={size}
      variant="default"
      className={className ?? 'h-8 px-3 text-[11px] font-semibold'}
      onClick={exit}
    >
      <Crown className="w-3.5 h-3.5 mr-1" />
      Super Admin Hub
    </Button>
  );
}