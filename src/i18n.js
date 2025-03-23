import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translations
import en from './locales/en.json';
import el from './locales/el.json';

i18n
    .use(LanguageDetector) // Detect language from browser or localStorage
    .use(initReactI18next) // Connect with React
    .init({
        resources: {
            en: { translation: en },
            el: { translation: el },
        },
        fallbackLng: 'en', // Use English if language is not available
        debug: false, // Change to true if you want console logs

        detection: {
            order: ['localStorage', 'navigator'], // Try localStorage first, then browser language
            caches: ['localStorage'], // Save selected language to localStorage
        },

        interpolation: {
            escapeValue: false, // React already escapes by default
        },
    });

export default i18n;
