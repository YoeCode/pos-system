import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateEmployeeAsync, toggleModal, setEditingEmployee } from '../../features/employees/employeesSlice';
import { createInvitation } from '../invitations/invitationsService';
import { sendInvitationEmail, isEmailConfigured } from '../../utils/invitationEmail';
import { selectShifts } from '../../features/settings/settingsSlice';
import type { Employee } from '../../types';
import type { TenantRole } from '../../types';
import Modal from '../../components/ui/Modal';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';

const ROLES: Employee['role'][] = ['Cashier', 'Supervisor', 'Admin'];

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  pin: '',
  role: 'Cashier' as Employee['role'],
  shift: '',
  active: true,
  permissions: {
    processSales: true,
    applyDiscounts: false,
    manageInventory: false,
    accessReports: false,
  },
};

const ROLE_TO_TENANT_ROLE: Record<Employee['role'], TenantRole> = {
  Cashier: 'cashier',
  Supervisor: 'supervisor',
  Admin: 'admin',
};

const EmployeeModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(state => state.employees.isModalOpen);
  const editingEmployee = useAppSelector(state => state.employees.editingEmployee);
  const currentUser = useAppSelector(state => state.auth.user);
  const [form, setForm] = useState(defaultForm);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const t = useI18n();

  const isEditing = editingEmployee !== null;
  const pinWasChanged = isEditing && editingEmployee && form.pin !== editingEmployee.pin;
  const shifts = useAppSelector(selectShifts);
  const defaultShift = shifts[0] || '';

  useEffect(() => {
    if (isOpen) {
      setInviteError(null);
      setInviteSuccess(null);
      setInviteLoading(false);

      if (editingEmployee) {
        setForm({
          name: editingEmployee.name,
          email: editingEmployee.email,
          phone: editingEmployee.phone,
          pin: editingEmployee.pin,
          role: editingEmployee.role,
          shift: editingEmployee.shift,
          active: editingEmployee.active,
          permissions: { ...editingEmployee.permissions },
        });
      } else {
        setForm({ ...defaultForm, shift: defaultShift });
      }
    }
  }, [isOpen, editingEmployee]);

  const handleClose = () => {
    dispatch(toggleModal());
    dispatch(setEditingEmployee(null));
    setForm(defaultForm);
    setInviteSuccess(null);
    setInviteError(null);
    setShowPinConfirm(false);
  };

  const handlePermChange = (key: keyof typeof defaultForm.permissions, value: boolean) => {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && editingEmployee) {
      if (pinWasChanged && !showPinConfirm) {
        setShowPinConfirm(true);
        return;
      }
      dispatch(updateEmployeeAsync({ ...form, id: editingEmployee.id, startDate: editingEmployee.startDate }));
      handleClose();
      return;
    }

    if (!currentUser?.tenantId) {
      setInviteError('No tienes un tenant asignado');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);

    try {
      const result = await createInvitation({
        email: form.email,
        role: ROLE_TO_TENANT_ROLE[form.role],
        tenantId: currentUser.tenantId,
        invitedBy: currentUser.authUserId || currentUser.id,
      });

      if (result) {
        const inviteLink = `${window.location.origin}/accept-invite?token=${result.token}`;

        if (isEmailConfigured()) {
          try {
            await sendInvitationEmail({
              to_email: form.email,
              to_name: form.email.split('@')[0],
              tenant_name: currentUser.name || 'Tu empresa',
              invited_by: currentUser.name || '',
              invite_link: inviteLink,
              role_label: ROLE_TO_TENANT_ROLE[form.role],
            });
            setInviteSuccess(`Invitación enviada a ${form.email}`);
          } catch {
            setInviteSuccess(`Invitación creada. No se pudo enviar el email, copia el enlace: ${inviteLink}`);
          }
        } else {
          setInviteSuccess(`Invitación creada. Email no configurado. Enlace: ${inviteLink}`);
        }
      } else {
        setInviteError('Error al enviar la invitación. Es posible que el email ya esté invitado.');
      }
    } catch {
      setInviteError('Error al enviar la invitación. Intenta de nuevo.');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={inviteSuccess ? 'Invitación enviada' : isEditing ? t.common.edit : t.employees.addEmployee}
      subtitle={isEditing ? t.common.edit : t.employees.addEmployee}
    >
      {inviteSuccess ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-text-primary text-center text-lg font-medium">{inviteSuccess}</p>
          <p className="text-text-muted text-center text-sm">
            El usuario recibirá un email con instrucciones para crear su cuenta y unirse al equipo.
          </p>
          <Button variant="primary" onClick={handleClose} className="mt-4">
            Cerrar
          </Button>
        </div>
      ) : !isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              {t.employees.email} & {t.employees.role}
            </p>
            <p className="text-sm text-text-muted mb-4">
              Se enviará una invitación para que el usuario cree su cuenta.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.email}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.role}</label>
                <select
                  value={form.role}
                  onChange={e => setForm(prev => ({ ...prev, role: e.target.value as Employee['role'] }))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {inviteError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {inviteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={inviteLoading}>
              {inviteLoading ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              {t.employees.name} & {t.employees.email}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.name}</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.email}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  disabled={!!editingEmployee?.userId}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                  className={`w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${editingEmployee?.userId ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                />
                <p className="text-xs text-text-muted">Email asociado a la cuenta de inicio de sesión. No editable.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.phone}</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 555 0000"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.pin}</label>
                <input
                  type="password"
                  maxLength={6}
                  value={form.pin}
                  onChange={e => setForm(prev => ({ ...prev, pin: e.target.value }))}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              {t.employees.role}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.role}</label>
                <select
                  value={form.role}
                  onChange={e => setForm(prev => ({ ...prev, role: e.target.value as Employee['role'] }))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.employees.shift}</label>
                <select
                  value={form.shift}
                  onChange={e => setForm(prev => ({ ...prev, shift: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                >
                  {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background">
            <Toggle
              checked={form.active}
              onChange={val => setForm(prev => ({ ...prev, active: val }))}
              label={t.employees.active}
              description={t.employees.active}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              {t.employees.permissions}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'processSales', label: t.employees.processSales },
                  { key: 'applyDiscounts', label: t.employees.applyDiscounts },
                  { key: 'manageInventory', label: t.employees.manageInventory },
                  { key: 'accessReports', label: t.employees.accessReports },
                ] as const
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.permissions[key]}
                    onChange={e => handlePermChange(key, e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-text-primary">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {showPinConfirm && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-text-primary">Cambio de PIN detectado</p>
                  <p className="text-xs text-text-muted mt-1">
                    Estás modificando el PIN de <span className="font-medium text-text-primary">{editingEmployee?.name}</span>. Este PIN se usa para autorizar acciones en el punto de venta (devoluciones, descuentos, cierre de caja). El empleado necesitará conocer el nuevo PIN para seguir operando.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {showPinConfirm ? 'Confirmar cambio' : isEditing ? t.common.save : t.common.add}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EmployeeModal;
