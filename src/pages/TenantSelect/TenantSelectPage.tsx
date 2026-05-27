import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setActiveTenant } from '../../features/auth/authSlice';
import { getUserTenants } from '../../features/auth/authService';
import type { TenantMembership } from '../../features/auth/authService';

export default function TenantSelectPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadTenants() {
      if (!user) return;
      const userTenants = await getUserTenants(user.id);
      setTenants(userTenants);
      setIsLoading(false);

      if (userTenants.length === 1) {
        dispatch(setActiveTenant(userTenants[0].tenantId));
        navigate('/dashboard');
      }
    }

    loadTenants();
  }, [user, navigate, dispatch]);

  const handleSelect = (tenantId: string) => {
    dispatch(setActiveTenant(tenantId));
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No tienes negocios registrados</h2>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
          >
            Crear mi primer negocio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Selecciona tu negocio</h1>
          <p className="text-slate-400">Elige el negocio que quieres gestionar</p>
        </div>

        <div className="space-y-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.tenantId}
              onClick={() => handleSelect(tenant.tenantId)}
              className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-lg">{tenant.tenantName}</h3>
                  <p className="text-slate-400 text-sm capitalize">{tenant.role}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-400 font-bold">{tenant.tenantName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            + Crear nuevo negocio
          </button>
        </div>
      </div>
    </div>
  );
}
