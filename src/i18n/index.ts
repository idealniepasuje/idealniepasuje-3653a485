import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './locales/pl.json';
import en from './locales/en.json';

const getSavedLanguage = (): string => {
  try {
    return localStorage.getItem('language') || 'pl';
  } catch {
    return 'pl';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en }
    },
    lng: getSavedLanguage(),
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
