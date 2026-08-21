import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  removeFromCart, setPaymentMethod, updateQuantity, splitLine, startNewSale, undoCartAction,
  selectActiveWindowCart, selectActiveWindowPaymentMethod, selectActiveWindowCustomerId,
  selectActiveWindowItemDiscounts, selectActiveWindowManualDiscount, selectActiveWindowPointsToRedeem,
  selectCanUndo, selectActiveWindowIsGiftReceipt,
  setWindowItemDiscounts, setPointsToRedeem, setIsGiftReceipt,
} from './posSlice';
import {
  selectTaxRate,
  selectTaxLabel,
  selectTaxIncludedInPrice,
  selectFormattedOrderNumber,
  selectLoyaltyTiers,
} from '../settings/settingsSlice';
import { selectCustomerById } from '../customers/customersSlice';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../components/useToast';
import CheckoutModal from './checkout/CheckoutModal';
import CustomerSelector from '../customers/CustomerSelector';
import DiscountModal from './DiscountModal';
import { useI18n } from '../../i18n/useI18n';
import { calculateCart } from './calculation';
import { selectAllProducts } from '../products/productsSlice';

interface CartProps {
  variant?: 'sidebar' | 'bottomSheet';
  onClose?: () => void;
}

const Cart: React.FC<CartProps> = ({ variant = 'sidebar', onClose }) => {
  const isSheet = variant === 'bottomSheet';
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectActiveWindowCart);
  const paymentMethod = useAppSelector(selectActiveWindowPaymentMethod);
  const selectedCustomerId = useAppSelector(selectActiveWindowCustomerId);
  const itemDiscounts = useAppSelector(selectActiveWindowItemDiscounts);
  const manualDiscount = useAppSelector(selectActiveWindowManualDiscount);
  const pointsToRedeem = useAppSelector(selectActiveWindowPointsToRedeem);
  const orderNumber = useAppSelector(selectFormattedOrderNumber);
  const taxRate = useAppSelector(selectTaxRate);
  const taxIncludedInPrice = useAppSelector(selectTaxIncludedInPrice);
  const taxLabel = useAppSelector(selectTaxLabel);
  const tiers = useAppSelector(selectLoyaltyTiers);
  const selectedCustomer = useAppSelector(s =>
    selectedCustomerId ? selectCustomerById(s, selectedCustomerId) : null
  );
  const canUndo = useAppSelector(selectCanUndo);
  const isGiftReceipt = useAppSelector(selectActiveWindowIsGiftReceipt);
  const products = useAppSelector(selectAllProducts);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showItemDiscountModal, setShowItemDiscountModal] = useState(false);
  const [itemDiscountTarget, setItemDiscountTarget] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { hasPermission } = usePermission();
  const { addToast } = useToast();
  const t = useI18n();

  const tierConfig = tiers.find(t => t.tier === selectedCustomer?.tier);

  const calc = calculateCart(cart, {
    taxRate,
    taxIncludedInPrice,
    itemDiscounts,
    loyaltyTierConfig: selectedCustomer && tierConfig ? tierConfig : undefined,
    manualDiscount,
    pointsToRedeem,
  });

  const { grossSubtotal, totalDiscount, tax, total } = calc;

  const handleIncrement = (item: typeof cart[number]) => {
    const product = products.find(p => p.id === item.product.id);
    if (!product) return;
    const newQty = item.quantity + 1;
    const hasSizes = product.sizes && product.sizes.length > 0;
    if (hasSizes && item.selectedSize) {
      const sizeEntry = product.sizes?.find(s => s.size === item.selectedSize);
      if (sizeEntry && newQty > sizeEntry.stock) {
        addToast(`${t.pos.onlyUnitsLeft || 'Solo quedan'} ${sizeEntry.stock} ${t.pos.units || 'unidades'} (${item.selectedSize})`, 'warning');
        return;
      }
    } else if (newQty > product.stock) {
        addToast(`${t.pos.onlyUnitsLeft || 'Solo quedan'} ${product.stock} ${t.pos.units || 'unidades'}`, 'warning');
      return;
    }
    dispatch(updateQuantity({ lineId: item.lineId, quantity: newQty }));
  };

  return (
    <div className={isSheet ? 'flex flex-col h-full' : 'w-full flex-shrink-0 bg-white border-l border-border flex flex-col h-full'}>
      {/* Header */}
      <div className={isSheet ? 'px-4 py-4 border-b border-border flex items-center justify-between' : 'px-4 sm:px-5 py-3 sm:py-4 border-b border-border'}>
        <div className={isSheet ? 'flex items-center justify-between w-full' : 'flex items-center justify-between mb-3'}>
          <h2 className="font-bold text-text-primary text-base">
            {isSheet ? t.pos.cart : (cart.length === 0 ? t.pos.cart : `${t.pos.orderNumber}${orderNumber}`)}
          </h2>
          {cart.length > 0 && (
            <div className="flex items-center gap-1">
              {!isSheet && canUndo && (
                <button
                  onClick={() => dispatch(undoCartAction())}
                  className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                  title={t.pos.undoAction}
                  aria-label={t.pos.undoAction}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-colors"
                title={t.pos.emptyCartAction}
                aria-label={t.pos.emptyCartAction}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              {isSheet && onClose && (
                <button
                  onClick={onClose}
                  className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
                title={t.pos.closeCart}
                aria-label={t.pos.closeCart}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        {cart.length > 0 && <CustomerSelector />}
      </div>

      {/* Items list */}
      <div className={isSheet ? 'flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4' : 'flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3'}>
        {cart.length === 0 ? (
          <div className={isSheet ? 'flex flex-col items-center justify-center py-8 gap-2 text-center' : 'flex flex-col items-center justify-center h-full gap-3 text-center py-10 px-4'}>
            <div className={isSheet ? 'w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center' : 'w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center'}>
              <svg className={isSheet ? 'w-5 h-5 text-primary/60' : 'w-7 h-7 text-primary/60'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">{isSheet ? t.pos.emptyCartSheet : t.pos.emptyCart}</p>
            <p className="text-xs text-text-muted">{isSheet ? t.pos.addFromGrid : t.pos.clickToAdd}</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.lineId} className={isSheet ? 'flex items-center gap-3 p-3 bg-gray-50 rounded-lg' : 'flex flex-col gap-2 py-2'}>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate leading-tight">
                    {item.product.name || item.product.category}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.selectedSize && (
                      <span className="text-[11px] text-blue-600 font-medium">{item.selectedSize}</span>
                    )}
                    {item.product.brand && (
                      <span className="text-[11px] text-text-muted truncate">{item.product.brand}</span>
                    )}
                    <span className="text-xs font-mono text-text-muted">€{(item.product.price * item.quantity).toFixed(2)}</span>
                    {itemDiscounts[item.lineId] && (
                      <span className="text-xs font-mono text-green-600">-€{(item.product.price * item.quantity * (itemDiscounts[item.lineId] || 0) / 100).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 pl-11">
                <button
                  onClick={() => dispatch(updateQuantity({ lineId: item.lineId, quantity: item.quantity - 1 }))}
                  className="w-8 h-8 rounded border border-border text-text-muted hover:border-error hover:text-error flex items-center justify-center text-base"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold font-mono">{item.quantity}</span>
                <button
                  onClick={() => handleIncrement(item)}
                  className="w-8 h-8 rounded border border-border text-text-muted hover:border-primary hover:text-primary flex items-center justify-center text-base"
                >
                  +
                </button>
                {item.quantity > 1 && (
                  <button
                    onClick={() => dispatch(splitLine(item.lineId))}
                    className="w-8 h-8 rounded text-info hover:text-info/80 flex items-center justify-center"
                    title={t.pos.splitLine || 'Dividir línea'}
                    aria-label={t.pos.splitLine || 'Dividir línea'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                )}
                {hasPermission('pos:discount') && (
                  <button
                    onClick={() => {
                      setItemDiscountTarget(item.lineId);
                      setShowItemDiscountModal(true);
                    }}
                    className="w-8 h-8 rounded text-warning hover:text-warning/80 flex items-center justify-center"
                    title={t.pos.itemDiscount || 'Descuento'}
                    aria-label={t.pos.itemDiscount || 'Aplicar descuento'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => dispatch(removeFromCart(item.lineId))}
                  className="w-8 h-8 rounded text-text-muted hover:text-error flex items-center justify-center"
                  title={t.pos.removeFromCart || 'Eliminar artículo'}
                  aria-label={t.pos.removeFromCart || 'Eliminar artículo'}
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
      <div className={isSheet ? 'px-4 pb-5 border-t border-border pt-4 flex flex-col gap-4' : 'px-5 pb-5 border-t border-border pt-4 flex flex-col gap-4'}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{t.pos.subtotal}</span>
            <span className="font-mono text-text-primary">€{grossSubtotal.toFixed(2)}</span>
          </div>
          {calc.lines.some(l => l.discountSource === 'loyalty') && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-600">{t.pos.loyaltyDiscount} {selectedCustomer?.tier}</span>
              <span className="font-mono text-purple-600">-€{(calc.lines.reduce((sum, l) => sum + (l.discountSource === 'loyalty' ? l.appliedDiscount : 0), 0)).toFixed(2)}</span>
            </div>
          )}
          {pointsToRedeem > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-600">{t.pos.points} ({pointsToRedeem})</span>
              <span className="font-mono text-purple-600">-€{(pointsToRedeem / 100).toFixed(2)}</span>
            </div>
          )}
          {calc.lines.some(l => l.discountSource === 'manual') && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">{t.pos.manualDiscountShort}</span>
              <span className="font-mono text-green-600">-€{(calc.lines.reduce((sum, l) => sum + (l.discountSource === 'manual' ? l.appliedDiscount : 0), 0)).toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{taxLabel}</span>
            <span className="font-mono text-text-muted">€{tax.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary text-sm">{t.pos.total}</span>
            <span className="font-mono text-primary font-bold text-xl">€{total.toFixed(2)}</span>
          </div>
        </div>

        {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">{t.pos.loyaltyProgram || 'Fidelización'}</span>
              <span className="text-xs text-purple-600 font-medium">-{pointsToRedeem > 0 ? (pointsToRedeem / 100).toFixed(2) : '0.00'} €</span>
            </div>
            <p className="text-xs text-purple-600 mb-2">
              {selectedCustomer.tier} · {selectedCustomer.loyaltyPoints} {t.pos.availablePoints || 'pts disponibles'} · {t.pos.pointsValue || '100 pts = 1€'}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={selectedCustomer.loyaltyPoints}
                step={1}
                value={pointsToRedeem}
                onChange={e => dispatch(setPointsToRedeem(parseInt(e.target.value, 10)))}
                className="flex-1 accent-purple-600"
                aria-label={t.pos.redeemPoints || 'Canjear puntos'}
              />
              <span className="text-xs font-mono text-purple-700 w-12 text-right">{pointsToRedeem}</span>
            </div>
            {pointsToRedeem > 0 && (
              <button
                onClick={() => dispatch(setPointsToRedeem(0))}
                className="mt-1.5 text-xs text-purple-600 underline"
              >
                {t.pos.cancel}
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => dispatch(setIsGiftReceipt(!isGiftReceipt))}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 border ${
            isGiftReceipt
              ? 'bg-pink-50 border-pink-200 text-pink-700'
              : 'bg-white border-border text-text-muted hover:text-text-primary'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12l-1.5-1.5M12 4v16m0-8h8m-8 0H4m16 0v-4a4 4 0 00-4-4H8a4 4 0 00-4 4v4" />
          </svg>
          {isGiftReceipt ? t.pos.giftReceiptActive : t.pos.giftReceipt}
        </button>

        {/* Charge button */}
        {hasPermission('pos:checkout') && (
          <button
            disabled={cart.length === 0}
            onClick={() => {
              if (cart.length === 0) return;
              dispatch(setPaymentMethod('card'));
              setIsCheckoutOpen(true);
            }}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
          >
            {t.pos.checkout} €{total.toFixed(2)}
          </button>
        )}
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
        pointsToRedeem={pointsToRedeem}
        isGiftReceipt={isGiftReceipt}
      />

      <DiscountModal
        isOpen={showItemDiscountModal}
        onClose={() => setShowItemDiscountModal(false)}
        onSuccess={(_, discountAmount) => {
          if (itemDiscountTarget) {
            const item = cart.find(i => i.lineId === itemDiscountTarget);
            const itemTotal = item ? item.product.price * item.quantity : 0;
            const discountPct = itemTotal > 0 ? Math.round((discountAmount / itemTotal) * 10000) / 100 : 0;
            dispatch(setWindowItemDiscounts({ ...itemDiscounts, [itemDiscountTarget]: discountPct }));
          }
          setShowItemDiscountModal(false);
          setItemDiscountTarget(null);
        }}
        subtotal={(() => {
          const item = cart.find(i => i.lineId === itemDiscountTarget);
          return item ? item.product.price * item.quantity : 0;
        })()}
      />

      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowClearConfirm(false)} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-text-primary">{t.pos.clearCartTitle || '¿Vaciar el carrito?'}</h3>
              <p className="text-sm text-text-muted">
                {t.pos.clearCartDesc || 'Se eliminarán todos los artículos del carrito.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => { dispatch(startNewSale()); setShowClearConfirm(false); }}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-error rounded-lg hover:bg-error/90 transition-colors"
              >
                {t.pos.clearCartConfirm || 'Vaciar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
