import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '../../../app/store';
import { getTenantMembers, getTenantInfo } from '../../tenants/tenantsService';
import type { TenantMemberInfo, TenantInfo } from '../../tenants/tenantsService';
import { createInvitation, getInvitationsByTenant, cancelInvitation } from '../../invitations/invitationsService';
import type { Invitation } from '../../invitations/invitationsService';
import InviteMemberModal from '../../tenants/InviteMemberModal';
import BillingSection from '../../tenants/BillingSection';
import { sendInvitationEmail, isEmailConfigured } from '../../../utils/invitationEmail';
import type { TenantRole } from '../../../types';

const TeamSettingsSection: React.FC = () => {
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

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const [memberData, inviteData, tenantData] = await Promise.all([
      getTenantMembers(tenantId),
      getInvitationsByTenant(tenantId),
      getTenantInfo(tenantId),
    ]);
    setMembers(memberData);
    setInvitations(inviteData);
    setTenantInfo(tenantData);
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        } catch {
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
    <div className="space-y-6">
      {tenantId && <BillingSection tenantId={tenantId} />}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Miembros del equipo</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm font-medium transition-colors"
          >
            Invitar miembro
          </button>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-text-primary font-medium">{member.name}</p>
                  <p className="text-text-muted text-sm">{member.email}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-text-muted capitalize">
                {member.role}
              </span>
            </div>
          ))}

          {invitations.filter(inv => inv.status !== 'accepted').map((inv) => {
            const expired = isExpired(inv.expiresAt);
            const pending = inv.status === 'pending';

            return (
              <div key={inv.id} className={`flex items-center justify-between p-3 rounded-lg border ${pending ? 'bg-gray-50/50 border-dashed border-border' : 'bg-gray-50 border-border'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{inv.email}</p>
                    <p className="text-xs text-text-muted">
                      {expired
                        ? `Invitación expirada · ${formatDate(inv.expiresAt)}`
                        : `Invitación pendiente · expira ${formatDate(inv.expiresAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm capitalize bg-gray-50 text-text-muted">
                    {inv.role}
                  </span>
                  {pending && (
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-text-muted hover:text-error transition-colors"
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
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary">No hay miembros registrados</p>
              <p className="text-xs text-text-muted">Invita a tu equipo para colaborar en el negocio</p>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          {actionError}
        </div>
      )}

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvite={handleInvite}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TeamSettingsSection;