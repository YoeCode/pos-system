import React from 'react';
import { useI18n } from '../i18n/useI18n';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const t = useI18n();
  
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#14213D' }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #0F766E 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10 w-full max-w-[450px] px-4">
        {children}
      </div>
      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-8 text-body-sm text-white/40">
        <span>{t.settings.privacyProtocol} · {t.settings.termsOfService} · v2.4.0</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
          {t.settings.systemStatusOptimal}
        </span>
      </div>
    </div>
  );
};

export default AuthLayout;
