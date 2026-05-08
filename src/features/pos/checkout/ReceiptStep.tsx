import React, { useRef } from 'react';
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
import PrintableReceipt from '../PrintableReceipt';

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
  const printRefNormal = useRef<HTMLDivElement>(null);
  const printRefGift = useRef<HTMLDivElement>(null);

  const handlePrint = (giftMode: boolean) => {
    const ref = giftMode ? printRefGift : printRefNormal;
    if (!ref.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket ${order.orderNumber}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            body { font-family: monospace; background: white; }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${ref.current.innerHTML}
          <div class="no-print flex justify-center gap-3 p-6">
            <button onclick="window.print()" class="px-5 py-2.5 bg-primary text-white rounded-lg font-bold">Imprimir</button>
            <button onclick="window.close()" class="px-5 py-2.5 border border-border rounded-lg font-medium">Cerrar</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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

      <div className="flex gap-3">
        <button
          onClick={() => handlePrint(false)}
          className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir Ticket
        </button>
        <button
          onClick={() => handlePrint(true)}
          className="flex-1 py-3 bg-white border border-border hover:border-text-primary text-text-primary font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir Regalo
        </button>
      </div>

      <button
        onClick={() => { dispatch(startNewSale()); onDone(); }}
        className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-text-primary font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
      >
        Nueva venta
      </button>

      <div ref={printRefNormal} className="hidden">
        <PrintableReceipt saleId={saleId} loyaltyPointsEarned={loyaltyPointsEarned} />
      </div>
      <div ref={printRefGift} className="hidden">
        <PrintableReceipt saleId={saleId} loyaltyPointsEarned={loyaltyPointsEarned} giftMode />
      </div>
    </div>
  );
};

export default ReceiptStep;
