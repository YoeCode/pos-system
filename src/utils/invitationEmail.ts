import { supabase } from '../supabase/client';

export const isEmailConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export interface InvitationEmailData {
  to_email: string;
  to_name: string;
  tenant_name: string;
  invited_by: string;
  invite_link: string;
  role_label: string;
}

export const sendInvitationEmail = async (data: InvitationEmailData): Promise<void> => {
  if (!isEmailConfigured()) {
    throw new Error('Supabase no configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env');
  }

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: data.to_email,
      subject: `${data.invited_by} te ha invitado a ${data.tenant_name}`,
      type: 'invitation',
      template_data: {
        tenant_name: data.tenant_name,
        invited_by: data.invited_by,
        invite_link: data.invite_link,
        role_label: data.role_label,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al enviar email de invitación');
  }
};
