import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectActiveEmployees } from '../employees/employeesSlice';
import { openCashBox } from './posSlice';

interface CashBoxOpenModalProps {
  isOpen: boolean;
  closedBoxCount?: number;
  onClose?: () => void;
}

const CashBoxOpenModal: React.FC<CashBoxOpenModalProps> = ({ isOpen, closedBoxCount = 0, onClose }) => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectActiveEmployees);
  const loggedInUser = useAppSelector(state => state.auth.user);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevClosedCount = useRef(closedBoxCount);

  useEffect(() => {
    if (prevClosedCount.current !== closedBoxCount) {
      prevClosedCount.current = closedBoxCount;
      setSelectedIds([]);
    }
  }, [closedBoxCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );
  };

  const handleOpenCashBox = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const loggedInEmployee = loggedInUser 
      ? employees.find(e => e.email.toLowerCase() === loggedInUser.email.toLowerCase())
      : null;
    
    const finalIds = loggedInEmployee?.id 
      ? [...new Set([...selectedIds, loggedInEmployee.id])]
      : selectedIds;
    
    dispatch(openCashBox(finalIds));
    setIsSubmitting(false);
    onClose?.();
  };

  const otherEmployees = employees.filter(e => 
    !loggedInUser || e.email.toLowerCase() !== loggedInUser.email.toLowerCase()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {loggedInUser && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h4m0 0v4m-4-4h4" />
                </svg>
                <span className="font-medium">{loggedInUser.name}</span>
                <span className="text-primary/70">(sesión activa)</span>
              </div>
            )}
            <h2 className="text-xl font-bold text-text-primary">Abrir Caja</h2>
            <p className="text-sm text-text-muted mt-1">
              Selecciona los empleados que trabajan en este turno
            </p>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {otherEmployees.map(emp => (
              <button
                key={emp.id}
                type="button"
                onClick={() => toggleEmployee(emp.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  selectedIds.includes(emp.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedIds.includes(emp.id)
                    ? 'bg-primary border-primary'
                    : 'border-border'
                }`}>
                  {selectedIds.includes(emp.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{emp.name}</p>
                  <p className="text-xs text-text-muted">{emp.role} • {emp.shift}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds(otherEmployees.map(e => e.id))}
              className="flex-1 py-3 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={handleOpenCashBox}
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-bold rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Abriendo...
                </>
              ) : (
                `Abrir Caja (${(loggedInUser ? 1 : 0) + selectedIds.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBoxOpenModal;