import { useState, useEffect } from 'react';
import { getTenantInfo } from './tenantsService';
import type { TenantInfo } from './tenantsService';

interface BillingSectionProps {
  tenantId: string;
}

export default function BillingSection({ tenantId }: BillingSectionProps) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const info = await getTenantInfo(tenantId);
      setTenant(info);
      setIsLoading(false);
    }
    load();
  }, [tenantId]);

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-1/3" />
          <div className="h-8 bg-slate-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <p className="text-slate-400">No se pudo cargar la información de facturación.</p>
      </div>
    );
  }

  const planFeatures: Record<string, string[]> = {
    free: ['2 empleados', '100 productos', '500 ventas/mes'],
    pro: ['10 empleados', '1,000 productos', '10,000 ventas/mes'],
    enterprise: ['Empleados ilimitados', 'Productos ilimitados', 'Ventas ilimitadas'],
  };

  const planPrices: Record<string, string> = {
    free: 'Gratis',
    pro: '€29/mes',
    enterprise: '€99/mes',
  };

  const isPastDue = tenant.subscriptionStatus === 'past_due';

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Plan actual</h3>
          <p className="text-slate-400 text-sm mt-1">
            {isPastDue ? 'Pago pendiente' : `Estado: ${tenant.subscriptionStatus}`}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-white capitalize">{tenant.plan}</span>
          <p className="text-emerald-400 text-sm font-medium">{planPrices[tenant.plan]}</p>
        </div>
      </div>

      {isPastDue && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm font-medium">
            Tu suscripción tiene un pago pendiente. Actualiza tu método de pago para evitar interrupciones.
          </p>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {planFeatures[tenant.plan]?.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-slate-300 text-sm">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {tenant.plan !== 'enterprise' && (
          <button
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
            onClick={() => {
              alert('Stripe Checkout integration pending');
            }}
          >
            {tenant.plan === 'free' ? 'Actualizar a Pro' : 'Actualizar a Enterprise'}
          </button>
        )}
        <button
          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
          onClick={() => {
            alert('Stripe Customer Portal integration pending');
          }}
        >
          Gestionar suscripción
        </button>
      </div>
    </div>
  );
}
