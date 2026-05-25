import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Sale } from '../types';

export const exportElementToPDF = async (
  element: HTMLElement,
  filename: string
): Promise<void> => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, (canvas.height * 80) / canvas.width],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
  pdf.save(filename);
};

export const generateTicketPDF = (
  sale: Sale,
  storeName: string,
  taxLabel: string,
  footerMessage: string,
  employeeName?: string
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200],
  });

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);

  let y = 5;
  const centerX = 40;

  doc.setFontSize(12);
  doc.text(storeName.toUpperCase(), centerX, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  const date = new Date(sale.completedAt);
  const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  doc.text(`${dateStr} ${timeStr}`, centerX, y, { align: 'center' });
  y += 4;
  doc.text(sale.order.orderNumber, centerX, y, { align: 'center' });
  y += 4;

  if (employeeName) {
    doc.text(employeeName, centerX, y, { align: 'center' });
    y += 4;
  }

  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(5, y, 75, y);
  y += 4;

  sale.order.items.forEach(item => {
    const name = item.product.name || item.product.category;
    const qty = item.quantity;
    const lineTotal = item.lineTotal.toFixed(2);

    const leftText = `${name} x${qty}`;
    doc.text(leftText, 5, y);
    doc.text(`$${lineTotal}`, 75, y, { align: 'right' });
    y += 4;
  });

  y += 1;
  doc.line(5, y, 75, y);
  y += 4;

  doc.setFontSize(9);
  doc.text('Subtotal', 5, y);
  doc.text(`$${sale.order.subtotal.toFixed(2)}`, 75, y, { align: 'right' });
  y += 4;

  if (sale.order.discount > 0) {
    doc.text('Discount', 5, y);
    doc.text(`-$${sale.order.discount.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
  }

  doc.text(taxLabel, 5, y);
  doc.text(`$${sale.order.tax.toFixed(2)}`, 75, y, { align: 'right' });
  y += 5;

  doc.setFontSize(11);
  doc.setFont('courier', 'bold');
  doc.text('TOTAL', 5, y);
  doc.text(`$${sale.order.total.toFixed(2)}`, 75, y, { align: 'right' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.line(5, y, 75, y);
  y += 4;

  const methodLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    bizum: 'Bizum',
  };
  doc.text('Pago', 5, y);
  doc.text(methodLabels[sale.paymentMethod] || sale.paymentMethod, 75, y, { align: 'right' });
  y += 4;

  if (sale.paymentMethod === 'cash' && sale.amountReceived !== null && sale.change !== null) {
    doc.text('Recibido', 5, y);
    doc.text(`$${sale.amountReceived.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
    doc.text('Cambio', 5, y);
    doc.text(`$${sale.change.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
  }

  y += 1;
  doc.line(5, y, 75, y);
  y += 5;

  if (sale.loyaltyPointsEarned > 0) {
    doc.text(`Puntos ganados: +${sale.loyaltyPointsEarned}`, centerX, y, { align: 'center' });
    y += 4;
  }

  if (sale.loyaltyPointsRedeemed > 0) {
    doc.text(`Puntos usados: -${sale.loyaltyPointsRedeemed}`, centerX, y, { align: 'center' });
    y += 4;
  }

  doc.text(footerMessage || 'Thank you!', centerX, y, { align: 'center' });

  doc.save(`ticket-${sale.order.orderNumber}.pdf`);
};

export const exportTableToCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportTableToExcel = <T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void => {
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  });
};
