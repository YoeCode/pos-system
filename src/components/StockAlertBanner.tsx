import React, { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { selectLowStockAlerts } from '../../features/products/productsSlice';
import { useNavigate } from 'react-router-dom';

const StockAlertBanner: React.FC = () => {
  const alerts = useAppSelector(selectLowStockAlerts);
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className={`mx-4 lg:mx-6 mt-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${criticalCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${criticalCount > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </div>
        <div>
          <p className={`text-sm font-semibold ${criticalCount > 0 ? 'text-red-700' : 'text-amber-700'}`}>
            {criticalCount > 0
              ? `${criticalCount} producto${criticalCount > 1 ? 's' : ''} sin stock`
              : `${warningCount} producto${warningCount > 1 ? 's' : ''} con stock bajo`}
          </p>
          <p className={`text-xs ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
            Revisa el inventario para reabastecer
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/inventory?tab=lowstock')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${criticalCount > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
        >
          Ver inventario
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-black/5 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>
  );
};

export default StockAlertBanner;
