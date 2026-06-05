import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SCOPE_HINT = 'Switch the entire platform between English and Spanish.';

interface LanguageToggleProps {
  variant?: 'default' | 'ghost' | 'compact';
  className?: string;
}

export function LanguageToggle({ variant = 'default', className }: LanguageToggleProps) {
  const { language, setLanguage, isLoading } = useLanguage();
  const { t } = useTranslation();

  const isDark = variant === 'ghost';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        disabled={isLoading}
        aria-label={t('language.switchTo', { lang: language === 'en' ? 'Español' : 'English' })}
        title={SCOPE_HINT}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide',
          'bg-muted hover:bg-muted/80 text-foreground transition-colors',
          className,
        )}
      >
        <Languages className="h-3.5 w-3.5" />
        {language}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      title={SCOPE_HINT}
      className={cn(
        'inline-flex items-center rounded-full p-0.5 border',
        isDark
          ? 'bg-white/10 border-white/20'
          : 'bg-muted border-border',
        className,
      )}
    >
      {(['en', 'es'] as const).map((lng) => {
        const active = language === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => !active && setLanguage(lng)}
            disabled={isLoading || active}
            aria-pressed={active}
            className={cn(
              'px-2.5 py-1 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors',
              active
                ? isDark
                  ? 'bg-white text-primary'
                  : 'bg-primary text-primary-foreground'
                : isDark
                  ? 'text-white/80 hover:text-white'
                  : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {lng}
          </button>
        );
      })}
    </div>
  );
}