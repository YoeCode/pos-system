import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectActiveEmployees } from '../employees/employeesSlice';
import { openCashBox } from './posSlice';

interface CashBoxOpenModalProps {
  isOpen: boolean;
  closedBoxCount?: number;
}

const CashBoxOpenModal: React.FC<CashBoxOpenModalProps> = ({ isOpen, closedBoxCount = 0 }) => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectActiveEmployees);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const prevClosedCount = useRef(closedBoxCount);

  if (prevClosedCount.current !== closedBoxCount) {
    prevClosedCount.current = closedBoxCount;
    setSelectedIds([]);
  }

  const toggleEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );
  };

  const handleOpenCashBox = () => {
    if (selectedIds.length > 0) {
      dispatch(openCashBox(selectedIds));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Abrir Caja</h2>
            <p className="text-sm text-text-muted mt-1">
              Selecciona los empleados que trabajan en este turno
            </p>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {employees.map(emp => (
              <button
                key={emp.id}
                type="button"
                onClick={() => toggleEmployee(emp.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  selectedIds.includes(emp.id)
                    ? 'border-green-600 bg-green-50'
                    : 'border-border hover:border-green-400'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedIds.includes(emp.id)
                    ? 'bg-green-600 border-green-600'
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
              onClick={() => setSelectedIds(employees.map(e => e.id))}
              className="flex-1 py-3 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={handleOpenCashBox}
              disabled={selectedIds.length === 0}
              className={`flex-1 py-3 text-sm font-bold rounded-lg ${
                selectedIds.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Abrir Caja ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBoxOpenModal;