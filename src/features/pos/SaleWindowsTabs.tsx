import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  selectWindows,
  selectActiveWindowId,
  selectCanCreateWindow,
  createWindow,
  closeWindow,
  setActiveWindow,
} from './posSlice';
import Modal from '../../components/ui/Modal';

const SaleWindowsTabs: React.FC = () => {
  const dispatch = useAppDispatch();
  const windows = useAppSelector(selectWindows);
  const activeWindowId = useAppSelector(selectActiveWindowId);
  const canCreate = useAppSelector(selectCanCreateWindow);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);

  const activeWindow = windows.find(w => w.id === activeWindowId);
  const handleClose = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (window && window.cart.length > 0) {
      setConfirmCloseId(windowId);
    } else {
      dispatch(closeWindow(windowId));
    }
  };

  const confirmClose = () => {
    if (confirmCloseId) {
      dispatch(closeWindow(confirmCloseId));
      setConfirmCloseId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {windows.map(window => {
          const isActive = window.id === activeWindowId;
          const itemCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <div
              key={window.id}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-border text-text-muted hover:border-primary hover:text-primary'
              }`}
              onClick={() => dispatch(setActiveWindow(window.id))}
            >
              <span>{window.name}</span>
              {itemCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {itemCount}
                </span>
              )}
              {windows.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose(window.id);
                  }}
                  className={`w-4 h-4 flex items-center justify-center rounded-full text-xs transition-colors ${
                    isActive
                      ? 'hover:bg-white/20 text-white/80'
                      : 'hover:bg-gray-100 text-text-muted'
                  }`}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {canCreate && (
          <button
            type="button"
            onClick={() => dispatch(createWindow())}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors"
            title="Nueva venta"
          >
            +
          </button>
        )}
      </div>

      {confirmCloseId && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmCloseId(null)}
          title="Cerrar venta"
        >
          <div className="p-6">
            <p className="text-text-primary mb-4">
              Esta venta tiene <strong>{activeWindow?.cart.reduce((sum, item) => sum + item.quantity, 0)} productos</strong> sin completar. ¿Descartar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmCloseId(null)}
                className="px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClose}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Descartar y cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SaleWindowsTabs;
