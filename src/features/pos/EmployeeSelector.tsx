import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectActiveEmployees } from '../employees/employeesSlice';
import { setCurrentEmployee, selectIsCashBoxOpen, selectWorkingEmployees } from '../pos/posSlice';

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
      if (loggedInEmployee) {
        dispatch(setCurrentEmployee(loggedInEmployee.id));
      }
    }
  }, [isCashBoxOpen, loggedInUser, currentEmployeeId, employees, dispatch]);

  if (multiTerminalMode) {
    return null;
  }

  if (displayedEmployees.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {displayedEmployees.map(emp => (
        <button
          key={emp.id}
          onClick={() => dispatch(setCurrentEmployee(currentEmployeeId === emp.id ? null : emp.id))}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
            currentEmployeeId === emp.id
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white border border-border text-text-muted hover:border-green-600 hover:text-green-600'
          }`}
        >
          {emp.name}
        </button>
      ))}
    </div>
  );
};

export default EmployeeSelector;