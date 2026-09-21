import { useAppSelector } from '../../app/store';
import { selectFilteredSales } from '../../features/dashboard/dashboardSlice';
import MetricCard from '../../components/ui/MetricCard';
import SalesChart from './SalesChart';
import PaymentMethodChart from './PaymentMethodChart';
import RecentSales from './RecentSales';
import LowStockAlerts from './LowStockAlerts';
import StockAlertBanner from '../../components/StockAlertBanner';
import { useI18n } from '../../i18n/useI18n';
import { selectStoreName } from '../../features/settings/settingsSlice';

const formatEUR = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const DashboardPage = () => {
  const sales = useAppSelector(selectFilteredSales);
  const t = useI18n();
  const storeName = useAppSelector(selectStoreName);

  const totalRevenue = sales.reduce((sum, s) => sum + s.order.total, 0);
  const totalTickets = sales.length;
  const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6 flex flex-col space-y-6">
      <StockAlertBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 md:p-6 rounded-xl border border-border shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg text-text-primary">
              {t.dashboard.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-semibold bg-success-light text-success border border-success/20">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              En línea
            </span>
          </div>
          <p className="text-body-md text-text-muted mt-1 capitalize">
            {today} · {storeName}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label={t.dashboard.todaySales}
          value={formatEUR(totalRevenue)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <MetricCard
          label={t.dashboard.totalOrders}
          value={`${totalTickets} tickets`}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <MetricCard
          label={t.dashboard.averageTicket}
          value={formatEUR(avgTicket)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <MetricCard
          label="Margen bruto estimado"
          value="—"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
          }
        />
      </div>

      {/* Main Content: 7/5 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Recent Sales */}
          <div className="bg-white p-5 rounded-xl border border-border shadow-card">
            <RecentSales sales={sales.slice(0, 5)} />
          </div>

          {/* Sales Chart */}
          <div className="bg-white p-5 rounded-xl border border-border shadow-card">
            <SalesChart sales={sales} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Payment Methods */}
          <div className="bg-white p-5 rounded-xl border border-border shadow-card">
            <PaymentMethodChart sales={sales} />
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-xl border border-border shadow-card">
            <LowStockAlerts />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
