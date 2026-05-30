import { useState, useEffect } from 'react';
import { useAppSelector } from '../../app/store';
import { getTenantMembers, getTenantInfo } from '../../features/tenants/tenantsService';
import type { TenantMemberInfo, TenantInfo } from '../../features/tenants/tenantsService';
import { createInvitation, getInvitationsByTenant, cancelInvitation } from '../../features/invitations/invitationsService';
import type { Invitation } from '../../features/invitations/invitationsService';
import InviteMemberModal from '../../features/tenants/InviteMemberModal';
import BillingSection from '../../features/tenants/BillingSection';
import { sendInvitationEmail, isEmailConfigured } from '../../utils/invitationEmail';
import type { TenantRole } from '../../types';

export default function TenantSettings() {
  const user = useAppSelector(state => state.auth.user);
  const tenantId = user?.tenantId;
  const authUserId = user?.authUserId;
  const userName = user?.name || '';
  const [members, setMembers] = useState<TenantMemberInfo[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    if (!tenantId) return;
    const [memberData, inviteData, tenantData] = await Promise.all([
      getTenantMembers(tenantId),
      getInvitationsByTenant(tenantId),
      getTenantInfo(tenantId),
    ]);
    setMembers(memberData);
    setInvitations(inviteData);
    setTenantInfo(tenantData);
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const handleInvite = async (email: string, role: TenantRole) => {
    if (!tenantId || !authUserId) return;

    const cleanEmail = email.toLowerCase().trim();

    const alreadyMember = members.some(m => m.email.toLowerCase() === cleanEmail);
    if (alreadyMember) {
      setActionError('Este usuario ya es miembro del equipo.');
      return;
    }

    const alreadyPending = invitations.some(
      i => i.email.toLowerCase() === cleanEmail && i.status === 'pending' && !isExpired(i.expiresAt)
    );
    if (alreadyPending) {
      setActionError('Ya existe una invitación pendiente para este email.');
      return;
    }

    setIsLoading(true);
    setActionError(null);

    try {
      const invitation = await createInvitation({ email: cleanEmail, role, tenantId, invitedBy: authUserId });
      if (!invitation) {
        setActionError('No se pudo crear la invitación. Intenta de nuevo.');
        setIsLoading(false);
        return;
      }

      const inviteLink = `${window.location.origin}/accept-invite?token=${invitation.token}`;

      if (isEmailConfigured()) {
        try {
          await sendInvitationEmail({
            to_email: email,
            to_name: email.split('@')[0],
            tenant_name: tenantInfo?.name || 'Tu empresa',
            invited_by: userName,
            invite_link: inviteLink,
            role_label: role,
          });
        } catch (emailErr) {
          setActionError('Invitación creada, pero no se pudo enviar el email. Copia el enlace manualmente.');
        }
      }

      setIsModalOpen(false);
      loadData();
    } catch {
      setActionError('Error al enviar la invitación. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!tenantId) return;
    const ok = await cancelInvitation(invitationId, tenantId);
    if (ok) loadData();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">Configuración del Negocio</h2>

      {actionError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
          {actionError}
        </div>
      )}

      {tenantId && <BillingSection tenantId={tenantId} />}

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

          {invitations.filter(inv => inv.status !== 'accepted').map((inv) => {
            const expired = isExpired(inv.expiresAt);
            const pending = inv.status === 'pending';

            return (
              <div key={inv.id} className={`flex items-center justify-between p-3 rounded-lg border ${pending ? 'bg-slate-700/30 border-dashed border-slate-600' : 'bg-slate-800/50 border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-600/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium">{inv.email}</p>
                    <p className="text-xs text-slate-500">
                      {expired
                        ? `Invitación expirada · ${formatDate(inv.expiresAt)}`
                        : `Invitación pendiente · expira ${formatDate(inv.expiresAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm capitalize bg-slate-600/50 text-slate-400">
                    {inv.role}
                  </span>
                  {pending && (
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Cancelar invitación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && invitations.filter(i => i.status !== 'accepted').length === 0 && (
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
