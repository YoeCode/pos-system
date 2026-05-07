import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeFromCart, setPaymentMethod, updateQuantity, splitLine, startNewSale } from './posSlice';
import {
  selectTaxRate,
  selectTaxLabel,
  selectTaxIncludedInPrice,
  selectFormattedOrderNumber,
  selectLoyaltyTiers,
} from '../settings/settingsSlice';
import { selectCustomerById } from '../customers/customersSlice';
import CheckoutModal from './checkout/CheckoutModal';
import CustomerSelector from '../customers/CustomerSelector';
import DiscountModal from './DiscountModal';
import { useI18n } from '../../i18n/I18nProvider';
import { calculateCart } from './calculation';
import type { PaymentMethod } from '../../types';

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cart, paymentMethod, selectedCustomerId } = useAppSelector(state => state.pos);
  const orderNumber = useAppSelector(selectFormattedOrderNumber);
  const taxRate = useAppSelector(selectTaxRate);
  const taxIncludedInPrice = useAppSelector(selectTaxIncludedInPrice);
  const taxLabel = useAppSelector(selectTaxLabel);
  const tiers = useAppSelector(selectLoyaltyTiers);
  const selectedCustomer = useAppSelector(s =>
    selectedCustomerId ? selectCustomerById(s, selectedCustomerId) : null
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showItemDiscountModal, setShowItemDiscountModal] = useState(false);
  const [itemDiscountTarget, setItemDiscountTarget] = useState<string | null>(null);
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const t = useI18n();

  const tierConfig = tiers.find(t => t.tier === selectedCustomer?.tier);

  const calc = calculateCart(cart, {
    taxRate,
    taxIncludedInPrice,
    itemDiscounts,
    loyaltyTierConfig: selectedCustomer && tierConfig ? tierConfig : undefined,
  });

  const { grossSubtotal, totalDiscount, tax, total } = calc;

  const paymentMethods: { id: PaymentMethod; labelKey: 'cash' | 'card' | 'bizum' }[] = [
    { id: 'cash', labelKey: 'cash' },
    { id: 'card', labelKey: 'card' },
    { id: 'bizum', labelKey: 'bizum' },
  ];

  return (
    <div className="w-full sm:w-[320px] md:w-[370px] flex-shrink-0 bg-white border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-text-primary text-base">Order #{orderNumber}</h2>
          <button
            disabled={cart.length === 0}
            onClick={() => dispatch(startNewSale())}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent"
            title={t.pos.removeFromCart}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <CustomerSelector />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">{t.pos.emptyCart}</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.lineId} className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {item.product.name || item.product.category}
                </p>
                {item.selectedSize && (
                  <p className="text-xs text-blue-600 font-medium">Talla: {item.selectedSize}</p>
                )}
                {item.product.brand && (
                  <p className="text-xs text-text-muted truncate">{item.product.brand}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-mono text-text-muted">€{(item.product.price * item.quantity).toFixed(2)}</p>
                  {itemDiscounts[item.lineId] && (
                    <span className="text-xs font-mono text-green-600">-€{(item.product.price * item.quantity * (itemDiscounts[item.lineId] || 0) / 100).toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => dispatch(updateQuantity({ lineId: item.lineId, quantity: item.quantity - 1 }))}
                  className="w-6 h-6 rounded border border-border text-text-muted hover:border-error hover:text-error flex items-center justify-center transition-colors text-xs"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-text-primary font-mono">{item.quantity}</span>
                <button
                  onClick={() => dispatch(updateQuantity({ lineId: item.lineId, quantity: item.quantity + 1 }))}
                  className="w-6 h-6 rounded border border-border text-text-muted hover:border-primary hover:text-primary flex items-center justify-center transition-colors text-xs"
                >
                  +
                </button>
                {item.quantity > 1 && (
                  <button
                    onClick={() => dispatch(splitLine(item.lineId))}
                    className="w-6 h-6 rounded text-blue-500 hover:text-blue-600 flex items-center justify-center transition-colors"
                    title="Split line"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                    setItemDiscountTarget(item.lineId);
                    setShowItemDiscountModal(true);
                  }}
                  className="w-6 h-6 rounded text-amber-500 hover:text-amber-600 flex items-center justify-center transition-colors"
                  title={t.pos.itemDiscount || 'Discount'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </button>
                <button
                  onClick={() => dispatch(removeFromCart(item.lineId))}
                  className="w-6 h-6 rounded text-text-muted hover:text-error flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals + Payment */}
      <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{t.pos.subtotal}</span>
            <span className="font-mono text-text-primary">${grossSubtotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">Discount</span>
              <span className="font-mono text-green-600">-${totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{taxLabel}</span>
            <span className="font-mono text-text-muted">${tax.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary text-sm">{t.pos.total}</span>
            <span className="font-mono text-primary font-bold text-xl">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">{t.pos.paymentMethod}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => dispatch(setPaymentMethod(method.id))}
                className={`py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  paymentMethod === method.id
                    ? 'bg-[#1B2B4B] text-white'
                    : 'bg-white border border-border text-text-muted hover:border-text-primary hover:text-text-primary'
                }`}
              >
                {t.pos[method.labelKey].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Charge button */}
        <button
          disabled={cart.length === 0}
          onClick={() => cart.length > 0 && setIsCheckoutOpen(true)}
          className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
        >
          {t.pos.checkout.toUpperCase()} ${total.toFixed(2)}
        </button>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={grossSubtotal}
        tax={tax}
        total={total}
        paymentMethod={paymentMethod}
        orderNumber={orderNumber}
        customerId={selectedCustomerId ?? undefined}
        discountApplied={totalDiscount}
      />

      <DiscountModal
        isOpen={showItemDiscountModal}
        onClose={() => setShowItemDiscountModal(false)}
        onSuccess={(_, discountAmount) => {
          if (itemDiscountTarget) {
            const item = cart.find(i => i.lineId === itemDiscountTarget);
            const itemTotal = item ? item.product.price * item.quantity : 0;
            const discountPct = itemTotal > 0 ? Math.round((discountAmount / itemTotal) * 10000) / 100 : 0;
            setItemDiscounts(prev => ({ ...prev, [itemDiscountTarget]: discountPct }));
          }
          setShowItemDiscountModal(false);
          setItemDiscountTarget(null);
        }}
        subtotal={(() => {
          const item = cart.find(i => i.lineId === itemDiscountTarget);
          return item ? item.product.price * item.quantity : 0;
        })()}
      />
    </div>
  );
};

export default Cart;
