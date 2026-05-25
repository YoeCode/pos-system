import React, { useRef, useState } from 'react';
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
import { exportElementToPDF } from '../../../utils/exportUtils';
import { sendTicketEmail, isEmailConfigured } from '../../../utils/emailService';
import { useToast } from '../../../components/ToastProvider';

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
  const pdfRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { addToast } = useToast();

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

  const handlePDF = async () => {
    if (!pdfRef.current) return;
    try {
      const clone = pdfRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.opacity = '1';
      clone.classList.remove('hidden');

      const ticket = clone.querySelector('[class*="w-[80mm]"], [class*="w-[58mm]"]') as HTMLElement | null;
      if (ticket) {
        ticket.style.margin = '0';
        ticket.style.marginLeft = '0';
        ticket.style.marginRight = '0';
        ticket.style.width = '320px';
        ticket.style.maxWidth = '320px';
        ticket.style.minWidth = '320px';
      }

      document.body.appendChild(clone);

      await exportElementToPDF(clone, `ticket-${order.orderNumber}.pdf`);

      document.body.removeChild(clone);
      addToast('PDF descargado', 'success');
    } catch {
      addToast('Error al generar PDF', 'error');
    }
  };

  const handleEmail = async () => {
    if (!email.trim() || !pdfRef.current) return;
    if (!isEmailConfigured()) {
      addToast('Email no configurado. Revisa la documentación.', 'error');
      return;
    }
    setSendingEmail(true);
    try {
      const itemsText = order.items.map(i => `${i.product.name} x${i.quantity} = $${i.lineTotal.toFixed(2)}`).join('\n');
      await sendTicketEmail({
        to_email: email.trim(),
        to_name: email.trim().split('@')[0],
        store_name: storeName,
        order_number: order.orderNumber,
        order_date: `${formattedDate} ${formattedTime}`,
        order_items: itemsText,
        subtotal: `$${order.subtotal.toFixed(2)}`,
        tax: `$${order.tax.toFixed(2)}`,
        total: `$${order.total.toFixed(2)}`,
        payment_method: paymentMethodLabel[paymentMethod],
        receipt_html: pdfRef.current.outerHTML,
      });
      addToast('Ticket enviado por email', 'success');
      setEmail('');
    } catch {
      addToast('Error al enviar email', 'error');
    } finally {
      setSendingEmail(false);
    }
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
          {sale.loyaltyPointsRedeemed > 0 && (
            <div className="flex justify-between text-purple-600 mt-0.5">
              <span>Points Used</span>
              <span>-{sale.loyaltyPointsRedeemed} pts</span>
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

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handlePrint(false)}
          className="py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir
        </button>
        <button
          onClick={() => handlePrint(true)}
          className="py-3 bg-white border border-border hover:border-text-primary text-text-primary font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Regalo
        </button>
        <button
          onClick={handlePDF}
          className="py-3 bg-white border border-border hover:border-text-primary text-text-primary font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          PDF
        </button>
        <button
          onClick={onDone}
          className="py-3 bg-white border border-border hover:border-text-primary text-text-primary font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          Cerrar
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="cliente@email.com"
            className="flex-1 px-3 py-2.5 text-sm border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          <button
            onClick={handleEmail}
            disabled={sendingEmail || !email.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] flex items-center gap-2"
          >
            {sendingEmail ? (
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            )}
            Enviar
          </button>
        </div>
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
      <div ref={pdfRef} className="hidden">
        <PrintableReceipt saleId={saleId} loyaltyPointsEarned={loyaltyPointsEarned} />
      </div>
    </div>
  );
};

export default ReceiptStep;
