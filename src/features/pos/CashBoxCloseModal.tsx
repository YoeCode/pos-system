import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectAllSales } from '../../features/sales/salesSlice';
import { selectActiveEmployees } from '../../features/employees/employeesSlice';
import { selectCashBoxEmployeeIds, selectWorkingEmployees, closeCashBoxWithClosure, selectCashBoxOpenTime } from './posSlice';
import Modal from '../../components/ui/Modal';
import type { PaymentMethod, CashBoxClosure } from '../../types';

type CloseStep = 'summary' | 'count' | 'confirm';

interface CashBoxCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  bizum: 'Bizum',
};

const CashBoxCloseModal: React.FC<CashBoxCloseModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const allSales = useAppSelector(selectAllSales);
  const employees = useAppSelector(selectActiveEmployees);
  const workingIds = useAppSelector(selectWorkingEmployees);
  const cashBoxOpenTime = useAppSelector(selectCashBoxOpenTime);
  const currentEmployeeId = useAppSelector(state => state.pos.currentEmployeeId);
  const currentUser = useAppSelector(state => state.auth.user);

  const [step, setStep] = useState<CloseStep>('summary');
  const [counts, setCounts] = useState<Record<PaymentMethod, string>>({
    cash: '',
    card: '',
    bizum: '',
  });
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [completed, setCompleted] = useState(false);

  const openTime = cashBoxOpenTime ? new Date(cashBoxOpenTime) : null;

  const shiftSales = useMemo(() => {
    if (!openTime) return [];
    return allSales.filter(s => new Date(s.completedAt) >= openTime);
  }, [allSales, openTime]);

  const salesByMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = { cash: 0, card: 0, bizum: 0 };
    shiftSales.forEach(s => {
      totals[s.paymentMethod] += s.order.total;
    });
    return totals;
  }, [shiftSales]);

  const totalSales = salesByMethod.cash + salesByMethod.card + salesByMethod.bizum;

  const parsedCounts: Record<PaymentMethod, number> = {
    cash: parseFloat(counts.cash) || 0,
    card: parseFloat(counts.card) || 0,
    bizum: parseFloat(counts.bizum) || 0,
  };

  const totalCounted = parsedCounts.cash + parsedCounts.card + parsedCounts.bizum;

  const differences: Record<PaymentMethod, number> = {
    cash: parsedCounts.cash - salesByMethod.cash,
    card: parsedCounts.card - salesByMethod.card,
    bizum: parsedCounts.bizum - salesByMethod.bizum,
  };

  const totalDifference = totalCounted - totalSales;
  const hasDifference = Math.abs(totalDifference) > 0.01;

  const workingEmployees = employees.filter(e => workingIds.includes(e.id));

  const formatDuration = () => {
    if (!openTime) return '-';
    const diff = Date.now() - openTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const handleConfirm = () => {
    if (hasDifference) {
      const authorizer = employees.find(e => e.pin === pin.trim());
      if (!authorizer) {
        setPinError('PIN incorrecto');
        return;
      }
    }

    const closure: CashBoxClosure = {
      id: crypto.randomUUID(),
      openedAt: cashBoxOpenTime || new Date().toISOString(),
      closedAt: new Date().toISOString(),
      employeeIds: workingIds,
      salesByMethod: { ...salesByMethod },
      totalSales,
      countedByMethod: { ...parsedCounts },
      totalCounted,
      differences: { ...differences },
      totalDifference,
      authorizedBy: hasDifference ? pin : undefined,
    };

    dispatch(closeCashBoxWithClosure(closure));
    setCompleted(true);
    setTimeout(() => {
      handleReset();
      onClose();
    }, 2500);
  };

  const handleReset = () => {
    setStep('summary');
    setCounts({ cash: '', card: '', bizum: '' });
    setPin('');
    setPinError('');
    setCompleted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Arqueo de Caja">
      {completed ? (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Caja cerrada correctamente</h3>
          <p className="text-text-muted">
            {hasDifference
              ? `Diferencia: ${totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)}€`
              : 'Cuadre perfecto'}
          </p>
        </div>
      ) : step === 'summary' ? (
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Apertura</span>
              <span className="text-sm font-medium text-text-primary">
                {openTime ? openTime.toLocaleString() : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Duración</span>
              <span className="text-sm font-medium text-text-primary">{formatDuration()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Empleados</span>
              <span className="text-sm font-medium text-text-primary">
                {workingEmployees.map(e => e.name).join(', ')}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Ventas en turno</span>
              <span className="text-sm font-bold text-primary">{shiftSales.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Total vendido</span>
              <span className="text-sm font-bold text-primary">${totalSales.toFixed(2)}</span>
            </div>
            {(['cash', 'card', 'bizum'] as PaymentMethod[]).map(method => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{paymentLabels[method]}</span>
                <span className="text-sm font-mono text-text-primary">${salesByMethod[method].toFixed(2)}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep('count')}
            className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Iniciar conteo
          </button>
        </div>
      ) : step === 'count' ? (
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-text-muted">Introduce el dinero real contado en caja por cada método de pago.</p>

          <div className="flex flex-col gap-3">
            {(['cash', 'card', 'bizum'] as PaymentMethod[]).map(method => (
              <div key={method}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text-primary">{paymentLabels[method]}</label>
                  <span className="text-xs text-text-muted">Esperado: ${salesByMethod[method].toFixed(2)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={counts[method]}
                    onChange={e => setCounts(prev => ({ ...prev, [method]: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                {parsedCounts[method] > 0 && (
                  <div className={`text-xs mt-1 ${differences[method] > 0.01 ? 'text-green-600' : differences[method] < -0.01 ? 'text-red-600' : 'text-text-muted'}`}>
                    Diferencia: {differences[method] >= 0 ? '+' : ''}${differences[method].toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Total contado</span>
            <span className="text-lg font-bold text-text-primary">${totalCounted.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Total esperado</span>
            <span className="text-lg font-bold text-text-primary">${totalSales.toFixed(2)}</span>
          </div>
          <div className={`flex items-center justify-between p-3 rounded-lg ${hasDifference ? 'bg-red-50' : 'bg-green-50'}`}>
            <span className={`text-sm font-medium ${hasDifference ? 'text-red-700' : 'text-green-700'}`}>
              {hasDifference ? 'Diferencia detectada' : 'Cuadre perfecto'}
            </span>
            <span className={`font-bold ${hasDifference ? 'text-red-700' : 'text-green-700'}`}>
              {totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('summary')}
              className="flex-1 py-3 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              disabled={totalCounted <= 0}
              className="flex-1 py-3 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-text-primary">Resumen del arqueo</p>
            {(['cash', 'card', 'bizum'] as PaymentMethod[]).map(method => (
              <div key={method} className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{paymentLabels[method]}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-text-muted">Esp: ${salesByMethod[method].toFixed(2)}</span>
                  <span className="font-mono text-text-primary">Cnt: ${parsedCounts[method].toFixed(2)}</span>
                  <span className={`font-mono text-xs w-16 text-right ${differences[method] > 0.01 ? 'text-green-600' : differences[method] < -0.01 ? 'text-red-600' : 'text-text-muted'}`}>
                    {differences[method] >= 0 ? '+' : ''}${differences[method].toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">Diferencia total</span>
              <span className={`font-bold ${hasDifference ? 'text-red-600' : 'text-green-600'}`}>
                {totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)}
              </span>
            </div>
          </div>

          {hasDifference && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                PIN de supervisor (requerido por diferencia)
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(''); }}
                placeholder="****"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {pinError && <p className="text-xs text-error mt-1">{pinError}</p>}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('count')}
              className="flex-1 py-3 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar caja
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default CashBoxCloseModal;
