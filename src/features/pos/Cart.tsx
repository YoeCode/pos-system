import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { clearCart, removeFromCart, setPaymentMethod, updateQuantity } from './posSlice';
import { selectFormattedOrderNumber } from '../sales/salesSlice';
import CheckoutModal from './checkout/CheckoutModal';
import { TAX_RATE } from '../../constants/tax';
import type { PaymentMethod } from '../../types';

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cart, paymentMethod } = useAppSelector(state => state.pos);
  const orderNumber = useAppSelector(selectFormattedOrderNumber);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: 'cash', label: 'CASH' },
    { id: 'card', label: 'CARD' },
    { id: 'qr', label: 'QR CODE' },
  ];

  return (
    <div className="w-[370px] flex-shrink-0 bg-white border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-text-primary text-base">Order #{orderNumber}</h2>
            <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">Walk-In Customer</p>
          </div>
          <button
            onClick={() => dispatch(clearCart())}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors"
            title="Clear cart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
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
            <p className="text-sm text-text-muted">No items in cart yet.<br />Add products from the grid.</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-3">
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
                <p className="text-sm font-medium text-text-primary truncate">{item.product.name}</p>
                <p className="text-xs font-mono text-text-muted">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))}
                  className="w-6 h-6 rounded border border-border text-text-muted hover:border-error hover:text-error flex items-center justify-center transition-colors text-xs"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-text-primary font-mono">{item.quantity}</span>
                <button
                  onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}
                  className="w-6 h-6 rounded border border-border text-text-muted hover:border-primary hover:text-primary flex items-center justify-center transition-colors text-xs"
                >
                  +
                </button>
                <button
                  onClick={() => dispatch(removeFromCart(item.product.id))}
                  className="w-6 h-6 rounded text-text-muted hover:text-error flex items-center justify-center transition-colors ml-0.5"
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
        {/* Totals */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-mono text-text-primary">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Tax (21%)</span>
            <span className="font-mono text-text-muted">${tax.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary text-sm">Total Amount</span>
            <span className="font-mono text-primary font-bold text-xl">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Payment Method</p>
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
                {method.label}
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
          CHARGE ${total.toFixed(2)}
        </button>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        paymentMethod={paymentMethod}
        orderNumber={orderNumber}
      />
    </div>
  );
};

export default Cart;
