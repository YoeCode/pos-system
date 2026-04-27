import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAppSelector } from '../app/store';
import { en } from './translations/en';
import { es } from './translations/es';
import type { Language } from '../types';

type TranslationDict = typeof en;

interface TranslationValue {
  t: TranslationDict;
}

const translations: Record<Language, TranslationDict> = { en, es };

const I18nContext = createContext<TranslationValue | null>(null);

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

export const useI18n = (): TranslationDict => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context.t;
};

export const useLanguage = (): Language => {
  return useAppSelector(state => state.settings.language.language);
};