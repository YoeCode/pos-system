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
    return null;
  }

  if (displayedEmployees.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {displayedEmployees.map(emp => (
        <div
          key={emp.id}
          className={`flex-shrink-0 flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
            currentEmployeeId === emp.id
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white border border-border text-text-muted hover:border-green-600 hover:text-green-600'
          }`}
        >
          <button
            type="button"
            onClick={() => dispatch(setCurrentEmployee(currentEmployeeId === emp.id ? null : emp.id))}
            className="leading-none"
          >
            {emp.name}
          </button>
          {isCashBoxOpen && workingEmployeeIds.includes(emp.id) && !(loggedInUser && emp.email.toLowerCase() === loggedInUser.email.toLowerCase()) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeCashBoxEmployee(emp.id));
              }}
              className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full text-xs transition-colors ${
                currentEmployeeId === emp.id
                  ? 'hover:bg-green-500 text-green-100'
                  : 'hover:bg-gray-100 text-text-muted'
              }`}
              title="Eliminar de la caja"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmployeeSelector;