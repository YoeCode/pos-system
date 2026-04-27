import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { toggleModal } from '../../features/employees/employeesSlice';
import EmployeeCard from '../../features/employees/EmployeeCard';
import EmployeeModal from '../../features/employees/EmployeeModal';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';

const EmployeesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(state => state.employees.employees);
  const t = useI18n();

  const activeCount = employees.filter(e => e.active).length;
  const newThisMonth = employees.filter(e => {
    const date = new Date(e.startDate);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t.nav.employees}</h1>
          <p className="text-sm text-text-muted mt-0.5">{t.nav.employees}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => dispatch(toggleModal())}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.employees.addEmployee}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.employees.title}</p>
          <p className="text-3xl font-bold text-text-primary font-mono">{employees.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.common.active}</p>
          <p className="text-3xl font-bold text-primary font-mono">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.employees.startDate}</p>
          <p className="text-3xl font-bold text-secondary font-mono">{newThisMonth}</p>
        </div>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {employees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>

      {/* Modal */}
      <EmployeeModal />
    </div>
  );
};

export default EmployeesPage;
