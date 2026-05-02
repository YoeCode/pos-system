import React, { useState, useEffect, useRef } from 'react';
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
  const [showLogo, setShowLogo] = useState(reduxPos.ticketConfig?.showLogo ?? false);
  const [logoUrl, setLogoUrl] = useState(reduxPos.ticketConfig?.logoUrl || '');
  const [showEmployee, setShowEmployee] = useState(reduxPos.ticketConfig?.showEmployee ?? true);
  const [showStoreName, setShowStoreName] = useState(reduxPos.ticketConfig?.showStoreName ?? true);
  const [customHeader, setCustomHeader] = useState(reduxPos.ticketConfig?.customHeader || '');
  const [customFooter, setCustomFooter] = useState(reduxPos.ticketConfig?.customFooter || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDefaultPaymentMethod(reduxPos.defaultPaymentMethod);
    setDefaultCategory(reduxPos.defaultCategory);
    setWalkInCustomerLabel(reduxPos.walkInCustomerLabel);
    setOrderNumberPrefix(reduxPos.orderNumberPrefix);
    setOrderNumberSeed(String(reduxPos.orderNumberSeed));
    setEnableManualProduct(reduxPos.enableManualProduct);
    setMultiTerminalMode(reduxPos.multiTerminalMode);
    setTerminalId(reduxPos.terminalId || '');
    setShowLogo(reduxPos.ticketConfig?.showLogo ?? false);
    setLogoUrl(reduxPos.ticketConfig?.logoUrl || '');
    setShowEmployee(reduxPos.ticketConfig?.showEmployee ?? true);
    setShowStoreName(reduxPos.ticketConfig?.showStoreName ?? true);
    setCustomHeader(reduxPos.ticketConfig?.customHeader || '');
    setCustomFooter(reduxPos.ticketConfig?.customFooter || '');
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
    (multiTerminalMode && terminalId !== reduxPos.terminalId) ||
    showLogo !== (reduxPos.ticketConfig?.showLogo ?? false) ||
    logoUrl !== (reduxPos.ticketConfig?.logoUrl || '') ||
    showEmployee !== (reduxPos.ticketConfig?.showEmployee ?? true) ||
    showStoreName !== (reduxPos.ticketConfig?.showStoreName ?? true) ||
    customHeader !== (reduxPos.ticketConfig?.customFooter || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        setShowLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setShowLogo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        ticketConfig: {
          showLogo,
          logoUrl: logoUrl || undefined,
          showEmployee,
          showStoreName,
          customHeader: customHeader || undefined,
          customFooter: customFooter || undefined,
        },
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

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">{t.settings.ticketConfig}</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">{t.settings.ticketLogo}</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoUrl ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-border">
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    {t.settings.removeLogo}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 text-sm border border-dashed border-border rounded-lg text-text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  {t.settings.uploadLogo}
                </button>
              )}
            </div>

            <Toggle
              label={t.settings.showEmployee}
              checked={showEmployee}
              onChange={setShowEmployee}
            />

            <Toggle
              label={t.settings.showStoreName}
              checked={showStoreName}
              onChange={setShowStoreName}
            />

            <Input
              label={t.settings.customHeader}
              type="text"
              maxLength={60}
              value={customHeader}
              onChange={e => setCustomHeader(e.target.value)}
              placeholder={t.settings.customHeaderPlaceholder}
            />

            <Input
              label={t.settings.customFooter}
              type="text"
              maxLength={60}
              value={customFooter}
              onChange={e => setCustomFooter(e.target.value)}
              placeholder={t.settings.customFooterPlaceholder}
            />
          </div>
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
