import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { toggleModal, setSearchQuery, setRoleFilter, setStatusFilter, clearFilters, selectFilteredEmployees, setDetailEmployee } from '../../features/employees/employeesSlice';
import EmployeeCard from '../../features/employees/EmployeeCard';
import EmployeeModal from '../../features/employees/EmployeeModal';
import EmployeeDetailModal from '../../features/employees/EmployeeDetailModal';
import Button from '../../components/ui/Button';
import { usePermission } from '../../hooks/usePermission';
import { useI18n } from '../../i18n/I18nProvider';
import type { Employee } from '../../types';

const EmployeesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(state => state.employees.employees);
  const filteredEmployees = useAppSelector(selectFilteredEmployees);
  const searchQuery = useAppSelector(state => state.employees.searchQuery);
  const roleFilter = useAppSelector(state => state.employees.roleFilter);
  const statusFilter = useAppSelector(state => state.employees.statusFilter);
  const { hasPermission } = usePermission();
  const t = useI18n();

  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.active).length;
  const detailEmployee = useAppSelector(state => state.employees.detailEmployee);
  const filteredCount = filteredEmployees.length;
  const filteredActiveCount = filteredEmployees.filter(e => e.active).length;

  const hasFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t.nav.employees}</h1>
          <p className="text-sm text-text-muted mt-0.5">{t.nav.employees}</p>
        </div>
        {hasPermission('employee:manage') && (
          <Button variant="primary" size="sm" onClick={() => dispatch(toggleModal())}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.employees.addEmployee}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.employees.title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-text-primary font-mono">
            {hasFilters ? `${filteredCount} / ${totalCount}` : totalCount}
          </p>
          {hasFilters && <p className="text-xs text-text-muted mt-1">{t.common.filtered}</p>}
        </div>
        <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.common.active}</p>
          <p className="text-2xl lg:text-3xl font-bold text-primary font-mono">
            {hasFilters ? `${filteredActiveCount} / ${activeCount}` : activeCount}
          </p>
          {hasFilters && <p className="text-xs text-text-muted mt-1">{t.common.filtered}</p>}
        </div>
        <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.employees.inactive}</p>
          <p className="text-2xl lg:text-3xl font-bold text-error font-mono">
            {hasFilters ? `${filteredCount - filteredActiveCount} / ${totalCount - activeCount}` : totalCount - activeCount}
          </p>
          {hasFilters && <p className="text-xs text-text-muted mt-1">{t.common.filtered}</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => dispatch(setSearchQuery(e.target.value))}
            placeholder={`${t.employees.name} / ${t.employees.email}...`}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => dispatch(setRoleFilter(e.target.value as Employee['role'] | 'all'))}
          className="px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
        >
          <option value="all">{t.common.all} {t.employees.roles}</option>
          <option value="Cashier">Cashier</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => dispatch(setStatusFilter(e.target.value as 'all' | 'active' | 'inactive'))}
          className="px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
        >
          <option value="all">{t.common.all} {t.common.status}</option>
          <option value="active">{t.common.active}</option>
          <option value="inactive">{t.common.inactive}</option>
        </select>
        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={() => dispatch(clearFilters())}>
            {t.common.clear}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {filteredEmployees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} onViewDetail={() => dispatch(setDetailEmployee(employee))} />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm font-medium">{t.common.noResults}</p>
          {hasFilters && (
            <button onClick={() => dispatch(clearFilters())} className="mt-2 text-sm text-primary hover:underline">
              {t.common.clearFilters}
            </button>
          )}
        </div>
      )}

      <EmployeeModal />
      <EmployeeDetailModal employee={detailEmployee} onClose={() => dispatch(setDetailEmployee(null))} />
    </div>
  );
};

export default EmployeesPage;
