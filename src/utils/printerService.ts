import type { Sale, TicketConfig } from '../types';

declare global {
  interface Window {
    AndroidPrinter?: {
      print: (json: string) => void;
      openCashDrawer: () => void;
      getPrinterIp: () => string;
      getPrinterPort: () => number;
    };
  }
}

export interface ReceiptPrintData {
  storeName: string;
  orderNumber: string;
  date: string;
  time: string;
  employeeName?: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    isGift: boolean;
  }>;
  subtotal: number;
  tax: number;
  taxLabel: string;
  total: number;
  discount: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  footer: string;
  ticketConfig?: TicketConfig;
  ticketSize: '58mm' | '80mm';
  isGiftReceipt: boolean;
}

const isAndroid = typeof window !== 'undefined' && 'AndroidPrinter' in window;

export function printReceipt(data: ReceiptPrintData): void {
  if (isAndroid) {
    window.AndroidPrinter!.print(JSON.stringify(data));
  }
}

export function openCashDrawer(): void {
  if (isAndroid) {
    window.AndroidPrinter!.openCashDrawer();
  }
}

export function isPrinterAvailable(): boolean {
  return isAndroid;
}

export function buildReceiptPrintData(params: {
  sale: Sale;
  storeName: string;
  taxLabel: string;
  footerMessage: string;
  employeeName?: string;
  ticketConfig?: TicketConfig;
  ticketSize: '58mm' | '80mm';
  isGiftReceipt: boolean;
  loyaltyPointsEarned: number;
}): ReceiptPrintData {
  const { sale, storeName, taxLabel, footerMessage, employeeName, ticketConfig, ticketSize, isGiftReceipt, loyaltyPointsEarned } = params;

  const date = new Date(sale.completedAt);
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    bizum: 'Bizum',
  };

  return {
    storeName,
    orderNumber: sale.order.orderNumber,
    date: formattedDate,
    time: formattedTime,
    employeeName: employeeName || undefined,
    items: sale.order.items.map(item => ({
      name: item.product.name || item.product.category,
      qty: item.quantity,
      price: item.lineTotal,
      isGift: false,
    })),
    subtotal: sale.order.subtotal,
    tax: sale.order.tax,
    taxLabel,
    total: sale.order.total,
    discount: sale.order.discount,
    paymentMethod: paymentLabels[sale.paymentMethod] || sale.paymentMethod,
    amountReceived: sale.amountReceived ?? undefined,
    change: sale.change ?? undefined,
    loyaltyPointsEarned,
    loyaltyPointsRedeemed: sale.loyaltyPointsRedeemed,
    footer: footerMessage,
    ticketConfig,
    ticketSize,
    isGiftReceipt,
  };
}
