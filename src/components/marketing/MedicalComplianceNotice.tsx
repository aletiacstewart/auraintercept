import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isMedicalCompliancePending } from '@/lib/industryVisibility';
import { cn } from '@/lib/utils';

interface MedicalComplianceNoticeProps {
  industryId?: string | null;
  className?: string;
  /** When true, render regardless of industryId (use inside an already-medical context). */
  force?: boolean;
}

/**
 * Disclosure shown on every surface that exposes the medical verticals
 * (home health, PT, OT, hospice). HIPAA + BAA work is in progress; the
 * dedicated medical AI receptionist and patient scheduling features are
 * not yet live.
 */
export function MedicalComplianceNotice({ industryId, className, force }: MedicalComplianceNoticeProps) {
  if (!force && !isMedicalCompliancePending(industryId)) return null;
  return (
    <Alert className={cn('border-primary/40 bg-primary/5', className)}>
      <ShieldAlert className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">
        Medical &amp; Healthcare — HIPAA / BAA compliance in progress
      </AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        We are actively completing HIPAA compliance and Business Associate
        Agreements. Medical AI receptionists and patient scheduling will be
        available soon.{' '}
        <Link to="/contact" className="text-primary underline underline-offset-2 hover:opacity-80">
          Contact us
        </Link>{' '}
        to join the early-access list.
      </AlertDescription>
    </Alert>
  );
}

export default MedicalComplianceNotice;