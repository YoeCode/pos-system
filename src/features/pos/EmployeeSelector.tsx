import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectActiveEmployees } from '../employees/employeesSlice';
import { setCurrentEmployee, selectIsCashBoxOpen, selectWorkingEmployees, removeCashBoxEmployee } from '../pos/posSlice';

const EmployeeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectActiveEmployees);
  const currentEmployeeId = useAppSelector(state => state.pos.currentEmployeeId);
  const multiTerminalMode = useAppSelector(state => state.settings.pos.multiTerminalMode);
  const loggedInUser = useAppSelector(state => state.auth.user);
  const isCashBoxOpen = useAppSelector(selectIsCashBoxOpen);
  const workingEmployeeIds = useAppSelector(selectWorkingEmployees);

  const displayedEmployees = isCashBoxOpen
    ? employees.filter(e => workingEmployeeIds.includes(e.id) || (loggedInUser && e.email.toLowerCase() === loggedInUser.email.toLowerCase()))
    : employees;

  useEffect(() => {
    if (!multiTerminalMode && loggedInUser && !currentEmployeeId) {
      const matchingEmployee = employees.find(e => e.email.toLowerCase() === loggedInUser.email.toLowerCase());
      if (matchingEmployee) {
        dispatch(setCurrentEmployee(matchingEmployee.id));
      }
    }
  }, [loggedInUser, currentEmployeeId, multiTerminalMode, employees, dispatch]);

  useEffect(() => {
    if (isCashBoxOpen && loggedInUser && !currentEmployeeId) {
      const loggedInEmployee = employees.find(e => e.email.toLowerCase() === loggedInUser.email.toLowerCase());
      if (loggedInEmployee && workingEmployeeIds.includes(loggedInEmployee.id)) {
        dispatch(setCurrentEmployee(loggedInEmployee.id));
      }
    }
  }, [isCashBoxOpen, loggedInUser, currentEmployeeId, employees, workingEmployeeIds, dispatch]);

  if (multiTerminalMode) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10 text-sm text-text-muted">
        <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        Modo multi-caja activo
      </div>
    );
  }

  if (displayedEmployees.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {displayedEmployees.map(emp => {
        const isActive = currentEmployeeId === emp.id;
        const isLoggedIn = loggedInUser && emp.email.toLowerCase() === loggedInUser.email.toLowerCase();
        const canRemove = isCashBoxOpen && workingEmployeeIds.includes(emp.id) && !isLoggedIn;

        return (
          <div
            key={emp.id}
            className={`
              flex-shrink-0 flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg text-sm
              transition-all duration-150 border shadow-sm min-w-0
              ${isActive
                ? 'bg-primary border-primary text-white shadow-primary/20'
                : 'bg-white border-border text-text-primary hover:border-primary/40 hover:shadow-md'
              }
            `}
          >
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
              ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}
            `}>
              {emp.name.charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={() => dispatch(setCurrentEmployee(isActive ? null : emp.id))}
              className="flex flex-col items-start leading-none min-w-0 text-left"
            >
              <span className="font-semibold truncate">{emp.name}</span>
              <span className={`text-xs capitalize ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                {emp.role}
              </span>
            </button>

            {canRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(removeCashBoxEmployee(emp.id));
                }}
                className={`
                  w-11 h-11 flex items-center justify-center rounded-full flex-shrink-0
                  transition-colors
                  ${isActive
                    ? 'hover:bg-white/20 text-white/60 hover:text-white'
                    : 'hover:bg-error/10 text-text-muted hover:text-error'
                  }
                `}
                title={`Eliminar a ${emp.name} de la caja`}
                aria-label={`Eliminar a ${emp.name} de la caja`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeSelector;
