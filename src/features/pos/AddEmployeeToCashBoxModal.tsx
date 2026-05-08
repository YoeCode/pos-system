import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectActiveEmployees } from '../employees/employeesSlice';
import { addCashBoxEmployee, selectCashBoxEmployeeIds } from './posSlice';

interface AddEmployeeToCashBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddEmployeeToCashBoxModal: React.FC<AddEmployeeToCashBoxModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const employees = useAppSelector(selectActiveEmployees);
  const cashBoxEmployeeIds = useAppSelector(selectCashBoxEmployeeIds);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableEmployees = employees.filter(e => !cashBoxEmployeeIds.includes(e.id));

  const toggleEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );
  };

  const handleAdd = () => {
    selectedIds.forEach(id => {
      dispatch(addCashBoxEmployee(id));
    });
    setSelectedIds([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Añadir Vendedor</h2>
            <p className="text-sm text-text-muted mt-1">
              Selecciona los empleados que quieres añadir a la caja abierta
            </p>
          </div>
          
          {availableEmployees.length === 0 ? (
            <div className="text-center py-4 text-text-muted">
              No hay empleados disponibles para añadir
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {availableEmployees.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(emp.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    selectedIds.includes(emp.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-border hover:border-blue-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedIds.includes(emp.id)
                      ? 'bg-blue-600 border-blue-600'
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
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedIds.length === 0}
              className={`flex-1 py-3 text-sm font-bold rounded-lg ${
                selectedIds.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Añadir ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeToCashBoxModal;
