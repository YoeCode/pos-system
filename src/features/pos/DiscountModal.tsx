import React, { useState, useCallback, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useI18n } from '../../i18n/I18nProvider';
import { useAppSelector } from '../../app/store';
import { selectEmployees } from '../employees/employeesSlice';
import type { Employee } from '../../types';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee, discountAmount: number) => void;
  subtotal: number;
}

type DiscountType = 'percent' | 'fixed';

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, onSuccess, subtotal }) => {
  const [pin, setPin] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState('');
  const t = useI18n();
  const employees = useAppSelector(selectEmployees);

  const handleClose = useCallback(() => {
    setPin('');
    setDiscountValue('');
    setDiscountType('percent');
    setError('');
    onClose();
  }, [onClose]);

  const discountAmount = discountType === 'percent'
    ? Math.round(subtotal * (parseFloat(discountValue) || 0) / 100 * 100) / 100
    : parseFloat(discountValue) || 0;

  const handleSubmit = () => {
    if (!pin.trim()) {
      setError(t.pinAuth.enterPin);
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setError(t.discount.invalidAmount);
      return;
    }
    if (discountType === 'percent' && parseFloat(discountValue) > 100) {
      setError(t.discount.maxPercent);
      return;
    }
    if (discountType === 'fixed' && discountAmount > subtotal) {
      setError(t.discount.maxFixed);
      return;
    }

    const authorized = employees.find(
      e => e.active && (e.role === 'Supervisor' || e.role === 'Admin') && e.pin === pin.trim()
    );

    if (authorized) {
      onSuccess(authorized, discountAmount);
      setPin('');
      setDiscountValue('');
      setError('');
    } else {
      setError(t.pinAuth.invalidPin);
      setPin('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setDiscountValue('');
      setDiscountType('percent');
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t.pinAuth.title}
      subtitle={t.pinAuth.description}
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setDiscountType('percent'); setDiscountValue(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              discountType === 'percent'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-muted hover:bg-gray-200'
            }`}
          >
            % {t.discount.percent || 'Percentage'}
          </button>
          <button
            type="button"
            onClick={() => { setDiscountType('fixed'); setDiscountValue(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              discountType === 'fixed'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-muted hover:bg-gray-200'
            }`}
          >
            € {t.discount.fixed || 'Fixed'}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {discountType === 'percent' ? t.discount.enterPercent : t.discount.enterFixed}
          </label>
          <Input
            type="number"
            placeholder={discountType === 'percent' ? '10' : '5.00'}
            value={discountValue}
            onChange={e => {
              setDiscountValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
          />
          {discountValue && parseFloat(discountValue) > 0 && (
            <p className="text-xs text-text-muted">
              = €{discountAmount.toFixed(2)} {discountType === 'percent' ? `(${(discountAmount / subtotal * 100).toFixed(1)}%)` : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.pinAuth.enterPin}
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••"
            value={pin}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              setPin(val);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            className={`w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
              error ? 'border-error' : 'border-border'
            }`}
          />
        </div>

        {error && (
          <p className="text-xs text-error font-medium -mt-3">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!pin.trim() || !discountValue || parseFloat(discountValue) <= 0}
          >
            {t.pinAuth.authorize}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountModal;
