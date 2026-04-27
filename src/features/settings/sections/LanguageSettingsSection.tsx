import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectLanguage,
  updateLanguageSettings,
  resetLanguageSettings,
} from '../settingsSlice';
import Button from '../../../components/ui/Button';
import { useI18n } from '../../../i18n/I18nProvider';
import type { Language } from '../../../types';

const languageOptions: { value: Language; labelKey: 'spanish' | 'english'; flag: string }[] = [
  { value: 'es', labelKey: 'spanish', flag: '🇪🇸' },
  { value: 'en', labelKey: 'english', flag: '🇺🇸' },
];

const LanguageSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);
  const t = useI18n();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const isDirty = selectedLanguage !== currentLanguage;

  const handleSave = () => {
    if (!isDirty) return;
    dispatch(updateLanguageSettings({ language: selectedLanguage }));
    setSavedFeedback(true);
  };

  useEffect(() => {
    if (savedFeedback) {
      const timer = setTimeout(() => setSavedFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedFeedback]);

  const handleReset = () => {
    dispatch(resetLanguageSettings());
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{t.settings.languageSettings}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {t.settings.selectLanguage}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-text-primary">{t.settings.selectLanguage}</label>
        <div className="flex gap-3">
          {languageOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedLanguage(option.value)}
              className={
                selectedLanguage === option.value
                  ? 'flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-primary bg-primary/5 text-primary font-medium transition-colors'
                  : 'flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-text-secondary hover:border-primary/50 hover:bg-gray-50 transition-colors'
              }
            >
              <span className="text-xl">{option.flag}</span>
              <span>{t.settings[option.labelKey]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-text-muted hover:text-error underline"
        >
          {t.settings.resetSettings}
        </button>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs text-green-600 font-medium">{t.common.save}</span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
          >
            {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsSection;