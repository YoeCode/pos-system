import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectPosSettings,
  updatePosSettings,
  resetPosSettings,
} from '../settingsSlice';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Toggle from '../../../components/ui/Toggle';
import { useI18n } from '../../../i18n/I18nProvider';
import type { PaymentMethod } from '../../../types';

const paymentMethodOptions: { value: PaymentMethod; labelKey: 'cash' | 'card' | 'bizum' }[] = [
    { value: 'cash', labelKey: 'cash' },
    { value: 'card', labelKey: 'card' },
    { value: 'bizum', labelKey: 'bizum' },
  ];

const PosSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const reduxPos = useAppSelector(selectPosSettings);
  const t = useI18n();

  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod>(
    reduxPos.defaultPaymentMethod
  );
  const [defaultCategory, setDefaultCategory] = useState(reduxPos.defaultCategory);
  const [walkInCustomerLabel, setWalkInCustomerLabel] = useState(reduxPos.walkInCustomerLabel);
  const [orderNumberPrefix, setOrderNumberPrefix] = useState(reduxPos.orderNumberPrefix);
  const [orderNumberSeed, setOrderNumberSeed] = useState(String(reduxPos.orderNumberSeed));
  const [enableManualProduct, setEnableManualProduct] = useState(reduxPos.enableManualProduct);
  const [multiTerminalMode, setMultiTerminalMode] = useState(reduxPos.multiTerminalMode);
  const [terminalId, setTerminalId] = useState(reduxPos.terminalId || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setDefaultPaymentMethod(reduxPos.defaultPaymentMethod);
    setDefaultCategory(reduxPos.defaultCategory);
    setWalkInCustomerLabel(reduxPos.walkInCustomerLabel);
    setOrderNumberPrefix(reduxPos.orderNumberPrefix);
    setOrderNumberSeed(String(reduxPos.orderNumberSeed));
    setEnableManualProduct(reduxPos.enableManualProduct);
    setMultiTerminalMode(reduxPos.multiTerminalMode);
    setTerminalId(reduxPos.terminalId || '');
  }, [reduxPos]);

  const parsedSeed = parseInt(orderNumberSeed, 10);
  const seedError =
    isNaN(parsedSeed) || parsedSeed < 1 || !Number.isInteger(parsedSeed) || String(parsedSeed) !== orderNumberSeed.trim()
      ? `${t.settings.orderNumberSeed} must be an integer of 1 or more`
      : undefined;

  const hasErrors = !!seedError;

  const isDirty =
    defaultPaymentMethod !== reduxPos.defaultPaymentMethod ||
    defaultCategory !== reduxPos.defaultCategory ||
    walkInCustomerLabel !== reduxPos.walkInCustomerLabel ||
    orderNumberPrefix !== reduxPos.orderNumberPrefix ||
    orderNumberSeed !== String(reduxPos.orderNumberSeed) ||
    enableManualProduct !== reduxPos.enableManualProduct ||
    multiTerminalMode !== reduxPos.multiTerminalMode ||
    (multiTerminalMode && terminalId !== reduxPos.terminalId);

  const handleSave = () => {
    if (hasErrors || !isDirty) return;
    dispatch(
      updatePosSettings({
        defaultPaymentMethod,
        defaultCategory,
        walkInCustomerLabel,
        orderNumberPrefix,
        orderNumberSeed: parsedSeed,
        enableManualProduct,
        multiTerminalMode,
        terminalId: multiTerminalMode ? terminalId.trim() || undefined : undefined,
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
    dispatch(resetPosSettings());
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{t.settings.pos}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {t.settings.pos}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Select
          label={t.settings.defaultPaymentMethod}
          options={paymentMethodOptions.map(opt => ({ value: opt.value, label: t.pos[opt.labelKey] }))}
          value={defaultPaymentMethod}
          onChange={e => setDefaultPaymentMethod(e.target.value as PaymentMethod)}
        />

        <Input
          label={t.settings.defaultCategory}
          type="text"
          maxLength={30}
          value={defaultCategory}
          onChange={e => setDefaultCategory(e.target.value)}
          placeholder={t.settings.defaultCategory}
        />

        <Input
          label={t.settings.walkInCustomerLabel}
          type="text"
          maxLength={40}
          value={walkInCustomerLabel}
          onChange={e => setWalkInCustomerLabel(e.target.value)}
          placeholder={t.settings.walkInCustomerLabel}
        />

        <Input
          label={t.settings.orderNumberPrefix}
          type="text"
          maxLength={10}
          value={orderNumberPrefix}
          onChange={e => setOrderNumberPrefix(e.target.value)}
          placeholder="ORD-"
        />

        <Input
          label={t.settings.orderNumberSeed}
          type="number"
          min={1}
          step={1}
          value={orderNumberSeed}
          onChange={e => setOrderNumberSeed(e.target.value)}
          error={seedError}
          placeholder="1042"
        />

        <Toggle
          label={t.settings.enableManualProduct}
          description={t.settings.enableManualProductDesc}
          checked={enableManualProduct}
          onChange={setEnableManualProduct}
        />

        <div className="border-t border-border pt-4">
          <Toggle
            label={t.settings.multiTerminalMode}
            description={t.settings.multiTerminalModeDesc}
            checked={multiTerminalMode}
            onChange={setMultiTerminalMode}
          />
          
          {multiTerminalMode && (
            <div className="mt-3 ml-1">
              <Input
                label={t.settings.terminalId}
                type="text"
                maxLength={20}
                value={terminalId}
                onChange={e => setTerminalId(e.target.value)}
                placeholder="CAJA-01"
              />
            </div>
          )}
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
            disabled={hasErrors || !isDirty}
          >
            {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PosSettingsSection;
