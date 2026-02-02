import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="font-medium"
    >
      {i18n.language === 'pl' ? 'EN' : 'PL'}
    </Button>
  );
};
