import { supabase } from '../supabase/client';

export const isEmailConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
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
    throw new Error('Supabase no configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env');
  }

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: data.to_email,
      subject: `${data.store_name} — Ticket ${data.order_number}`,
      type: 'ticket',
      template_data: {
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
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al enviar email');
  }
};
