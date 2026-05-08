import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectAllSales } from '../../features/sales/salesSlice';
import { selectRefundSettings } from '../../features/settings/settingsSlice';
import { selectActiveEmployees } from '../../features/employees/employeesSlice';
import { restoreStock } from '../../features/products/productsSlice';
import { deductLoyaltyPoints } from '../../features/customers/customersSlice';
import { addRefund } from './refundsSlice';
import Modal from '../../components/ui/Modal';
import type { Sale, RefundItem, PaymentMethod } from '../../types';

type RefundStep = 'search' | 'select' | 'confirm';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  bizum: 'Bizum',
};

const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const allSales = useAppSelector(selectAllSales);
  const refundSettings = useAppSelector(selectRefundSettings);
  const employees = useAppSelector(selectActiveEmployees);
  const currentEmployeeId = useAppSelector(state => state.pos.currentEmployeeId);
  const currentUser = useAppSelector(state => state.auth.user);
  const tiers = useAppSelector(state => state.settings.loyalty.tiers);

  const [step, setStep] = useState<RefundStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [completed, setCompleted] = useState(false);

  const employeeName = currentEmployeeId
    ? employees.find(e => e.id === currentEmployeeId)?.name
    : currentUser?.name;

  const maxDays = refundSettings.maxRefundDays;
  const now = new Date();

  const filteredSales = searchQuery.trim()
    ? allSales.filter(s => {
        const saleDate = new Date(s.completedAt);
        const daysDiff = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > maxDays) return false;
        return (
          s.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.order.items.some(i => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : [];

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setSelectedItems({});
    setReason('');
    setPin('');
    setPinError('');
    setStep('select');
  };

  const toggleItem = (productId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const current = prev[productId] || 0;
      if (current >= maxQty) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: current + 1 };
    });
  };

  const updateQty = (productId: string, qty: number, maxQty: number) => {
    if (qty <= 0) {
      setSelectedItems(prev => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedItems(prev => ({ ...prev, [productId]: Math.min(qty, maxQty) }));
    }
  };

  const refundTotal = selectedSale
    ? Object.entries(selectedItems).reduce((sum, [pid, qty]) => {
        const item = selectedSale.order.items.find(i => i.product.id === pid);
        return sum + (item ? item.product.price * qty : 0);
      }, 0)
    : 0;

  const needsPin = refundSettings.enabled && refundSettings.requirePin && refundTotal >= refundSettings.pinThreshold;

  const handleConfirm = () => {
    if (!selectedSale || Object.keys(selectedItems).length === 0) return;

    if (needsPin) {
      const authorizer = employees.find(e => e.pin === pin.trim());
      if (!authorizer) {
        setPinError('PIN incorrecto');
        return;
      }
    }

    const items: RefundItem[] = Object.entries(selectedItems).map(([pid, qty]) => {
      const item = selectedSale.order.items.find(i => i.product.id === pid)!;
      return {
        productId: pid,
        productName: item.product.name,
        quantity: qty,
        unitPrice: item.product.price,
        lineTotal: item.product.price * qty,
        selectedSize: item.product.sizes?.length ? item.product.sizes[0].size : undefined,
      };
    });

    const refund = {
      id: crypto.randomUUID(),
      originalSaleId: selectedSale.id,
      orderNumber: selectedSale.order.orderNumber,
      items,
      totalAmount: refundTotal,
      refundMethod: selectedSale.paymentMethod,
      reason: reason || 'Devolución',
      createdAt: new Date().toISOString(),
      employeeId: currentEmployeeId || currentUser?.id,
      authorizedBy: needsPin ? pin : undefined,
      customerId: selectedSale.customerId,
    };

    dispatch(addRefund(refund));

    items.forEach(item => {
      dispatch(restoreStock({ productId: item.productId, quantity: item.quantity, size: item.selectedSize }));
    });

    if (selectedSale.customerId && selectedSale.loyaltyPointsEarned > 0) {
      const proportion = refundTotal / selectedSale.order.total;
      const pointsToDeduct = Math.floor(selectedSale.loyaltyPointsEarned * proportion);
      dispatch(deductLoyaltyPoints({
        customerId: selectedSale.customerId,
        points: pointsToDeduct,
        amountSpent: refundTotal,
        tiers,
      }));
    }

    setCompleted(true);
    setTimeout(() => {
      handleReset();
      onClose();
    }, 2000);
  };

  const handleReset = () => {
    setStep('search');
    setSearchQuery('');
    setSelectedSale(null);
    setSelectedItems({});
    setReason('');
    setPin('');
    setPinError('');
    setCompleted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!refundSettings.enabled) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Devoluciones">
        <div className="p-6 text-center text-text-muted">
          Las devoluciones están deshabilitadas en la configuración.
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Procesar Devolución">
      {completed ? (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Devolución procesada</h3>
          <p className="text-text-muted">${refundTotal.toFixed(2)} devueltos</p>
        </div>
      ) : step === 'search' ? (
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Buscar venta</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Número de orden o nombre de producto..."
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>

          {filteredSales.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {filteredSales.map(sale => (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => handleSelectSale(sale)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-text-primary">{sale.order.orderNumber}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(sale.completedAt).toLocaleDateString()} · {sale.order.items.length} items · ${sale.order.total.toFixed(2)}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-center text-text-muted text-sm py-4">No se encontraron ventas</p>
          ) : (
            <p className="text-center text-text-muted text-sm py-4">Escribe para buscar una venta</p>
          )}
        </div>
      ) : step === 'select' && selectedSale ? (
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{selectedSale.order.orderNumber}</p>
              <p className="text-xs text-text-muted">{new Date(selectedSale.completedAt).toLocaleDateString()}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep('search')}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Cambiar venta
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {selectedSale.order.items.map(item => {
              const qty = selectedItems[item.product.id] || 0;
              return (
                <div
                  key={item.product.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    qty > 0 ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.product.id, item.quantity)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      qty > 0 ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {qty > 0 && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.product.name}</p>
                    <p className="text-xs text-text-muted">${item.product.price.toFixed(2)} · max {item.quantity}</p>
                  </div>
                  {qty > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, qty - 1, item.quantity)}
                        className="w-6 h-6 rounded border border-border text-text-muted hover:border-error hover:text-error flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, qty + 1, item.quantity)}
                        className="w-6 h-6 rounded border border-border text-text-muted hover:border-primary hover:text-primary flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Producto defectuoso, cambio de talla..."
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-text-muted">
              {Object.keys(selectedItems).length} items seleccionados
            </span>
            <button
              type="button"
              onClick={() => Object.keys(selectedItems).length > 0 && setStep('confirm')}
              disabled={Object.keys(selectedItems).length === 0}
              className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continuar (${refundTotal.toFixed(2)})
            </button>
          </div>
        </div>
      ) : step === 'confirm' && selectedSale ? (
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-text-primary">Resumen de devolución</p>
            {Object.entries(selectedItems).map(([pid, qty]) => {
              const item = selectedSale.order.items.find(i => i.product.id === pid)!;
              return (
                <div key={pid} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{item.product.name} × {qty}</span>
                  <span className="font-mono text-text-primary">${(item.product.price * qty).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">Total a devolver</span>
              <span className="font-bold text-xl text-primary">${refundTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Método original</span>
              <span className="text-text-primary">{paymentMethodLabel[selectedSale.paymentMethod]}</span>
            </div>
            {reason && (
              <div className="text-sm">
                <span className="text-text-muted">Motivo: </span>
                <span className="text-text-primary">{reason}</span>
              </div>
            )}
          </div>

          {needsPin && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                PIN de autorización (requerido por ${refundSettings.pinThreshold}+)
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(''); }}
                placeholder="****"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {pinError && <p className="text-xs text-error mt-1">{pinError}</p>}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 py-3 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Confirmar devolución
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default RefundModal;
