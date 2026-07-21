import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../app/store';
import type { Employee } from '../../types';
import Modal from '../../components/ui/Modal';
import { useI18n } from '../../i18n/I18nProvider';
import { fetchEmployeeSales, fetchEmployeeSalesStats } from './employeesService';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
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

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose }) => {
  const t = useI18n();
  const currentUser = useAppSelector(state => state.auth.user);
  const [sales, setSales] = useState<{ orderNumber: string; total: number; completedAt: string }[]>([]);
  const [stats, setStats] = useState<{ totalSales: number; totalOrders: number; averageTicket: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee || !currentUser?.tenantId) return;
    setLoading(true);
    Promise.all([
      fetchEmployeeSales(employee.id, currentUser.tenantId),
      fetchEmployeeSalesStats(employee.id, currentUser.tenantId),
    ])
      .then(([salesData, statsData]) => {
        setSales(salesData);
        setStats(statsData);
      })
      .catch(() => {
        setSales([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [employee, currentUser?.tenantId]);

  if (!employee) return null;

  return (
    <Modal isOpen={!!employee} onClose={onClose} title={employee.name} subtitle={employee.email}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white font-bold text-xl`}>
            {getInitials(employee.name)}
          </div>
          <div>
            <p className="font-bold text-text-primary">{employee.name}</p>
            <p className="text-sm text-text-muted">{employee.role} · {employee.shift}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block w-2 h-2 rounded-full ${employee.active ? 'bg-primary' : 'bg-error'}`} />
              <span className="text-xs text-text-muted">{employee.active ? t.common.active : t.common.inactive}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider">{t.reports.totalSales}</p>
            <p className="text-lg font-bold text-text-primary font-mono">
              {stats ? `€${stats.totalSales.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="bg-background rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider">{t.reports.totalOrders}</p>
            <p className="text-lg font-bold text-primary font-mono">
              {stats ? stats.totalOrders : '—'}
            </p>
          </div>
          <div className="bg-background rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider">{t.dashboard.averageTicket}</p>
            <p className="text-lg font-bold text-secondary font-mono">
              {stats ? `€${stats.averageTicket.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">{t.reports.recentSales}</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <p className="text-sm text-text-muted">{t.reports.noData}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sales.map(sale => (
                <div key={sale.orderNumber} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{sale.orderNumber}</p>
                    <p className="text-xs text-text-muted">{new Date(sale.completedAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold text-text-primary font-mono">€{sale.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">{t.employees.phone}</p>
            <p className="text-text-primary">{employee.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">{t.employees.pin}</p>
            <p className="text-text-primary font-mono">{employee.pin ? '****' : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">{t.employees.startDate}</p>
            <p className="text-text-primary">{employee.startDate ? new Date(employee.startDate).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeDetailModal;