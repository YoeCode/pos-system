import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { completeSale } from '../../sales/salesSlice';
import { reduceStock } from '../../products/productsSlice';
import { selectTaxLabel, selectPointsPerEuro, selectLoyaltyTiers, selectMultiTerminalMode, selectTerminalId } from '../../settings/settingsSlice';
import { addLoyaltyPoints } from '../../customers/customersSlice';
import { clearCart } from '../posSlice';
import { selectActiveEmployees } from '../../employees/employeesSlice';
import type { CartItem, Order, PaymentMethod, Sale } from '../../../types';

interface PaymentStepProps {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  orderNumber: string;
  customerId?: string;
  discountApplied: number;
  onComplete: (saleId: string, pointsEarned: number) => void;
}

const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  bizum: 'Bizum',
};

const PaymentStep: React.FC<PaymentStepProps> = ({
  cart,
  subtotal,
  tax,
  total,
  paymentMethod,
  orderNumber,
  customerId,
  discountApplied,
  onComplete,
}) => {
  const dispatch = useAppDispatch();
  const taxLabel = useAppSelector(selectTaxLabel);
  const currentEmployeeId = useAppSelector(state => state.pos.currentEmployeeId);
  const currentUser = useAppSelector(state => state.auth.user);
  const pointsPerEuro = useAppSelector(selectPointsPerEuro);
  const tiers = useAppSelector(selectLoyaltyTiers);
  const multiTerminalMode = useAppSelector(selectMultiTerminalMode);
  const terminalId = useAppSelector(selectTerminalId);
  const allEmployees = useAppSelector(selectActiveEmployees);
  const [amountReceived, setAmountReceived] = useState<string>('');

  const isCash = paymentMethod === 'cash';
  const parsedAmount = parseFloat(amountReceived);
  const change = isCash && !isNaN(parsedAmount) ? parsedAmount - total : null;
  const canConfirm = isCash ? !isNaN(parsedAmount) && parsedAmount >= total : true;

  const handleConfirm = () => {
    if (!canConfirm) return;

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      items: cart.map(ci => ({
        product: ci.product,
        quantity: ci.quantity,
        lineTotal: ci.product.price * ci.quantity,
      })),
      subtotal,
      tax,
      total,
      discount: discountApplied,
      createdAt: new Date().toISOString(),
    };

    const loyaltyPointsEarned = customerId ? Math.floor(total * pointsPerEuro) : 0;

    const saleEmployeeId = currentEmployeeId || 
      (currentUser ? allEmployees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase())?.id : null) ||
      currentUser?.id;

    const sale: Sale = {
      id: crypto.randomUUID(),
      order,
      paymentMethod,
      amountReceived: isCash ? parsedAmount : null,
      change: isCash ? parsedAmount - total : null,
      completedAt: new Date().toISOString(),
      employeeId: saleEmployeeId || undefined,
      terminalId: multiTerminalMode ? terminalId : undefined,
      customerId,
      loyaltyPointsEarned,
      discountApplied,
    };

    dispatch(completeSale(sale));

    cart.forEach(item => {
      dispatch(reduceStock({ productId: item.product.id, quantity: item.quantity, size: item.selectedSize }));
    });

    if (customerId) {
      dispatch(addLoyaltyPoints({ customerId, points: loyaltyPointsEarned, amountSpent: total, tiers }));
    }

    dispatch(clearCart());
    onComplete(sale.id, loyaltyPointsEarned);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Order summary */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Order Summary</p>
        <div className="flex flex-col gap-2">
          {cart.map(item => (
            <div key={item.product.id} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">
                <span className="font-medium">{item.product.name}</span>
                <span className="text-text-muted ml-1.5">× {item.quantity}</span>
              </span>
              <span className="font-mono text-text-primary">
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Totals */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Subtotal</span>
          <span className="font-mono text-text-primary">${(subtotal + discountApplied).toFixed(2)}</span>
        </div>
        {discountApplied > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="font-mono text-green-600">-${discountApplied.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{taxLabel}</span>
          <span className="font-mono text-text-muted">${tax.toFixed(2)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary text-sm">Total Amount</span>
          <span className="font-mono text-primary font-bold text-xl">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="flex items-center justify-between text-sm py-3 px-4 bg-gray-50 rounded-lg border border-border">
        <span className="text-text-muted font-medium">Payment Method</span>
        <span className="font-semibold text-text-primary">{paymentMethodLabel[paymentMethod]}</span>
      </div>

      {/* Cash input */}
      {isCash && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
              Amount Received
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 border border-border rounded-lg font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {change !== null && (
            <div className="flex items-center justify-between text-sm py-2.5 px-4 rounded-lg bg-green-50 border border-green-200">
              <span className="text-green-700 font-medium">Change</span>
              <span className={`font-mono font-bold ${change < 0 ? 'text-error' : 'text-green-700'}`}>
                ${change.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
      >
        CONFIRM PAYMENT
      </button>
    </div>
  );
};

export default PaymentStep;
