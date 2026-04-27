import React from 'react';
import type { Employee } from '../../types';
import Badge from '../../components/ui/Badge';
import { useAppDispatch } from '../../app/store';
import { setEditingEmployee, toggleModal, updateEmployee } from './employeesSlice';
import { useI18n } from '../../i18n/I18nProvider';

interface EmployeeCardProps {
  employee: Employee;
}

const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500',
  'bg-teal-500', 'bg-indigo-500', 'bg-orange-500', 'bg-cyan-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length] ?? 'bg-blue-500';
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
}

const roleBadgeVariant = (role: Employee['role']): 'info' | 'warning' | 'success' => {
  switch (role) {
    case 'Cashier': return 'info';
    case 'Supervisor': return 'warning';
    case 'Admin': return 'success';
  }
};

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  const dispatch = useAppDispatch();
  const t = useI18n();

  const handleEdit = () => {
    dispatch(setEditingEmployee(employee));
    dispatch(toggleModal());
  };

  const handleToggleActive = () => {
    dispatch(updateEmployee({ ...employee, active: !employee.active }));
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-150">
      {/* Avatar + status */}
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white font-bold text-sm`}>
          {getInitials(employee.name)}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${employee.active ? 'bg-primary' : 'bg-error'}`} />
          <span className="text-xs text-text-muted">{employee.active ? t.common.active : t.common.inactive}</span>
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="font-bold text-text-primary text-sm">{employee.name}</p>
        <p className="text-xs text-text-muted mt-0.5">{employee.shift}</p>
      </div>

      {/* Role badge */}
      <Badge variant={roleBadgeVariant(employee.role)}>{employee.role}</Badge>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {t.common.edit}
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={handleToggleActive}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            employee.active
              ? 'text-text-muted hover:text-error hover:bg-error/5'
              : 'text-text-muted hover:text-primary hover:bg-primary/5'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          {employee.active ? t.common.inactive : t.common.active}
        </button>
      </div>
    </div>
  );
};

export default EmployeeCard;
