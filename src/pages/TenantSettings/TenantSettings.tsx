import { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { getTenantMembers, inviteTenantMember } from '../../features/tenants/tenantsService';
import type { TenantMemberInfo } from '../../features/tenants/tenantsService';

export default function TenantSettings() {
  const tenantId = useAppSelector(state => state.auth.user?.tenantId);
  const [members, setMembers] = useState<TenantMemberInfo[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'cashier' | 'manager' | 'supervisor'>('cashier');
  const [isLoading, setIsLoading] = useState(false);

  const loadMembers = async () => {
    if (!tenantId) return;
    const data = await getTenantMembers(tenantId);
    setMembers(data);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !email) return;

    setIsLoading(true);
    setIsLoading(false);
    setEmail('');
    loadMembers();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Configuración del Negocio</h2>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Miembros del equipo</h3>

        <form onSubmit={handleInvite} className="flex gap-3 mb-6">
          <input
            type="email"
            placeholder="Email del empleado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'cashier' | 'manager' | 'supervisor')}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="cashier">Cajero</option>
            <option value="supervisor">Supervisor</option>
            <option value="manager">Gerente</option>
          </select>
          <button
            type="submit"
            disabled={isLoading || !email}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
          >
            Invitar
          </button>
        </form>

        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-slate-400 text-sm">{member.email}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-600 rounded-full text-sm text-slate-300 capitalize">
                {member.role}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-slate-400 text-center py-4">No hay miembros registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}
