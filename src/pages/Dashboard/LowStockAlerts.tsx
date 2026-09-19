import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { selectLowStockAlerts } from '../../features/products/productsSlice';

const LowStockAlerts: React.FC = () => {
  const navigate = useNavigate();
  const alerts = useAppSelector(selectLowStockAlerts);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-warning"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-headline-sm text-text-primary">
            Alertas de inventario
          </h3>
        </div>
        {alerts.length > 0 && (
          <span className="text-label-sm font-semibold bg-warning-light text-warning px-2.5 py-1 rounded-[6px] border border-warning/20">
            {alerts.length} avisos
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center">
            <svg
              className="w-6 h-6 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-body-md font-medium text-text-primary">
            Todo en orden
          </p>
          <p className="text-body-sm text-text-muted">
            No hay productos con stock bajo
          </p>
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div className="p-3 bg-warning-light/40 border border-warning/30 rounded-[10px] mb-4">
            <p className="text-label-md text-amber-800 font-medium">
              {alerts.length} producto
              {alerts.length !== 1 ? 's' : ''} por debajo del stock mínimo
              recomendado
            </p>
          </div>

          {/* Alert items */}
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const isCritical = alert.severity === 'critical';
              return (
                <div
                  key={alert.productId}
                  className="flex items-center justify-between border-b border-border/50 pb-3"
                >
                  <div>
                    <p className="text-body-md font-medium text-text-primary">
                      {alert.productName}
                    </p>
                    {alert.sizes && alert.sizes.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {alert.sizes.map((s) => (
                          <span
                            key={s.size}
                            className={`text-label-sm px-1.5 py-0.5 rounded ${s.stock === 0 ? 'bg-error-container text-error' : 'bg-warning-light text-warning'}`}
                          >
                            {s.size}: {s.stock}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-label-sm font-semibold rounded ${isCritical ? 'bg-error-container text-error' : 'bg-warning-light text-warning'}`}
                    >
                      {alert.stock} ud{alert.stock !== 1 ? 's' : ''} restante
                      {alert.stock !== 1 ? 's' : ''}
                    </span>
                    <p className="text-label-sm text-text-muted mt-0.5">
                      Mín: {alert.minStock} uds
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <button
            onClick={() =>
              navigate(
                alerts.some((a) => a.severity === 'critical')
                  ? '/inventory?tab=reorder'
                  : '/inventory?tab=lowstock',
              )
            }
            className="w-full mt-4 min-h-[44px] flex items-center justify-center gap-2 border border-border text-primary text-label-md font-semibold rounded-[10px] hover:bg-surface-container-low transition-colors"
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>Generar orden de reposición</span>
          </button>
        </>
      )}
    </div>
  );
};

export default LowStockAlerts;
