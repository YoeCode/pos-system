import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { completeSaleAsync } from '../../sales/salesSlice';
import { reduceStockAsync, selectAllProducts } from '../../products/productsSlice';
import { selectTaxLabel, selectPointsPerEuro, selectLoyaltyTiers, selectMultiTerminalMode, selectTerminalId } from '../../settings/settingsSlice';
import { addLoyaltyPointsAsync, deductLoyaltyPointsAsync } from '../../customers/customersSlice';
import { setPaymentMethod, startNewSale } from '../posSlice';
import { selectActiveEmployees } from '../../employees/employeesSlice';
import { useToast } from '../../../components/useToast';
import { useI18n } from '../../../i18n/useI18n';
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
  pointsToRedeem?: number;
  onComplete: (saleId: string, pointsEarned: number) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  cart,
  subtotal,
  tax,
  total,
  paymentMethod,
  orderNumber,
  customerId,
  discountApplied,
  pointsToRedeem = 0,
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
  const products = useAppSelector(selectAllProducts);
  const { addToast } = useToast();
  const t = useI18n();
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    {
      id: 'cash',
      label: t.pos.cash,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'card',
      label: t.pos.card,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'bizum',
      label: t.pos.bizum,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const isCash = paymentMethod === 'cash';
  const parsedAmount = parseFloat(amountReceived);
  const change = isCash && !isNaN(parsedAmount) ? parsedAmount - total : null;
  const canConfirm = isCash ? !isNaN(parsedAmount) && parsedAmount >= total : true;

  const isValidUuid = (id: string | undefined | null): boolean =>
    !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const parsedAmount = parseFloat(amountReceived);

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

    const saleEmployeeId =
      (isValidUuid(currentEmployeeId) ? currentEmployeeId : null) ||
      (isValidUuid(currentUser?.id) ? currentUser?.id : null) ||
      (currentUser && allEmployees.length > 0
        ? allEmployees.find(e => e.email.toLowerCase() === currentUser.email.toLowerCase())?.id
        : null);

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
      loyaltyPointsRedeemed: pointsToRedeem,
      discountApplied,
      refundIds: [],
      refundedAmount: 0,
    };

    try {
      await dispatch(completeSaleAsync(sale)).unwrap();

      await Promise.all(cart.map(item =>
        dispatch(reduceStockAsync({ productId: item.product.id, quantity: item.quantity, size: item.selectedSize })).unwrap()
      ));

      const lowStockItems: string[] = [];
      cart.forEach(item => {
        const product = products.find(p => p.id === item.product.id);
        if (!product || product.status !== 'active') return;
        if (product.sizes && product.sizes.length > 0 && item.selectedSize) {
          const sizeEntry = product.sizes.find(s => s.size === item.selectedSize);
          if (sizeEntry && sizeEntry.minStock !== undefined && sizeEntry.stock - item.quantity <= sizeEntry.minStock) {
            lowStockItems.push(`${product.name} (${item.selectedSize})`);
          }
        } else if (product.stock - item.quantity <= product.minStock) {
          lowStockItems.push(product.name);
        }
      });

      if (lowStockItems.length > 0) {
        const criticalCount = lowStockItems.filter((_, i) => {
          const item = cart[i];
          if (!item) return false;
          const product = products.find(p => p.id === item.product.id);
          if (!product) return false;
          if (product.sizes && item.selectedSize) {
            const sizeEntry = product.sizes.find(s => s.size === item.selectedSize);
            return sizeEntry ? sizeEntry.stock - item.quantity === 0 : false;
          }
          return product.stock - item.quantity === 0;
        }).length;

        if (criticalCount > 0) {
          addToast(`${criticalCount} producto${criticalCount > 1 ? 's' : ''} sin stock tras la venta`, 'error');
        } else {
          addToast(`${lowStockItems.length} producto${lowStockItems.length > 1 ? 's' : ''} con stock bajo tras la venta`, 'warning');
        }
      }

      if (customerId) {
        await dispatch(addLoyaltyPointsAsync({ customerId, points: loyaltyPointsEarned, amountSpent: total, tiers })).unwrap();
        if (pointsToRedeem > 0) {
          await dispatch(deductLoyaltyPointsAsync({ customerId, points: pointsToRedeem, amountSpent: 0, tiers })).unwrap();
        }
      }

      onComplete(sale.id, loyaltyPointsEarned);
      dispatch(startNewSale());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('stock')) {
        addToast(t.pos.stockInsufficient || 'Stock insuficiente: uno o más productos no tienen unidades disponibles', 'error');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        addToast(t.pos.networkError || 'Error de conexión. Verifica tu red e inténtalo de nuevo.', 'error');
      } else {
        addToast(t.pos.saleError || 'Error al completar la venta. Inténtalo de nuevo.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">{t.pos.orderSummary}</p>
        <div className="flex flex-col gap-2">
          {cart.map(item => (
            <div key={item.product.id} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">
                <span className="font-medium">{item.product.name}</span>
                <span className="text-text-muted ml-1.5">× {item.quantity}</span>
              </span>
              <span className="font-mono text-text-primary">
                €{(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{t.pos.subtotal}</span>
          <span className="font-mono text-text-primary">€{(subtotal + discountApplied).toFixed(2)}</span>
        </div>
        {discountApplied > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-600">{t.pos.discountLabel}</span>
          <span className="font-mono text-green-600">-€{discountApplied.toFixed(2)}</span>
        </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{taxLabel}</span>
          <span className="font-mono text-text-muted">€{tax.toFixed(2)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-text-primary text-sm">{t.pos.totalToPay}</span>
          <span className="font-mono text-primary font-bold text-xl">€{total.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">{t.pos.paymentMethod}</p>
        <div className="grid grid-cols-3 gap-2">
          {paymentMethods.map(method => (
            <button
              key={method.id}
              onClick={() => dispatch(setPaymentMethod(method.id))}
              className={`py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                paymentMethod === method.id
                  ? 'bg-dark-navy text-white'
                  : 'bg-white border border-border text-text-muted hover:border-text-primary hover:text-text-primary'
              }`}
            >
              {method.icon}
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {isCash && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
              {t.pos.amountReceived}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">€</span>
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
            <div className="flex items-center justify-between text-sm py-2.5 px-4 rounded-lg bg-success/10 border border-success/20">
              <span className="text-success font-medium">{t.pos.change}</span>
              <span className={`font-mono font-bold ${change < 0 ? 'text-error' : 'text-success'}`}>
                €{change.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!canConfirm || isSubmitting}
        className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.pos.processing}
          </>
        ) : (
          t.pos.confirmPayment
        )}
      </button>
    </div>
  );
};

export default PaymentStep;
