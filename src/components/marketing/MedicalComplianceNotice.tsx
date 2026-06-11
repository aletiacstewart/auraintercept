interface MedicalComplianceNoticeProps {
  industryId?: string | null;
  className?: string;
  /** When true, render regardless of industryId (use inside an already-medical context). */
  force?: boolean;
}

/**
 * Medical / healthcare verticals are removed from the platform.
 * This component is intentionally a no-op so existing import sites keep
 * working without rendering any medical/HIPAA disclosure copy.
 */
export function MedicalComplianceNotice(_props: MedicalComplianceNoticeProps) {
  return null;
}

export default MedicalComplianceNotice;