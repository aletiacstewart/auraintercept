import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCachedTranslation, shouldTranslate, translateText } from '@/lib/autoTranslate';

/**
 * Returns the AI-translated version of `text` for the current language.
 * Falls back to the original text instantly while the translation loads.
 */
export function useAutoTranslate(text: string | undefined | null): string {
  const { language } = useLanguage();
  const source = text ?? '';

  const initial = (() => {
    if (language === 'en' || !shouldTranslate(source)) return source;
    return getCachedTranslation(source, language) ?? source;
  })();

  const [out, setOut] = useState(initial);

  useEffect(() => {
    if (language === 'en' || !shouldTranslate(source)) {
      setOut(source);
      return;
    }
    const cached = getCachedTranslation(source, language);
    if (cached) { setOut(cached); return; }
    setOut(source);
    let active = true;
    translateText(source, language).then((t) => { if (active) setOut(t); });
    return () => { active = false; };
  }, [source, language]);

  return out;
}

export default useAutoTranslate;