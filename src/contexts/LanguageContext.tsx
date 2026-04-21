import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { LANG_STORAGE_KEY, SupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isSupported(lang: string | null | undefined): lang is SupportedLanguage {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(
    isSupported(i18n.language) ? (i18n.language as SupportedLanguage) : 'en',
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sync from auth profile when user logs in
  useEffect(() => {
    let mounted = true;

    const syncFromProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .maybeSingle();
      if (!mounted) return;
      const pref = (data as { preferred_language?: string } | null)?.preferred_language;
      if (isSupported(pref) && pref !== i18n.language) {
        await i18n.changeLanguage(pref);
        localStorage.setItem(LANG_STORAGE_KEY, pref);
        setLanguageState(pref);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) syncFromProfile(session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        // Defer to avoid blocking auth callback
        setTimeout(() => syncFromProfile(session.user.id), 0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      setIsLoading(true);
      try {
        await i18n.changeLanguage(lang);
        localStorage.setItem(LANG_STORAGE_KEY, lang);
        setLanguageState(lang);
        document.documentElement.lang = lang;

        // Persist to profile if authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase
            .from('profiles')
            .update({ preferred_language: lang })
            .eq('id', session.user.id);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [i18n],
  );

  // Keep <html lang> in sync
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}