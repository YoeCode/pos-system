import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addEmployee, toggleModal, setEditingEmployee, updateEmployee } from './employeesSlice';
import type { Employee } from '../../types';
import Modal from '../../components/ui/Modal';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';

const ROLES: Employee['role'][] = ['Cashier', 'Supervisor', 'Admin'];
const SHIFTS = [
  'Morning 06:00-14:00',
  'Evening 14:00-22:00',
  'Night 22:00-06:00',
  'Full Day 08:00-18:00',
];

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  pin: '',
  role: 'Cashier' as Employee['role'],
  shift: 'Morning 06:00-14:00',
  active: true,
  permissions: {
    processSales: true,
    applyDiscounts: false,
    manageInventory: false,
    accessReports: false,
  },
};

const EmployeeModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(state => state.employees.isModalOpen);
  const editingEmployee = useAppSelector(state => state.employees.editingEmployee);
  const [form, setForm] = useState(defaultForm);
  const t = useI18n();

  const isEditing = editingEmployee !== null;

  useEffect(() => {
    if (isOpen) {
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
        setForm(defaultForm);
      }
    }
  }, [isOpen, editingEmployee]);

  const handleClose = () => {
    dispatch(toggleModal());
    dispatch(setEditingEmployee(null));
    setForm(defaultForm);
  };

  const handlePermChange = (key: keyof typeof defaultForm.permissions, value: boolean) => {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editingEmployee) {
      dispatch(updateEmployee({ ...form, id: editingEmployee.id, startDate: editingEmployee.startDate }));
    } else {
      const employee: Employee = {
        ...form,
        id: Date.now().toString(),
        startDate: new Date().toISOString().split('T')[0],
      };
      dispatch(addEmployee(employee));
    }
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? t.common.edit : t.employees.addEmployee}
      subtitle={isEditing ? t.common.edit : t.employees.addEmployee}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Identity & Contact */}
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
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
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

        {/* Operational Settings */}
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
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="p-4 rounded-xl border border-border bg-background">
          <Toggle
            checked={form.active}
            onChange={val => setForm(prev => ({ ...prev, active: val }))}
            label={t.employees.active}
            description={t.employees.active}
          />
        </div>

        {/* Permissions */}
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;
