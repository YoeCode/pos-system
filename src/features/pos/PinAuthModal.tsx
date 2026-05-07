import React, { useState, useCallback, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { useAppSelector } from '../../app/store';
import { selectEmployees } from '../employees/employeesSlice';
import type { Employee } from '../../types';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
  title?: string;
  description?: string;
}

const PinAuthModal: React.FC<PinAuthModalProps> = ({ isOpen, onClose, onSuccess, title, description }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const t = useI18n();
  const employees = useAppSelector(selectEmployees);

  const handleClose = useCallback(() => {
    setPin('');
    setError('');
    onClose();
  }, [onClose]);

  const handleSubmit = () => {
    if (!pin.trim()) return;

    const authorized = employees.find(
      e => e.active && (e.role === 'Supervisor' || e.role === 'Admin') && e.pin === pin.trim()
    );

    if (authorized) {
      onSuccess(authorized);
      setPin('');
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
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title || t.pinAuth.title}
      subtitle={description || t.pinAuth.description}
    >
      <div className="flex flex-col gap-5">
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
            autoFocus
          />
          {error && (
            <p className="text-xs text-error font-medium">{error}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!pin.trim()}
          >
            {t.pinAuth.authorize}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PinAuthModal;
