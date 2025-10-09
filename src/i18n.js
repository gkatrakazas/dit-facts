import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import el from './locales/el.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            el: { translation: el },
        },
        fallbackLng: 'en',
        debug: false,

        detection: {
            // ⬇️ Detect from localStorage first — then browser
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],

            // 👇 Add this to clean browser language (only when using navigator)
            lookupNavigator: () => {
                const raw =
                    navigator.languages?.[0] || navigator.language || navigator.userLanguage || 'en';
                return raw.split(/[-_]/)[0]; // "en-US" → "en", "el-GR" → "el"
            },
        },

        supportedLngs: ['en', 'el'],
        interpolation: { escapeValue: false },
    });

export default i18n;
