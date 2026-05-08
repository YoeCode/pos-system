import emailjs from '@emailjs/browser';

const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

export const isEmailConfigured = (): boolean => {
  return !!(EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.TEMPLATE_ID && EMAILJS_CONFIG.PUBLIC_KEY);
};

export interface TicketEmailData {
  to_email: string;
  to_name: string;
  store_name: string;
  order_number: string;
  order_date: string;
  order_items: string;
  subtotal: string;
  tax: string;
  total: string;
  payment_method: string;
  receipt_html: string;
}

export const sendTicketEmail = async (data: TicketEmailData): Promise<void> => {
  if (!isEmailConfigured()) {
    throw new Error('EmailJS no configurado. Añade VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID y VITE_EMAILJS_PUBLIC_KEY en .env');
  }

  await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    EMAILJS_CONFIG.TEMPLATE_ID,
    {
      to_email: data.to_email,
      to_name: data.to_name,
      store_name: data.store_name,
      order_number: data.order_number,
      order_date: data.order_date,
      order_items: data.order_items,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      payment_method: data.payment_method,
      receipt_html: data.receipt_html,
    },
    EMAILJS_CONFIG.PUBLIC_KEY
  );
};
