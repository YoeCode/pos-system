import { useMemo, type ReactNode } from 'react';
import { useAppSelector } from '../app/store';
import { en } from './translations/en';
import { es } from './translations/es';
import type { Language } from '../types';
import { I18nContext } from './I18nContext';

type TranslationDict = typeof en;

const translations: Record<Language, TranslationDict> = { en, es };

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const language = useAppSelector(state => state.settings.language.language);
  
  const value = useMemo(() => ({
    t: translations[language],
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};