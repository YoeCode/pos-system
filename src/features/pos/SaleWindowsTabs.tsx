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
import { useI18n } from '../../i18n/useI18n';

const SaleWindowsTabs: React.FC = () => {
  const dispatch = useAppDispatch();
  const windows = useAppSelector(selectWindows);
  const activeWindowId = useAppSelector(selectActiveWindowId);
  const canCreate = useAppSelector(selectCanCreateWindow);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const t = useI18n();

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
      <div className="flex items-end px-2 pt-1 bg-surface">
        {windows.map((window) => {
          const isActive = window.id === activeWindowId;
          const itemCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <div
              key={window.id}
              onClick={() => dispatch(setActiveWindow(window.id))}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer select-none
                transition-all duration-200 min-w-[120px] max-w-[180px]
                ${isActive
                  ? 'bg-background text-green-600 rounded-t-xl z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]'
                  : 'bg-gray-100 text-text-muted hover:bg-gray-200 hover:text-text-primary rounded-t-lg'
                }
              `}
              style={{
                marginLeft: '-8px',
                paddingLeft: isActive ? '16px' : '20px',
              }}
            >
              {isActive && (
                <div className="absolute -left-px -right-px top-full h-[2px] bg-background" />
              )}
              <span className="truncate flex-1">{window.name}</span>
              {itemCount > 0 && (
                <span className={`
                  flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-bold
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
                    flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-sm
                    transition-colors ml-1 opacity-60 hover:opacity-100
                    ${isActive
                      ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                      : 'hover:bg-gray-400/30 text-gray-400 hover:text-gray-600'
                    }
                  `}
                  title={t.pos.closeWindow || 'Cerrar ventana de venta'}
                  aria-label={t.pos.closeWindow || 'Cerrar ventana de venta'}
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
            className="flex-shrink-0 flex items-center justify-center w-11 h-11 mb-2 ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            title={t.pos.newSale || 'Nueva venta'}
            aria-label={t.pos.newSale || 'Nueva venta'}
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
          title={t.pos.closeSale || 'Cerrar venta'}
        >
          <div className="p-6">
            <p className="text-text-primary mb-4">
              {t.pos.closeSaleConfirm || `Esta venta tiene {{count}} productos sin completar. ¿Descartar?`.replace('{{count}}', String(activeWindow?.cart.reduce((sum, item) => sum + item.quantity, 0) || 0))}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmCloseId(null)}
                className="px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50"
              >
                {t.pos.cancel}
              </button>
              <button
                type="button"
                onClick={confirmClose}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                {t.pos.discardAndClose || 'Descartar y cerrar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SaleWindowsTabs;
