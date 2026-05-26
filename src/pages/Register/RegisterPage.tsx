import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError || !authData.user) {
        setError(authError?.message || 'Error al crear cuenta');
        setIsLoading(false);
        return;
      }

      // 2. Create tenant
      const slug = form.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: form.businessName,
          slug,
          owner_id: authData.user.id,
          plan: 'free',
          subscription_status: 'active',
          max_employees: 2,
          max_products: 100,
          max_sales_monthly: 500,
        })
        .select()
        .single();

      if (tenantError || !tenantData) {
        setError('Error al crear negocio');
        setIsLoading(false);
        return;
      }

      // 3. Create tenant_members entry
      await supabase.from('tenant_members').insert({
        tenant_id: tenantData.id,
        user_id: authData.user.id,
        role: 'owner',
      });

      // 4. Create employee record
      await supabase.from('employees').insert({
        user_id: authData.user.id,
        name: form.businessName,
        email: form.email,
        role: 'admin',
        active: true,
      });

      navigate('/login');
    } catch {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg">
            CL
          </div>
          <span className="font-semibold text-xl text-white">Casa Lis POS</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-1">Crear cuenta</h2>
          <p className="text-slate-400 text-sm mb-6">Comienza gratis, escala cuando crezcas</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del negocio</label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                placeholder="Ej: Boutique María"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                placeholder="Repite la contraseña"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded-lg text-white font-medium transition-colors"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
