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
import type { PaymentMethod } from '../../../types';

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'qr', label: 'QR Code' },
];

const PosSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const reduxPos = useAppSelector(selectPosSettings);

  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod>(
    reduxPos.defaultPaymentMethod
  );
  const [defaultCategory, setDefaultCategory] = useState(reduxPos.defaultCategory);
  const [walkInCustomerLabel, setWalkInCustomerLabel] = useState(reduxPos.walkInCustomerLabel);
  const [orderNumberPrefix, setOrderNumberPrefix] = useState(reduxPos.orderNumberPrefix);
  const [orderNumberSeed, setOrderNumberSeed] = useState(String(reduxPos.orderNumberSeed));
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync local state when redux state changes externally (e.g. after reset)
  useEffect(() => {
    setDefaultPaymentMethod(reduxPos.defaultPaymentMethod);
    setDefaultCategory(reduxPos.defaultCategory);
    setWalkInCustomerLabel(reduxPos.walkInCustomerLabel);
    setOrderNumberPrefix(reduxPos.orderNumberPrefix);
    setOrderNumberSeed(String(reduxPos.orderNumberSeed));
  }, [reduxPos]);

  // Validation
  const parsedSeed = parseInt(orderNumberSeed, 10);
  const seedError =
    isNaN(parsedSeed) || parsedSeed < 1 || !Number.isInteger(parsedSeed) || String(parsedSeed) !== orderNumberSeed.trim()
      ? 'Starting order number must be an integer of 1 or more'
      : undefined;

  const hasErrors = !!seedError;

  const isDirty =
    defaultPaymentMethod !== reduxPos.defaultPaymentMethod ||
    defaultCategory !== reduxPos.defaultCategory ||
    walkInCustomerLabel !== reduxPos.walkInCustomerLabel ||
    orderNumberPrefix !== reduxPos.orderNumberPrefix ||
    orderNumberSeed !== String(reduxPos.orderNumberSeed);

  const handleSave = () => {
    if (hasErrors || !isDirty) return;
    dispatch(
      updatePosSettings({
        defaultPaymentMethod,
        defaultCategory,
        walkInCustomerLabel,
        orderNumberPrefix,
        orderNumberSeed: parsedSeed,
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
        <h2 className="text-base font-semibold text-text-primary">POS Behavior</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Configure default values and display labels for the point-of-sale terminal.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Select
          label="Default Payment Method"
          options={paymentMethodOptions}
          value={defaultPaymentMethod}
          onChange={e => setDefaultPaymentMethod(e.target.value as PaymentMethod)}
        />

        <Input
          label="Default Category"
          type="text"
          maxLength={30}
          value={defaultCategory}
          onChange={e => setDefaultCategory(e.target.value)}
          placeholder="All Items"
        />

        <Input
          label="Walk-In Customer Label"
          type="text"
          maxLength={40}
          value={walkInCustomerLabel}
          onChange={e => setWalkInCustomerLabel(e.target.value)}
          placeholder="Walk-In Customer"
        />

        <Input
          label="Order Number Prefix"
          type="text"
          maxLength={10}
          value={orderNumberPrefix}
          onChange={e => setOrderNumberPrefix(e.target.value)}
          placeholder="ORD-"
        />

        <Input
          label="Starting Order Number"
          type="number"
          min={1}
          step={1}
          value={orderNumberSeed}
          onChange={e => setOrderNumberSeed(e.target.value)}
          error={seedError}
          placeholder="1042"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-text-muted hover:text-error underline"
        >
          Reset to defaults
        </button>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs text-green-600 font-medium">Changes saved</span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={hasErrors || !isDirty}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PosSettingsSection;
