import React, { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { selectCustomerById } from './customersSlice';
import { selectSalesByCustomerId } from '../sales/salesSlice';
import { selectLoyaltyTiers } from '../settings/settingsSlice';
import CustomerModal from './CustomerModal';
import type { LoyaltyTier } from '../../types';

interface CustomerDetailPanelProps {
  customerId: string;
  onSaleClick: (saleId: string, orderNumber: string) => void;
}

const tierColors: Record<LoyaltyTier, string> = {
  bronze: 'text-amber-600 bg-amber-50 border-amber-200',
  silver: 'text-slate-500 bg-slate-50 border-slate-200',
  gold: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  platinum: 'text-purple-600 bg-purple-50 border-purple-200',
};

const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({ customerId, onSaleClick }) => {
  const customer = useAppSelector(s => selectCustomerById(s, customerId));
  const allSales = useAppSelector(s => selectSalesByCustomerId(s, customerId));
  const tiers = useAppSelector(selectLoyaltyTiers);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!customer) return null;

  const recentSales = [...allSales]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 10);

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const currentTierIdx = sortedTiers.findIndex(t => t.tier === customer.tier);
  const nextTier = sortedTiers[currentTierIdx + 1];
  const progressPct = nextTier
    ? Math.min(100, Math.round(((customer.loyaltyPoints - (sortedTiers[currentTierIdx]?.threshold ?? 0)) /
        (nextTier.threshold - (sortedTiers[currentTierIdx]?.threshold ?? 0))) * 100))
    : 100;

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{customer.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${tierColors[customer.tier]}`}>
                {customer.tier}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditOpen(true)}
            className="text-sm text-primary hover:underline font-medium"
          >
            Edit
          </button>
        </div>

        <div className="px-6 py-5 border-b border-border flex flex-col gap-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Profile</p>
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-muted w-12 flex-shrink-0">Email</span>
              <span className="text-text-primary truncate">{customer.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted w-12 flex-shrink-0">Phone</span>
            <span className="text-text-primary">{customer.phone}</span>
          </div>
          {customer.notes && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-text-muted w-12 flex-shrink-0">Notes</span>
              <span className="text-text-primary">{customer.notes}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-b border-border flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Loyalty</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Current Points</span>
            <span className="font-mono font-bold text-text-primary">{customer.loyaltyPoints} pts</span>
          </div>
          {nextTier ? (
            <>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{customer.loyaltyPoints} pts</span>
                <span>{nextTier.threshold} pts to {nextTier.tier}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted">Maximum tier reached</p>
          )}
        </div>

        <div className="px-6 py-5 flex flex-col gap-3 flex-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Purchase History</p>
          {recentSales.length === 0 ? (
            <p className="text-sm text-text-muted">No purchases yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentSales.map(sale => (
                <button
                  key={sale.id}
                  onClick={() => onSaleClick(sale.id, sale.order.orderNumber)}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{sale.order.orderNumber}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(sale.completedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-text-primary">${sale.order.total.toFixed(2)}</p>
                    {sale.loyaltyPointsEarned > 0 && (
                      <p className="text-xs text-purple-600">+{sale.loyaltyPointsEarned} pts</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CustomerModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        customer={customer}
      />
    </>
  );
};

export default CustomerDetailPanel;