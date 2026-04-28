import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectActiveCustomers } from './customersSlice';
import { setSelectedCustomer } from '../pos/posSlice';
import { selectWalkInCustomerLabel } from '../settings/settingsSlice';
import Modal from '../../components/ui/Modal';
import type { LoyaltyTier } from '../../types';

const tierColors: Record<LoyaltyTier, string> = {
  bronze: 'text-amber-600 bg-amber-50 border-amber-200',
  silver: 'text-slate-500 bg-slate-50 border-slate-200',
  gold: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  platinum: 'text-purple-600 bg-purple-50 border-purple-200',
};

const CustomerSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedCustomerId = useAppSelector(state => state.pos.selectedCustomerId);
  const customers = useAppSelector(selectActiveCustomers);
  const walkInLabel = useAppSelector(selectWalkInCustomerLabel);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) ?? null;

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

  const handleSelect = (id: string | null) => {
    dispatch(setSelectedCustomer(id));
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
      >
        {selectedCustomer ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{selectedCustomer.name}</p>
              <p className="text-xs text-text-muted">{selectedCustomer.loyaltyPoints} pts</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${tierColors[selectedCustomer.tier]}`}>
              {selectedCustomer.tier}
            </span>
          </>
        ) : (
          <p className="text-sm text-text-muted flex-1">{walkInLabel}</p>
        )}
        <svg className="w-3.5 h-3.5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setSearch(''); }} title="Select Customer">
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />

          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors ${!selectedCustomerId ? 'bg-primary/5 border border-primary/20' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm text-text-muted">{walkInLabel}</span>
            </button>

            {filtered.map(customer => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors ${selectedCustomerId === customer.id ? 'bg-primary/5 border border-primary/20' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{customer.name}</p>
                  <p className="text-xs text-text-muted">{customer.phone}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${tierColors[customer.tier]}`}>
                  {customer.tier}
                </span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">No customers found</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CustomerSelector;
