import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationFR from './locales/fr/translation.json';
import translationPT from './locales/pt/translation.json';
import translationDE from './locales/de/translation.json';
import translationAR from './locales/ar/translation.json';
import translationHI from './locales/hi/translation.json';
import translationBN from './locales/bn/translation.json';
import translationZH from './locales/zh-CN/translation.json';
import translationJA from './locales/ja/translation.json';
import translationID from './locales/id/translation.json';
import translationTR from './locales/tr/translation.json';
import translationVI from './locales/vi/translation.json';
import translationKO from './locales/ko/translation.json';
import translationRU from './locales/ru/translation.json';
import translationIT from './locales/it/translation.json';
import translationPL from './locales/pl/translation.json';
import translationTH from './locales/th/translation.json';
import translationTL from './locales/tl/translation.json';

const resources = {
    en: { translation: translationEN },
    es: { translation: translationES },
    fr: { translation: translationFR },
    pt: { translation: translationPT },
    de: { translation: translationDE },
    ar: { translation: translationAR },
    hi: { translation: translationHI },
    bn: { translation: translationBN },
    'zh-CN': { translation: translationZH },
    ja: { translation: translationJA },
    id: { translation: translationID },
    tr: { translation: translationTR },
    vi: { translation: translationVI },
    ko: { translation: translationKO },
    ru: { translation: translationRU },
    it: { translation: translationIT },
    pl: { translation: translationPL },
    th: { translation: translationTH },
    tl: { translation: translationTL }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        detection: {
            order: ['querystring', 'localStorage', 'navigator'],
            lookupQuerystring: 'lang', // For ?lang=FR
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
