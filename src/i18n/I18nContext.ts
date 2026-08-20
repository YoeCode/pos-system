import { createContext } from 'react';
import type { en } from './translations/en';

type TranslationDict = typeof en;

interface TranslationValue {
  t: TranslationDict;
}

export const I18nContext = createContext<TranslationValue | null>(null);
export type { TranslationDict };
