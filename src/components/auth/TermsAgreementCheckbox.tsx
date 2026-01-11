import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface TermsAgreementCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  compact?: boolean;
}

export function TermsAgreementCheckbox({ 
  checked, 
  onCheckedChange, 
  id = 'terms-agreement',
  compact = false
}: TermsAgreementCheckboxProps) {
  return (
    <div className="flex items-start space-x-2">
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        className="mt-0.5"
      />
      <Label 
        htmlFor={id} 
        className={`${compact ? 'text-xs' : 'text-sm'} font-normal text-muted-foreground leading-relaxed cursor-pointer`}
      >
        I agree to the{' '}
        <Link 
          to="/terms-of-service" 
          target="_blank"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Terms of Service
        </Link>
        {' '}and{' '}
        <Link 
          to="/privacy-policy" 
          target="_blank"
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Privacy Policy
        </Link>
      </Label>
    </div>
  );
}
