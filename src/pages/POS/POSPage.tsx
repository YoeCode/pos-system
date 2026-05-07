import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import CategoryPills from '../../features/pos/CategoryPills';
import ProductCard from '../../features/pos/ProductCard';
import Cart from '../../features/pos/Cart';
import ManualProductModal from '../../features/pos/ManualProductModal';
import CheckoutModal from '../../features/pos/checkout/CheckoutModal';
import CustomerSelector from '../../features/customers/CustomerSelector';
import SearchInput from '../../features/pos/SearchInput';
import EmployeeSelector from '../../features/pos/EmployeeSelector';
import CashBoxOpenModal from '../../features/pos/CashBoxOpenModal';
import DiscountModal from '../../features/pos/DiscountModal';
import { useI18n } from '../../i18n/I18nProvider';
import { addCustomProductToCart, updateQuantity, removeFromCart, splitLine, setPaymentMethod, startNewSale, selectIsCashBoxOpen, closeCashBox } from '../../features/pos/posSlice';
import { selectEnableManualProduct, selectFormattedOrderNumber, selectTaxRate, selectTaxLabel, selectTaxIncludedInPrice, selectLoyaltyTiers } from '../../features/settings/settingsSlice';
import { selectCustomerById } from '../../features/customers/customersSlice';
import { calculateCart } from '../../features/pos/calculation';
import Fuse from 'fuse.js';
import type { PaymentMethod, Employee } from '../../types';

const POSPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedCategory, cart, paymentMethod, selectedCustomerId, searchQuery } = useAppSelector(state => state.pos);
  const products = useAppSelector(state => state.products.items);
  const enableManualProduct = useAppSelector(selectEnableManualProduct);
  const orderNumber = useAppSelector(selectFormattedOrderNumber);
  const taxRate = useAppSelector(selectTaxRate);
  const taxIncludedInPrice = useAppSelector(selectTaxIncludedInPrice);
  const taxLabel = useAppSelector(selectTaxLabel);
  const tiers = useAppSelector(selectLoyaltyTiers);
  const selectedCustomer = useAppSelector(s =>
    selectedCustomerId ? selectCustomerById(s, selectedCustomerId) : null
  );
  const isCashBoxOpen = useAppSelector(selectIsCashBoxOpen);
  const t = useI18n();
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showCloseBoxConfirm, setShowCloseBoxConfirm] = useState(false);
  const [showCashBoxModal, setShowCashBoxModal] = useState(false);
  const [closedBoxCount, setClosedBoxCount] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showItemDiscountModal, setShowItemDiscountModal] = useState(false);
  const [itemDiscountTarget, setItemDiscountTarget] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const [authorizedBy, setAuthorizedBy] = useState<Employee | null>(null);

  const filtered = selectedCategory === 'All Items'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const fuse = React.useMemo(() => {
    return new Fuse(filtered, {
      keys: ['name', 'brand', 'category'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [filtered]);
  
  const filteredBySearch = searchQuery
    ? fuse.search(searchQuery).map(r => r.item)
    : filtered;

  const handleAddManualProduct = (product: { name: string; category: string; brand?: string; price: number }) => {
    dispatch(addCustomProductToCart(product));
  };

  const rawSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const tierConfig = tiers.find(t => t.tier === selectedCustomer?.tier);

  const calc = calculateCart(cart, {
    taxRate,
    taxIncludedInPrice,
    itemDiscounts,
    loyaltyTierConfig: selectedCustomer && tierConfig ? tierConfig : undefined,
    manualDiscount,
  });

  const { grossSubtotal, totalDiscount, tax, total } = calc;
  const loyaltyPct = selectedCustomer && tierConfig ? tierConfig.discountPct : 0;
  const itemDiscountTotal = calc.lines.reduce((sum, l) => sum + l.itemDiscountAmount, 0);
  const loyaltyTotal = calc.lines.reduce((sum, l) => sum + (l.discountSource === 'loyalty' ? l.appliedDiscount : 0), 0);
  const appliedGlobalDiscount = loyaltyTotal;
  const isLoyaltyGlobal = loyaltyTotal > 0;

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] lg:flex-row w-full min-w-0 overflow-x-hidden">
      {/* Products area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-20 lg:pb-0">
        <div className="px-3 lg:px-6 pt-3 lg:pt-5 pb-2 flex-shrink-0">
          <div className="mb-3">
            <div className="flex items-center justify-between">
              {isCashBoxOpen ? (
                <>
                  <EmployeeSelector />
                  <button
                    onClick={() => setShowCloseBoxConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cerrar caja
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowCashBoxModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Abrir caja
                </button>
              )}
            </div>
          </div>
          {isCashBoxOpen && (
            <>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <CategoryPills />
                </div>
                {enableManualProduct && (
                  <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="hidden sm:flex px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors items-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden md:inline">{t.settings.addManualProduct}</span>
                  </button>
                )}
              </div>
              <SearchInput />
            </>
          )}
        </div>

        {isCashBoxOpen ? (
          <div className="flex-1 overflow-y-auto px-3 lg:px-6 pb-4">
            {filteredBySearch.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <p className="text-text-muted text-sm">{searchQuery ? t.common.noResults : t.common.noResults}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3">
                {filteredBySearch.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-3 lg:px-6 pb-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-muted font-medium">Caja cerrada</p>
            <p className="text-text-muted text-sm mt-1">Abre la caja para empezar a vender</p>
          </div>
        )}
      </div>

      {isCashBoxOpen && (
        <div className="hidden lg:flex lg:w-[320px] xl:w-[360px] flex-shrink-0">
          <Cart />
        </div>
      )}

      {isCashBoxOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
          {cart.length > 0 ? (
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 px-4 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="bg-white/20 px-2 py-1 rounded text-sm font-medium">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
                <span className="font-semibold">View Cart</span>
              </div>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
            </button>
          ) : (
            <div className="w-full bg-gray-100 border-t border-border py-2 px-4 text-center text-sm text-text-muted">
              Add products to cart
            </div>
          )}
        </div>
      )}

      {/* Full Bottom Sheet Cart Modal */}
      {isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">{t.pos.cart}</h2>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => dispatch(startNewSale())}
                    className="p-2 text-text-muted hover:text-error"
                    title="Clear cart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-text-muted hover:text-text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Customer Selector */}
            <div className="px-4 py-2 border-b border-border">
              <CustomerSelector />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-center text-text-muted py-8">Cart is empty</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map(item => (
                    <div key={item.lineId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold flex-shrink-0">
                        {(item.product.name || item.product.category).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.product.name || item.product.category}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-text-muted">€{(item.product.price * item.quantity).toFixed(2)}</p>
                          {itemDiscounts[item.lineId] && (
                            <span className="text-xs font-mono text-green-600">-€{(item.product.price * item.quantity * (itemDiscounts[item.lineId] || 0) / 100).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => dispatch(updateQuantity({ lineId: item.lineId, quantity: item.quantity - 1 }))}
                          className="w-6 h-6 rounded border border-border text-text-muted hover:border-error hover:text-error flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold font-mono">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ lineId: item.lineId, quantity: item.quantity + 1 }))}
                          className="w-6 h-6 rounded border border-border text-text-muted hover:border-primary hover:text-primary flex items-center justify-center"
                        >
                          +
                        </button>
                        {item.quantity > 1 && (
                          <button
                            onClick={() => dispatch(splitLine(item.lineId))}
                            className="w-6 h-6 rounded text-blue-500 hover:text-blue-600 flex items-center justify-center"
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
                          className="w-6 h-6 rounded text-amber-500 hover:text-amber-600 flex items-center justify-center"
                          title={t.pos.itemDiscount || 'Discount'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => dispatch(removeFromCart(item.lineId))}
                          className="w-6 h-6 rounded text-text-muted hover:text-error flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with totals and checkout */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-border bg-gray-50">
                {itemDiscountTotal > 0 && (
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-green-600">Item Discounts</span>
                    <span className="font-mono text-green-600">-${itemDiscountTotal.toFixed(2)}</span>
                  </div>
                )}
                {appliedGlobalDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className={isLoyaltyGlobal ? 'text-blue-600' : 'text-green-600'}>
                      {isLoyaltyGlobal ? `Loyalty (${selectedCustomer?.tier})` : 'Manual Discount'}
                    </span>
                    <span className={`font-mono ${isLoyaltyGlobal ? 'text-blue-600' : 'text-green-600'}`}>-${appliedGlobalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">{t.pos.subtotal}</span>
                  <span className="font-mono text-text-primary">${grossSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-text-muted">{taxLabel}</span>
                  <span className="font-mono text-text-muted">${tax.toFixed(2)}</span>
                </div>

                {manualDiscount === 0 && loyaltyPct === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(true)}
                    className="w-full py-2 mb-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                  >
                    {t.pos.manualDiscount || 'Apply Discount'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 mb-3">
                    {manualDiscount > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-green-700 flex-1">
                          Authorized by {authorizedBy?.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setManualDiscount(0); setAuthorizedBy(null); }}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    )}
                    {loyaltyPct > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-blue-700 flex-1">
                          Loyalty {((selectedCustomer?.tier || '') as string).charAt(0).toUpperCase() + ((selectedCustomer?.tier || '') as string).slice(1)}: {loyaltyPct * 100}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-text-primary">{t.pos.total}</span>
                  <span className="font-bold text-xl text-primary">${total.toFixed(2)}</span>
                </div>
                
                {/* Payment method */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">{t.pos.paymentMethod}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['cash', 'card', 'bizum'] as PaymentMethod[]).map(method => (
                      <button
                        key={method}
                        onClick={() => dispatch(setPaymentMethod(method))}
                        className={`py-2 rounded-lg text-xs font-semibold ${
                          paymentMethod === method
                            ? 'bg-[#1B2B4B] text-white'
                            : 'bg-white border border-border text-text-muted'
                        }`}
                      >
                        {t.pos[method].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl"
                >
                  {t.pos.checkout.toUpperCase()} ${total.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddManualProduct}
      />

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

      <CashBoxOpenModal isOpen={showCashBoxModal} closedBoxCount={closedBoxCount} onClose={() => setShowCashBoxModal(false)} />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSuccess={(employee, discountAmount) => {
          setAuthorizedBy(employee);
          setManualDiscount(discountAmount);
          setShowDiscountModal(false);
        }}
        subtotal={rawSubtotal}
      />

      <DiscountModal
        isOpen={showItemDiscountModal}
        onClose={() => setShowItemDiscountModal(false)}
        onSuccess={(employee, discountAmount) => {
          if (itemDiscountTarget) {
            const item = cart.find(i => i.lineId === itemDiscountTarget);
            const itemTotal = item ? item.product.price * item.quantity : 0;
            const discountPct = itemTotal > 0 ? Math.round((discountAmount / itemTotal) * 10000) / 100 : 0;
            setItemDiscounts(prev => ({ ...prev, [itemDiscountTarget]: discountPct }));
          }
          setAuthorizedBy(employee);
          setShowItemDiscountModal(false);
          setItemDiscountTarget(null);
        }}
        subtotal={(() => {
          const item = cart.find(i => i.lineId === itemDiscountTarget);
          return item ? item.product.price * item.quantity : 0;
        })()}
      />

      {showCloseBoxConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCloseBoxConfirm(false)} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-text-primary">¿Cerrar caja?</h3>
              <p className="text-sm text-text-muted mt-1">
                Esto.finalizará el turno actual
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseBoxConfirm(false)}
                className="flex-1 py-3 text-sm font-medium border border-border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setClosedBoxCount(c => c + 1);
                  dispatch(closeCashBox());
                  setShowCloseBoxConfirm(false);
                }}
                className="flex-1 py-3 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;