import { Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface InstallOnPhoneButtonProps {
  /** Route to the install page for this console */
  to: string;
  label?: string;
}

/**
 * Inline header action that takes admins to the per-console mobile install page.
 * Used in place of dedicated sidebar "Install" entries to reduce nav clutter.
 */
export function InstallOnPhoneButton({ to, label = 'Install on phone' }: InstallOnPhoneButtonProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(to)}
    >
      <Smartphone className="h-3.5 w-3.5 mr-1.5" />
      {label}
    </Button>
  );
}
