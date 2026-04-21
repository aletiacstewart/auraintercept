import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import enAura from '@/locales/en/aura.json';
import enDashboard from '@/locales/en/dashboard.json';
import enMarketing from '@/locales/en/marketing.json';
import enAuth from '@/locales/en/auth.json';
import enCustomer from '@/locales/en/customer.json';

import esCommon from '@/locales/es/common.json';
import esAura from '@/locales/es/aura.json';
import esDashboard from '@/locales/es/dashboard.json';
import esMarketing from '@/locales/es/marketing.json';
import esAuth from '@/locales/es/auth.json';
import esCustomer from '@/locales/es/customer.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANG_STORAGE_KEY = 'aura_lang';

export const resources = {
  en: {
    common: enCommon,
    aura: enAura,
    dashboard: enDashboard,
    marketing: enMarketing,
    auth: enAuth,
    customer: enCustomer,
  },
  es: {
    common: esCommon,
    aura: esAura,
    dashboard: esDashboard,
    marketing: esMarketing,
    auth: esAuth,
    customer: esCustomer,
  },
} as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      ns: ['common', 'aura', 'dashboard', 'marketing', 'auth', 'customer'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: LANG_STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: { useSuspense: false },
    });
}

export default i18n;