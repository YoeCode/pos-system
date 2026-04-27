import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectTaxSettings,
  updateTaxSettings,
  resetTaxSettings,
  DEFAULT_TAX_NAME,
} from '../settingsSlice';
import Input from '../../../components/ui/Input';
import Toggle from '../../../components/ui/Toggle';
import Button from '../../../components/ui/Button';
import { useI18n } from '../../../i18n/I18nProvider';

const TaxSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const reduxTax = useAppSelector(selectTaxSettings);
  const t = useI18n();

  // Local form state — display taxRate as percentage string
  const [taxRateDisplay, setTaxRateDisplay] = useState(
    (reduxTax.taxRate * 100).toFixed(2)
  );
  const [taxName, setTaxName] = useState(reduxTax.taxName);
  const [taxIncludedInPrice, setTaxIncludedInPrice] = useState(reduxTax.taxIncludedInPrice);
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState(reduxTax.taxRegistrationNumber);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync local state when redux state changes externally (e.g. after reset)
  useEffect(() => {
    setTaxRateDisplay((reduxTax.taxRate * 100).toFixed(2));
    setTaxName(reduxTax.taxName);
    setTaxIncludedInPrice(reduxTax.taxIncludedInPrice);
    setTaxRegistrationNumber(reduxTax.taxRegistrationNumber);
  }, [reduxTax]);

  // Validation
  const parsedRate = parseFloat(taxRateDisplay);
  const taxRateError =
    isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100
      ? `${t.settings.taxRate} must be between 0 and 100`
      : undefined;
  const taxNameError = taxName.trim() === '' ? t.settings.taxName + ' is required' : undefined;

  const hasErrors = !!taxRateError || !!taxNameError;

  // isDirty: compare local state to current redux state
  const localRate = isNaN(parsedRate) ? -1 : parsedRate / 100;
  const isDirty =
    Math.abs(localRate - reduxTax.taxRate) > 1e-10 ||
    taxName !== reduxTax.taxName ||
    taxIncludedInPrice !== reduxTax.taxIncludedInPrice ||
    taxRegistrationNumber !== reduxTax.taxRegistrationNumber;

  const handleSave = () => {
    if (hasErrors || !isDirty) return;
    dispatch(
      updateTaxSettings({
        taxRate: parsedRate / 100,
        taxName: taxName.trim(),
        taxIncludedInPrice,
        taxRegistrationNumber,
      })
    );
    setSavedFeedback(true);
  };

  useEffect(() => {
    if (savedFeedback) {
      const timer = setTimeout(() => setSavedFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedFeedback]);

  const handleReset = () => {
    dispatch(resetTaxSettings());
    // Local state will sync via the useEffect on reduxTax
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{t.settings.tax}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {t.settings.tax}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label={t.settings.taxRate + ' (%)'}
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={taxRateDisplay}
          onChange={e => setTaxRateDisplay(e.target.value)}
          error={taxRateError}
          placeholder="21.00"
        />

        <Input
          label={t.settings.taxName}
          type="text"
          maxLength={20}
          value={taxName}
          onChange={e => setTaxName(e.target.value)}
          error={taxNameError}
          placeholder={DEFAULT_TAX_NAME}
        />

        <Toggle
          label={t.settings.taxIncludedInPrice}
          description={t.settings.taxIncludedInPrice}
          checked={taxIncludedInPrice}
          onChange={setTaxIncludedInPrice}
        />

        <Input
          label={t.settings.taxRegistrationNumber}
          type="text"
          maxLength={30}
          value={taxRegistrationNumber}
          onChange={e => setTaxRegistrationNumber(e.target.value)}
          placeholder={t.settings.taxRegistrationNumber}
        />
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
            disabled={hasErrors || !isDirty}
          >
            {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaxSettingsSection;
