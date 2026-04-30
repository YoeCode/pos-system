import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../app/store';
import { addCustomer, updateCustomer, deactivateCustomer } from './customersSlice';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (isEdit && customer) {
      dispatch(updateCustomer({ id: customer.id, ...form }));
    } else {
      dispatch(addCustomer({ ...form }));
    }
    onClose();
  };

  const handleDeactivate = () => {
    if (customer) {
      dispatch(deactivateCustomer(customer.id));
      onClose();
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
            <Button type="submit" variant="primary" disabled={!isValid}>
              {isEdit ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerModal;
