import { Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InstallOnPhoneButtonProps {
  /** Route to the install page for this console */
  to: string;
  label?: string;
  className?: string;
}

/**
 * Inline header action that takes admins to the per-console mobile install page.
 * Used in place of dedicated sidebar "Install" entries to reduce nav clutter.
 */
export function InstallOnPhoneButton({ to, label = 'Install on phone', className }: InstallOnPhoneButtonProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(to)}
      className={cn('w-full sm:w-auto', className)}
    >
      <Smartphone className="h-3.5 w-3.5 mr-1.5" />
      <span className="truncate">{label}</span>
    </Button>
  );
}
