import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { login, loginSuccess, loginFailure, clearError } from '../../features/auth/authSlice';
import { authenticateUser } from '../../features/auth/authSlice';
import { useI18n } from '../../i18n/I18nProvider';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { error, isLoading } = useAppSelector(state => state.auth);
  const t = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login());

    const trimmedEmail = email.trim().toLowerCase();
    const user = authenticateUser(trimmedEmail, password);

    if (user) {
      dispatch(loginSuccess(user));
      navigate('/pos');
    } else {
      dispatch(loginFailure(t.auth.invalidCredentials));
    }
  };

  return (
    <div className="bg-dark-surface rounded-2xl shadow-2xl border border-dark-border overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 text-center border-b border-dark-border">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-2h-2v2zm0 3h2v-2h-2v2zm-2-3h2v-2h-2v2zm3-5h2v-2h-2v2zm2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-3 0h2v-2h-2v2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-dark-text tracking-tight">NexoPOS</h1>
        <p className="text-xs font-semibold text-dark-muted tracking-[0.2em] uppercase mt-1">
          {t.auth.login}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">
        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
            <svg className="w-4 h-4 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-error font-medium">{t.auth.invalidCredentials}</p>
              <p className="text-xs text-error/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-dark-muted uppercase tracking-widest">
            {t.auth.email}
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (error) dispatch(clearError()); }}
              placeholder="name@company.com"
              className={`w-full px-4 py-3 pr-11 text-sm bg-dark-surface-2 border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                error ? 'border-error focus:border-error' : 'border-dark-border focus:border-primary'
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-dark-muted uppercase tracking-widest">
            {t.auth.password}
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); if (error) dispatch(clearError()); }}
              placeholder="••••••••"
              className={`w-full px-4 py-3 pr-11 text-sm bg-dark-surface-2 border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                error ? 'border-error focus:border-error' : 'border-dark-border focus:border-primary'
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Remember + Reset */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-dark-border bg-dark-surface-2 text-primary focus:ring-primary/20 accent-primary"
            />
            <span className="text-sm text-dark-muted">{t.auth.rememberMe}</span>
          </label>
          <button type="button" className="text-sm text-primary hover:text-primary-dark transition-colors">
            {t.auth.forgotPassword}
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !email.trim() || !password.trim()}
          className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.common.loading}
            </>
          ) : (
            <>
              {t.auth.loginButton}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Security footer */}
      <div className="px-8 pb-8 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-dark-border" />
          <span className="text-xs text-dark-muted">{t.settings.securedConnection}</span>
          <div className="flex-1 h-px bg-dark-border" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <svg className="w-3.5 h-3.5 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-xs text-dark-muted">
            {t.settings.encrypted} · {t.settings.securityStandards}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 bg-dark-surface-2 border border-dark-border rounded text-xs font-mono text-dark-muted">
            AES-256
          </span>
          <span className="px-2 py-0.5 bg-dark-surface-2 border border-dark-border rounded text-xs font-mono text-dark-muted">
            PCI DSS
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
