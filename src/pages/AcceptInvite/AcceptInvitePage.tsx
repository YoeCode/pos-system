import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { getInvitationByToken } from '../../features/invitations/invitationsService';
import type { Invitation } from '../../features/invitations/invitationsService';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación inválido');
      setIsLoading(false);
      return;
    }

    getInvitationByToken(token).then((inv) => {
      if (!inv) {
        setError('La invitación ha expirado o no es válida');
      } else {
        setInvitation(inv);
      }
      setIsLoading(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: existingLinked, error: linkError } = await supabase.rpc(
        'complete_invitation_acceptance',
        { p_invitation_id: invitation.id, p_tenant_role: invitation.role, p_user_id: null }
      );

      if (linkError) {
        setError('Error al procesar la invitación. Intenta de nuevo.');
        setIsSubmitting(false);
        return;
      }

      if (existingLinked) {
        setSuccessMessage(
          'Ya tienes una cuenta. Ahora perteneces al equipo. Inicia sesión con tu contraseña habitual.'
        );
        setIsSubmitting(false);
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            name: name.trim(),
            tenant_id: invitation.tenantId,
          },
        },
      });

      if (signUpError || !signUpData?.user?.id) {
        setError(signUpError?.message || 'Error al crear la cuenta. Intenta de nuevo.');
        setIsSubmitting(false);
        return;
      }

      const { data: rpcOk, error: rpcError } = await supabase.rpc(
        'complete_invitation_acceptance',
        { p_invitation_id: invitation.id, p_tenant_role: invitation.role, p_user_id: signUpData.user.id }
      );

      if (rpcError || !rpcOk) {
        setError('Error al completar el registro. La invitación puede haber expirado o ya fue usada.');
        setIsSubmitting(false);
        return;
      }

      if (signUpData.session) {
        setHasSession(true);
        setSuccessMessage('Cuenta creada correctamente. Redirigiendo...');
        setTimeout(() => navigate('/pos'), 1500);
      } else {
        setHasSession(false);
        setSuccessMessage(
          'Cuenta creada. Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.'
        );
      }
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invitación inválida</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">¡Listo!</h2>
          <p className="text-slate-400">{successMessage}</p>
          {!hasSession && (
            <button
              onClick={() => navigate('/login')}
              className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
            >
              Ir al login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-2h-2v2zm0 3h2v-2h-2v2zm-2-3h2v-2h-2v2zm3-5h2v-2h-2v2zm2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-3 0h2v-2h-2v2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Únete al equipo</h1>
          <p className="text-slate-400 mt-1">
            Has sido invitado como <span className="text-emerald-400 font-medium capitalize">{invitation?.role}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={invitation?.email || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors mt-2"
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
