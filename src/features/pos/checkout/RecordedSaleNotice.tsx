import React from 'react';
import { useI18n } from '../../../i18n/useI18n';

// Issue #56 — post-recording state guard. Once the sale row exists, the pay
// action is retired for this checkout attempt: this notice replaces it so a
// later failure (stock decrements, loyalty, …) can never record a second sale.
interface RecordedSaleNoticeProps {
  canRetryStock: boolean;
  busy: boolean;
  onRetryStock: () => void;
  onFinish: () => void;
}

const RecordedSaleNotice: React.FC<RecordedSaleNoticeProps> = ({
  canRetryStock,
  busy,
  onRetryStock,
  onFinish,
}) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 rounded-lg bg-success/10 border border-success/20">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold text-success">
            {t.pos.saleAlreadyRegistered || 'La venta ya está registrada'}
          </p>
        </div>
      </div>

      {canRetryStock && (
        <button
          onClick={onRetryStock}
          disabled={busy}
          className="w-full py-3 bg-transparent border border-border text-text-primary hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-xl text-sm transition-all duration-150"
        >
          {t.pos.retryStockReduction || 'Reintentar descuento de stock'}
        </button>
      )}

      <button
        onClick={onFinish}
        disabled={busy}
        className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
      >
        {t.pos.finishSale || 'Finalizar'}
      </button>
    </div>
  );
};

export default RecordedSaleNotice;
