import emailjs from '@emailjs/browser';

const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

export const isEmailConfigured = (): boolean => {
  return !!(EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.PUBLIC_KEY);
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
    throw new Error('EmailJS no configurado. Añade VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_PUBLIC_KEY en .env');
  }

  await emailjs.send(
    EMAILJS_CONFIG.SERVICE_ID,
    'template_invitation',
    {
      to_email: data.to_email,
      to_name: data.to_name,
      tenant_name: data.tenant_name,
      invited_by: data.invited_by,
      invite_link: data.invite_link,
      role_label: data.role_label,
    },
    EMAILJS_CONFIG.PUBLIC_KEY
  );
};
