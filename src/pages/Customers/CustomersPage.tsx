import React, { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { selectAllCustomers, selectActiveCustomers } from '../../features/customers/customersSlice';
import CustomerDetailPanel from '../../features/customers/CustomerDetailPanel';
import CustomerModal from '../../features/customers/CustomerModal';
import Button from '../../components/ui/Button';
import type { LoyaltyTier } from '../../types';

const tierColors: Record<LoyaltyTier, string> = {
  bronze: 'text-amber-600 bg-amber-50 border-amber-200',
  silver: 'text-slate-500 bg-slate-50 border-slate-200',
  gold: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  platinum: 'text-purple-600 bg-purple-50 border-purple-200',
};

const CustomersPage: React.FC = () => {
  const allCustomers = useAppSelector(selectAllCustomers);
  const activeCustomers = useAppSelector(selectActiveCustomers);
  const [search, setSearch] = useState('');
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const now = new Date();
  const newThisMonth = allCustomers.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = activeCustomers.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Customers</h1>
            <p className="text-sm text-text-muted mt-0.5">Manage your customer loyalty program</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Total Customers</p>
            <p className="text-2xl lg:text-3xl font-bold text-text-primary font-mono">{allCustomers.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Active</p>
            <p className="text-2xl lg:text-3xl font-bold text-primary font-mono">{activeCustomers.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">New This Month</p>
            <p className="text-2xl lg:text-3xl font-bold text-secondary font-mono">{newThisMonth}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Tier</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Points</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-muted">No customers found</td>
                </tr>
              ) : (
                filtered.map(customer => (
                  <tr
                    key={customer.id}
                    onClick={() => setDetailCustomerId(customer.id)}
                    className={`border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${detailCustomerId === customer.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-text-primary">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{customer.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${tierColors[customer.tier]}`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-mono text-text-primary">{customer.loyaltyPoints}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${customer.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {customer.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailCustomerId && (
        <CustomerDetailPanel
          customerId={detailCustomerId}
          onClose={() => setDetailCustomerId(null)}
        />
      )}

      <CustomerModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
};

export default CustomersPage;
