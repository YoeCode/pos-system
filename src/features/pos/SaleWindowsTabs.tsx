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
      <div className="flex items-end gap-0.5 overflow-x-auto scrollbar-hide bg-gray-100/80 px-2 pt-1.5 border-b border-gray-300">
        {windows.map((window, index) => {
          const isActive = window.id === activeWindowId;
          const itemCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <div
              key={window.id}
              onClick={() => dispatch(setActiveWindow(window.id))}
              className={`
                flex-shrink-0 flex items-center gap-2 px-3.5 py-2 text-sm font-medium cursor-pointer select-none
                transition-all duration-150 min-w-[100px] max-w-[180px]
                ${isActive
                  ? 'bg-white text-text-primary rounded-t-lg shadow-[0_-1px_2px_rgba(0,0,0,0.05)] relative z-10 border-t border-l border-r border-gray-200 translate-y-[1px] pb-[9px]'
                  : 'bg-gray-200/70 text-text-muted hover:bg-gray-300/60 hover:text-text-primary rounded-t-md border-t border-l border-r border-transparent'
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-white" />
              )}
              <span className="truncate flex-1">{window.name}</span>
              {itemCount > 0 && (
                <span className={`
                  flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                  ${isActive ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}
                `}>
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
                  className={`
                    flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs
                    transition-colors ml-1
                    ${isActive
                      ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                      : 'hover:bg-gray-400/30 text-gray-400 hover:text-gray-600'
                    }
                  `}
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
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 mb-1.5 ml-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            title="Nueva venta"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
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
