import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../app/store';
import { createCustomerAsync, updateCustomerAsync, deactivateCustomerAsync } from './customersSlice';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ToastProvider';
import type { Customer } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

const defaultForm = {
  name: '',
  phone: '',
  email: '',
  notes: '',
  active: true,
};

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer }) => {
  const dispatch = useAppDispatch();
  const isEdit = !!customer;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        active: customer.active,
      });
    } else {
      setForm(defaultForm);
    }
  }, [customer, isOpen]);

  const isValid = form.name.trim().length > 0 && form.phone.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEdit && customer) {
        await dispatch(updateCustomerAsync({ id: customer.id, ...form })).unwrap();
      } else {
        await dispatch(createCustomerAsync({ ...form })).unwrap();
      }
      onClose();
    } catch {
      addToast('Failed to save customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!customer || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await dispatch(deactivateCustomerAsync(customer.id)).unwrap();
      onClose();
    } catch {
      addToast('Failed to deactivate customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="María García"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Phone *</label>
            <input
              required
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+34 600 000 000"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes..."
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            {isEdit && customer?.active && (
              <button
                type="button"
                onClick={handleDeactivate}
                className="text-xs text-error hover:underline"
              >
                Deactivate Customer
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerModal;
