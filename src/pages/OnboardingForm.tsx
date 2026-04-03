import { useState } from 'react';
import { CompanyOnboardingForm } from '@/components/onboarding/CompanyOnboardingForm';
import { FastStartWizard } from '@/components/onboarding/FastStartWizard';
import { Button } from '@/components/ui/button';
import { Rocket, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OnboardingFormPage() {
  const [mode, setMode] = useState<'fast' | 'full'>('fast');

  return (
    <div className="min-h-screen bg-background py-8">
      {/* Mode toggle */}
      <div className="max-w-2xl mx-auto px-4 mb-6 flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('fast')}
          className={cn(
            'gap-1.5',
            mode === 'fast' && 'bg-primary/10 text-primary'
          )}
        >
          <Rocket className="h-4 w-4" />
          Fast Start (5 min)
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('full')}
          className={cn(
            'gap-1.5',
            mode === 'full' && 'bg-primary/10 text-primary'
          )}
        >
          <ClipboardList className="h-4 w-4" />
          Full Setup
        </Button>
      </div>

      {mode === 'fast' ? <FastStartWizard /> : <CompanyOnboardingForm />}
    </div>
  );
}
