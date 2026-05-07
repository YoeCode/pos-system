import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { startNewSale } from '../posSlice';
import { selectSaleById } from '../../sales/salesSlice';
import { selectActiveEmployees } from '../../employees/employeesSlice';
import {
  selectStoreName,
  selectReceiptFooterMessage,
  selectTaxLabel,
  selectTicketConfig,
} from '../../settings/settingsSlice';

interface ReceiptStepProps {
  saleId: string;
  loyaltyPointsEarned: number;
  onDone: () => void;
}

const paymentMethodLabel: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  qr: 'QR Code',
};

const ReceiptStep: React.FC<ReceiptStepProps> = ({ saleId, loyaltyPointsEarned, onDone }) => {
  const dispatch = useAppDispatch();
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
    <div className="flex flex-col gap-5">
      {/* Normal ticket */}
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
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">{taxLabel}</span>
            <span className="text-text-muted">${order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-0.5">
            <span className="text-text-primary">TOTAL</span>
            <span className="text-primary">${order.total.toFixed(2)}</span>
          </div>
          {loyaltyPointsEarned > 0 && (
            <div className="flex justify-between text-purple-600 mt-0.5">
              <span>Points Earned</span>
              <span>+{loyaltyPointsEarned} pts</span>
            </div>
          )}
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

      {/* Gift ticket toggle button */}
      <button
        onClick={() => setShowGiftTicket(prev => !prev)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-lg border transition-all duration-150 text-sm bg-white border-border text-text-primary hover:border-text-primary"
      >
        <span className="font-medium">
          {showGiftTicket ? 'Ocultar Ticket Regalo' : '🎁 Imprimir Ticket Regalo'}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
          {showGiftTicket ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Gift ticket */}
      {showGiftTicket && (
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

          <p className="text-center text-text-muted">{footerMessage}</p>
        </div>
      )}

      {/* Done button */}
      <button
        onClick={() => { dispatch(startNewSale()); onDone(); }}
        className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
      >
        DONE
      </button>
    </div>
  );
};

export default ReceiptStep;
