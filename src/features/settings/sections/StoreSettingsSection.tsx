import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectStoreSettings,
  updateStoreSettings,
  resetStoreSettings,
} from '../settingsSlice';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StoreSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const reduxStore = useAppSelector(selectStoreSettings);

  const [storeName, setStoreName] = useState(reduxStore.storeName);
  const [storeAddress, setStoreAddress] = useState(reduxStore.storeAddress);
  const [storePhone, setStorePhone] = useState(reduxStore.storePhone);
  const [storeEmail, setStoreEmail] = useState(reduxStore.storeEmail);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(reduxStore.receiptFooterMessage);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync local state when redux state changes externally (e.g. after reset)
  useEffect(() => {
    setStoreName(reduxStore.storeName);
    setStoreAddress(reduxStore.storeAddress);
    setStorePhone(reduxStore.storePhone);
    setStoreEmail(reduxStore.storeEmail);
    setReceiptFooterMessage(reduxStore.receiptFooterMessage);
  }, [reduxStore]);

  // Validation
  const storeNameError = storeName.trim() === '' ? 'Store name is required' : undefined;
  const emailError =
    storeEmail !== '' && !EMAIL_REGEX.test(storeEmail)
      ? 'Enter a valid email address'
      : undefined;

  const hasErrors = !!storeNameError || !!emailError;

  const isDirty =
    storeName !== reduxStore.storeName ||
    storeAddress !== reduxStore.storeAddress ||
    storePhone !== reduxStore.storePhone ||
    storeEmail !== reduxStore.storeEmail ||
    receiptFooterMessage !== reduxStore.receiptFooterMessage;

  const handleSave = () => {
    if (hasErrors || !isDirty) return;
    dispatch(
      updateStoreSettings({
        storeName: storeName.trim(),
        storeAddress,
        storePhone,
        storeEmail,
        receiptFooterMessage,
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
    dispatch(resetStoreSettings());
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Store Information</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Business details shown on receipts and in the sidebar.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Store Name"
          type="text"
          maxLength={60}
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
          error={storeNameError}
          placeholder="Casa Lis"
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Address
          </label>
          <textarea
            maxLength={200}
            value={storeAddress}
            onChange={e => setStoreAddress(e.target.value)}
            placeholder="Optional — shown on receipt"
            rows={3}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
          />
        </div>

        <Input
          label="Phone"
          type="tel"
          value={storePhone}
          onChange={e => setStorePhone(e.target.value)}
          placeholder="Optional — shown on receipt"
        />

        <Input
          label="Email"
          type="email"
          maxLength={60}
          value={storeEmail}
          onChange={e => setStoreEmail(e.target.value)}
          error={emailError}
          placeholder="Optional — shown on receipt"
        />

        <Input
          label="Receipt Footer Message"
          type="text"
          maxLength={80}
          value={receiptFooterMessage}
          onChange={e => setReceiptFooterMessage(e.target.value)}
          placeholder="Thank you!"
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

export default StoreSettingsSection;
