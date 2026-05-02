import React, { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { selectSaleById } from '../sales/salesSlice';
import { selectActiveEmployees } from '../employees/employeesSlice';
import { selectStoreName, selectReceiptFooterMessage, selectTaxLabel, selectTicketConfig } from '../settings/settingsSlice';

interface SaleDetailViewProps {
  saleId: string;
  onBack: () => void;
  breadcrumbLabel: string;
}

const paymentMethodLabel: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  qr: 'QR Code',
};

const SaleDetailView: React.FC<SaleDetailViewProps> = ({ saleId, onBack, breadcrumbLabel }) => {
  const sale = useAppSelector(state => selectSaleById(state, saleId));
  const storeName = useAppSelector(selectStoreName);
  const footerMessage = useAppSelector(selectReceiptFooterMessage);
  const taxLabel = useAppSelector(selectTaxLabel);
  const allEmployees = useAppSelector(selectActiveEmployees);
  const ticketConfig = useAppSelector(selectTicketConfig);
  const [showGiftTicket, setShowGiftTicket] = useState(false);

  if (!sale) return null;

  const { order, paymentMethod, amountReceived, change, completedAt, employeeId } = sale;
  
  const employeeName = employeeId 
    ? allEmployees.find(e => e.id === employeeId)?.name 
    : null;

  const date = new Date(completedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-text-muted">/</span>
        <span className="font-medium text-text-primary">Customer</span>
        <span className="text-text-muted">/</span>
        <span className="text-text-muted">Orders</span>
        <span className="text-text-muted">/</span>
        <span className="text-primary">{breadcrumbLabel}</span>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="mx-auto w-full max-w-xs bg-white border border-dashed border-gray-300 rounded-lg p-5 font-mono text-xs">
          <div className="text-center mb-4">
            {ticketConfig?.showLogo && ticketConfig?.logoUrl && (
              <img src={ticketConfig.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
            )}
            {ticketConfig?.showStoreName && (
              <p className="font-bold text-sm text-text-primary">{storeName.toUpperCase() + ' POS'}</p>
            )}
            {ticketConfig?.customHeader && (
              <p className="text-text-muted mt-0.5">{ticketConfig.customHeader}</p>
            )}
            <p className="text-text-muted mt-0.5">{formattedDate} — {formattedTime}</p>
            <p className="text-text-muted mt-0.5">{order.orderNumber}</p>
            {ticketConfig?.showEmployee !== false && employeeName && (
              <p className="text-text-muted mt-0.5 font-medium">{employeeName}</p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="flex flex-col gap-1.5">
            {order.items.map(item => (
              <div key={item.product.id} className="flex justify-between gap-2">
                <span className="text-text-primary truncate">
                  {item.product.name || item.product.category}
                  <span className="text-text-muted ml-1">×{item.quantity}</span>
                </span>
                <span className="flex-shrink-0 text-text-primary">
                  ${item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-text-primary">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{taxLabel}</span>
              <span className="text-text-muted">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mt-0.5">
              <span className="text-text-primary">TOTAL</span>
              <span className="text-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Payment</span>
              <span className="text-text-primary">{paymentMethodLabel[paymentMethod]}</span>
            </div>
            {paymentMethod === 'cash' && amountReceived !== null && change !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-text-muted">Received</span>
                  <span className="text-text-primary">${amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Change</span>
                  <span className="text-text-primary">${change.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <p className="text-center text-text-muted">
            {ticketConfig?.customFooter || footerMessage}
          </p>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Ticket
          </button>
          <button
            onClick={() => setShowGiftTicket(!showGiftTicket)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50"
          >
            🎁 Gift Receipt
          </button>
        </div>

        {showGiftTicket && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="mx-auto w-full max-w-xs bg-white border border-dashed border-gray-300 rounded-lg p-5 font-mono text-xs">
              <div className="text-center mb-4">
                {ticketConfig?.showLogo && ticketConfig?.logoUrl && (
                  <img src={ticketConfig.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
                )}
                <p className="font-bold text-sm text-text-primary">TICKET REGALO</p>
                <p className="text-text-muted mt-0.5">GIFT RECEIPT</p>
                <p className="text-text-muted mt-0.5">{formattedDate} — {formattedTime}</p>
                <p className="text-text-muted mt-0.5">{order.orderNumber}</p>
                {ticketConfig?.showEmployee !== false && employeeName && (
                  <p className="text-text-muted mt-0.5 font-medium">{employeeName}</p>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <div className="flex flex-col gap-1.5">
                {order.items.map(item => (
                  <div key={item.product.id} className="flex justify-between gap-2">
                    <span className="text-text-primary truncate">
                      {item.product.name || item.product.category}
                      <span className="text-text-muted ml-1">×{item.quantity}</span>
                    </span>
                    <span className="flex-shrink-0 text-text-muted">---</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <p className="text-center text-text-muted">
                {ticketConfig?.customFooter || footerMessage}
              </p>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Gift Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleDetailView;