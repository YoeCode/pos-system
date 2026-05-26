import { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { getTenantMembers } from '../../features/tenants/tenantsService';
import type { TenantMemberInfo } from '../../features/tenants/tenantsService';
import InviteMemberModal from '../../features/tenants/InviteMemberModal';
import BillingSection from '../../features/tenants/BillingSection';
import type { TenantRole } from '../../types';

export default function TenantSettings() {
  const tenantId = useAppSelector(state => state.auth.user?.tenantId);
  const [members, setMembers] = useState<TenantMemberInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadMembers = async () => {
    if (!tenantId) return;
    const data = await getTenantMembers(tenantId);
    setMembers(data);
  };

  const handleInvite = async (_email: string, _role: TenantRole) => {
    if (!tenantId) return;

    setIsLoading(true);
    setIsLoading(false);
    setIsModalOpen(false);
    loadMembers();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Configuración del Negocio</h2>

      <BillingSection tenantId={tenantId} />

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Miembros del equipo</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Invitar miembro
          </button>
        </div>

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

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvite={handleInvite}
        isLoading={isLoading}
      />
    </div>
  );
}
