import { useContext } from 'react';
import { I18nContext } from './I18nContext';
import type { TranslationDict } from './I18nContext';
import type { Language } from '../types';
import { useAppSelector } from '../app/store';

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
