import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import CategoryPills from '../../features/pos/CategoryPills';
import ProductCard from '../../features/pos/ProductCard';
import Cart from '../../features/pos/Cart';
import ManualProductModal from '../../features/pos/ManualProductModal';
import CheckoutModal from '../../features/pos/checkout/CheckoutModal';
import SearchInput from '../../features/pos/SearchInput';
import Modal from '../../components/ui/Modal';
import EmployeeSelector from '../../features/pos/EmployeeSelector';
import CashBoxOpenModal from '../../features/pos/CashBoxOpenModal';
import CashBoxCloseModal from '../../features/pos/CashBoxCloseModal';
import AddEmployeeToCashBoxModal from '../../features/pos/AddEmployeeToCashBoxModal';
import RefundModal from '../../features/refunds/RefundModal';
import DiscountModal from '../../features/pos/DiscountModal';
import { useI18n } from '../../i18n/useI18n';
import {
  addCustomProductToCart, setPaymentMethod, undoCartAction, setSearchQuery,
  selectIsCashBoxOpen,
  selectActiveWindowCart, selectActiveWindowPaymentMethod, selectActiveWindowCustomerId,
  selectActiveWindowItemDiscounts, selectActiveWindowManualDiscount, selectActiveWindowPointsToRedeem,
  selectActiveWindowIsGiftReceipt,
  setWindowManualDiscount,
} from '../../features/pos/posSlice';
import { selectEnableManualProduct, selectFormattedOrderNumber, selectTaxRate, selectTaxIncludedInPrice, selectLoyaltyTiers } from '../../features/settings/settingsSlice';
import { selectCustomerById } from '../../features/customers/customersSlice';
import { calculateCart } from '../../features/pos/calculation';
import Fuse from 'fuse.js';
import { usePermission } from '../../hooks/usePermission';


const POSPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedCategory, searchQuery } = useAppSelector(state => state.pos);
  const cart = useAppSelector(selectActiveWindowCart);
  const paymentMethod = useAppSelector(selectActiveWindowPaymentMethod);
  const selectedCustomerId = useAppSelector(selectActiveWindowCustomerId);
  const itemDiscounts = useAppSelector(selectActiveWindowItemDiscounts);
  const manualDiscount = useAppSelector(selectActiveWindowManualDiscount);
  const pointsToRedeem = useAppSelector(selectActiveWindowPointsToRedeem);
  const isGiftReceipt = useAppSelector(selectActiveWindowIsGiftReceipt);
  const products = useAppSelector(state => state.products.items);
  const enableManualProduct = useAppSelector(selectEnableManualProduct);
  const orderNumber = useAppSelector(selectFormattedOrderNumber);
  const taxRate = useAppSelector(selectTaxRate);
  const taxIncludedInPrice = useAppSelector(selectTaxIncludedInPrice);
  const tiers = useAppSelector(selectLoyaltyTiers);
  const selectedCustomer = useAppSelector(s =>
    selectedCustomerId ? selectCustomerById(s, selectedCustomerId) : null
  );
  const isCashBoxOpen = useAppSelector(selectIsCashBoxOpen);
  const t = useI18n();
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showCashBoxModal, setShowCashBoxModal] = useState(false);
  const [showCashBoxCloseModal, setShowCashBoxCloseModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { hasPermission } = usePermission();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isActionsMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      switch (e.key) {
        case 'f':
        case 'F':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'z':
        case 'Z':
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            dispatch(undoCartAction());
          }
          break;
        case 'Escape':
          if (isCheckoutOpen) { setIsCheckoutOpen(false); }
          else if (isCartOpen) { setIsCartOpen(false); }
          else if (isManualModalOpen) { setIsManualModalOpen(false); }
          else if (showRefundModal) { setShowRefundModal(false); }
          else if (showDiscountModal) { setShowDiscountModal(false); }
          else if (showCashBoxCloseModal) { setShowCashBoxCloseModal(false); }
          else if (showCashBoxModal) { setShowCashBoxModal(false); }
          else if (showAddEmployeeModal) { setShowAddEmployeeModal(false); }
          else if (isActionsMenuOpen) { setIsActionsMenuOpen(false); }
          break;
        case 'F1':
          e.preventDefault();
          if (isCashBoxOpen && cart.length > 0) dispatch(setPaymentMethod('cash'));
          break;
        case 'F2':
          e.preventDefault();
          if (isCashBoxOpen && cart.length > 0) dispatch(setPaymentMethod('card'));
          break;
        case 'F3':
          e.preventDefault();
          if (isCashBoxOpen && cart.length > 0) dispatch(setPaymentMethod('bizum'));
          break;
        case 'F4':
          e.preventDefault();
          if (isCashBoxOpen && cart.length > 0) setIsCheckoutOpen(true);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCashBoxOpen, cart.length, isCheckoutOpen, isCartOpen, isManualModalOpen, showRefundModal, showDiscountModal, showCashBoxCloseModal, showCashBoxModal, showAddEmployeeModal, isActionsMenuOpen, dispatch]);

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
    pointsToRedeem,
  });

  const { grossSubtotal, totalDiscount, tax, total } = calc;

  return (
    <div className="flex flex-col md:flex-row w-full min-w-0 md:h-full md:overflow-hidden">
      {/* Products area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0 md:overflow-hidden">
        <div className="px-3 lg:px-6 pt-3 lg:pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            {isCashBoxOpen ? (
              <>
                <EmployeeSelector />
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    onClick={() => setIsActionsMenuOpen(o => !o)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
                    title={t.pos.actions || 'Acciones'}
                    aria-label={t.pos.actions || 'Acciones'}
                    aria-expanded={isActionsMenuOpen}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {isActionsMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-border shadow-lg z-50 py-1.5">
                      {hasPermission('cashbox:add_employee') && (
                        <button
                          onClick={() => { setShowAddEmployeeModal(true); setIsActionsMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          {t.pos.addSeller || 'Añadir vendedor'}
                        </button>
                      )}
                      {hasPermission('pos:refund') && (
                        <button
                          onClick={() => { setShowRefundModal(true); setIsActionsMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          {t.pos.refund || 'Devolución'}
                        </button>
                      )}
                      {hasPermission('cashbox:close') && (
                        <>
                          <div className="mx-3.5 my-1 h-px bg-border" />
                        <button
                          onClick={() => { setShowCashBoxCloseModal(true); setIsActionsMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t.pos.closeCashBox || 'Cerrar caja'}
                        </button>
                        </>
                      )}
                      <div className="mx-3.5 my-1 h-px bg-border" />
                      <button
                        onClick={() => { setShowShortcutsModal(true); setIsActionsMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-muted hover:bg-gray-50 transition-colors text-left"
                      >
                        <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t.pos.keyboardShortcuts || 'Atajos de teclado'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {isCashBoxOpen && (
          <div className="px-3 lg:px-6 pt-2 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <CategoryPills />
              </div>
              {enableManualProduct && hasPermission('pos:manual_product') && (
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors items-center gap-2 whitespace-nowrap"
                  title={t.settings.addManualProduct}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">{t.settings.addManualProduct}</span>
                </button>
              )}
            </div>
            <SearchInput ref={searchInputRef} />
          </div>
        )}

        {isCashBoxOpen ? (
          <div className="flex-1 px-3 lg:px-6 pb-4 md:overflow-y-auto md:overscroll-y-contain">
            {filteredBySearch.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-text-muted text-sm font-medium">
                  {searchQuery ? t.pos.noSearchResults || 'No se encontraron productos' : t.common.noResults}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => dispatch(setSearchQuery(''))}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    {t.pos.clearSearch || 'Ver todos los productos'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                {filteredBySearch.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-3 lg:px-6 pb-4 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-5">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">{t.pos.cashBoxClosedTitle || 'Caja cerrada'}</h3>
            <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
              {t.pos.cashBoxClosedDesc || 'Abre la caja registradora para registrar tu turno y empezar a procesar ventas.'}
            </p>
            {hasPermission('cashbox:open') ? (
              <button
                onClick={() => setShowCashBoxModal(true)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
              >
                {t.pos.openCashBox || 'Abrir caja'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg text-sm text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t.pos.cashBoxPermissionRequired || 'Solo un supervisor puede abrir la caja'}
              </div>
            )}
          </div>
        )}
      </div>

      {isCashBoxOpen && (
        <div className="hidden md:flex md:w-[340px] lg:w-[380px] xl:w-[420px] flex-shrink-0 h-full">
          <Cart />
        </div>
      )}

      {isCashBoxOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom)]">
          {cart.length > 0 ? (
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-white border-t border-border text-text-primary py-3.5 px-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white px-2.5 py-1 rounded-lg text-sm font-semibold">
                  {cart.length}
                </span>
                <span className="font-medium text-sm">{t.pos.viewCart || 'Ver carrito'}</span>
              </div>
              <span className="font-bold text-lg text-primary">€{total.toFixed(2)}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-white border-t border-border py-3 px-4 text-center text-sm text-text-muted hover:bg-gray-50 transition-colors"
            >
              {t.pos.emptyCart}
            </button>
          )}
        </div>
      )}

      {/* Full Bottom Sheet Cart Modal */}
      {isCartOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[85vh] flex flex-col">
            <Cart variant="bottomSheet" onClose={() => setIsCartOpen(false)} />
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
        pointsToRedeem={pointsToRedeem}
        isGiftReceipt={isGiftReceipt}
      />

      <CashBoxOpenModal isOpen={showCashBoxModal} onClose={() => setShowCashBoxModal(false)} />

      <AddEmployeeToCashBoxModal isOpen={showAddEmployeeModal} onClose={() => setShowAddEmployeeModal(false)} />

      <RefundModal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSuccess={(_, discountAmount) => {
          dispatch(setWindowManualDiscount(discountAmount));
          setShowDiscountModal(false);
        }}
        subtotal={rawSubtotal}
      />

      <CashBoxCloseModal isOpen={showCashBoxCloseModal} onClose={() => setShowCashBoxCloseModal(false)} />

      <Modal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} title={t.pos.keyboardShortcuts || 'Atajos de teclado'}>
        <div className="flex flex-col gap-3 p-2">
          {[
            { key: 'F', action: t.pos.shortcutSearch || 'Buscar productos' },
            { key: 'Ctrl + Z', action: t.pos.shortcutUndo || 'Deshacer última acción' },
            { key: 'F1', action: t.pos.shortcutCash || 'Pago en efectivo' },
            { key: 'F2', action: t.pos.shortcutCard || 'Pago con tarjeta' },
            { key: 'F3', action: t.pos.shortcutBizum || 'Pago con Bizum' },
            { key: 'F4', action: t.pos.shortcutCheckout || 'Abrir checkout' },
            { key: 'Esc', action: t.pos.shortcutClose || 'Cerrar modal / carrito' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-text-primary">{item.action}</span>
              <kbd className="px-2 py-1 bg-white border border-border rounded text-xs font-mono font-semibold text-text-muted shadow-sm">{item.key}</kbd>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default POSPage;