import React from 'react';
import { useAppSelector } from '../../app/store';
import { selectSaleById } from '../../features/sales/salesSlice';
import { selectActiveEmployees } from '../../features/employees/employeesSlice';
import {
  selectStoreName,
  selectReceiptFooterMessage,
  selectTaxLabel,
  selectTicketConfig,
  selectTicketSize,
} from '../../features/settings/settingsSlice';
import type { PaymentMethod } from '../../types';

interface PrintableReceiptProps {
  saleId: string;
  loyaltyPointsEarned?: number;
  giftMode?: boolean;
}

const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  bizum: 'Bizum',
};

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ saleId, loyaltyPointsEarned = 0, giftMode = false }) => {
  const sale = useAppSelector(state => selectSaleById(state, saleId));
  const storeName = useAppSelector(selectStoreName);
  const footerMessage = useAppSelector(selectReceiptFooterMessage);
  const taxLabel = useAppSelector(selectTaxLabel);
  const allEmployees = useAppSelector(selectActiveEmployees);
  const ticketConfig = useAppSelector(selectTicketConfig);
  const ticketSize = useAppSelector(selectTicketSize);

  if (!sale) return null;

  const { order, paymentMethod, amountReceived, change, completedAt, employeeId } = sale;

  const employeeName = employeeId
    ? allEmployees.find(e => e.id === employeeId)?.name
    : null;

  const date = new Date(completedAt);
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const widthClass = ticketSize === '80mm' ? 'w-[80mm]' : 'w-[58mm]';

  return (
    <div className={`${widthClass} mx-auto bg-white p-4 font-mono text-[11px] leading-relaxed print:shadow-none`}>
      <div className="text-center mb-3">
        {ticketConfig?.showLogo && ticketConfig?.logoUrl && (
          <img src={ticketConfig.logoUrl} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
        )}
        {ticketConfig?.showStoreName && (
          <p className="font-bold text-xs uppercase">{storeName}</p>
        )}
        {ticketConfig?.customHeader && (
          <p className="text-gray-500 mt-0.5">{ticketConfig.customHeader}</p>
        )}
        <p className="text-gray-500 mt-0.5">{formattedDate} {formattedTime}</p>
        <p className="text-gray-500">{order.orderNumber}</p>
        {ticketConfig?.showEmployee !== false && employeeName && (
          <p className="text-gray-500 font-medium">{employeeName}</p>
        )}
        {giftMode && (
          <>
            <p className="font-bold text-xs mt-1">TICKET REGALO</p>
            <p className="text-gray-500 text-[9px]">GIFT RECEIPT</p>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <div className="flex flex-col gap-1">
        {order.items.map(item => (
          <div key={item.product.id} className="flex justify-between gap-1">
            <span className="truncate flex-1">
              {item.product.name || item.product.category}
              <span className="text-gray-500 ml-1">×{item.quantity}</span>
            </span>
            {!giftMode ? (
              <span className="flex-shrink-0">${item.lineTotal.toFixed(2)}</span>
            ) : (
              <span className="flex-shrink-0 text-gray-400">---</span>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {!giftMode && (
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">{taxLabel}</span>
            <span className="text-gray-500">${order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xs mt-0.5">
            <span>TOTAL</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          {loyaltyPointsEarned > 0 && (
            <div className="flex justify-between text-purple-600 mt-0.5">
              <span>Puntos ganados</span>
              <span>+{loyaltyPointsEarned} pts</span>
            </div>
          )}
          {sale.loyaltyPointsRedeemed > 0 && (
            <div className="flex justify-between text-purple-600 mt-0.5">
              <span>Puntos usados</span>
              <span>-{sale.loyaltyPointsRedeemed} pts</span>
            </div>
          )}
        </div>
      )}

      {!giftMode && (
        <>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Pago</span>
              <span>{paymentMethodLabel[paymentMethod]}</span>
            </div>
            {paymentMethod === 'cash' && amountReceived !== null && change !== null && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recibido</span>
                  <span>${amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cambio</span>
                  <span>${change.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="border-t border-dashed border-gray-400 my-2" />

      <p className="text-center text-gray-500 text-[9px]">
        {ticketConfig?.customFooter || footerMessage}
      </p>
      <p className="text-center text-gray-400 text-[8px] mt-1">
        Gracias por su compra
      </p>
    </div>
  );
};

export default PrintableReceipt;
