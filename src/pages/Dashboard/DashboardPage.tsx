import { useAppSelector } from '../../app/store';
import { selectFilteredSales } from '../../features/dashboard/dashboardSlice';
import KpiCard from './KpiCard';
import SalesChart from './SalesChart';
import PaymentMethodChart from './PaymentMethodChart';
import RecentSales from './RecentSales';
import LowStockAlerts from './LowStockAlerts';

const DashboardPage = () => {
  const sales = useAppSelector(selectFilteredSales);
  const products = useAppSelector(state => state.products.items);

  const totalRevenue = sales.reduce((sum, s) => sum + s.order.total, 0);
  const totalTickets = sales.length;
  const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach(sale => {
    sale.order.items.forEach(item => {
      if (!productSales[item.product.id]) {
        productSales[item.product.id] = { name: item.product.name, qty: 0, revenue: 0 };
      }
      productSales[item.product.id].qty += item.quantity;
      productSales[item.product.id].revenue += item.lineTotal;
    });
  });

  const topProduct = Object.values(productSales).sort((a, b) => b.revenue - a.revenue)[0];

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted mt-1">Overview of your business performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Today's Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          trend="+12.5%"
          trendUp={true}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Tickets"
          value={totalTickets.toString()}
          trend="+3"
          trendUp={true}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          title="Avg Ticket"
          value={`$${avgTicket.toFixed(2)}`}
          trend="-2.1%"
          trendUp={false}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <KpiCard
          title="Top Product"
          value={topProduct?.name || '—'}
          subtitle={topProduct ? `${topProduct.qty} sold · $${topProduct.revenue.toFixed(2)}` : ''}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-border p-5">
          <SalesChart sales={sales} />
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <PaymentMethodChart sales={sales} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-border p-5">
          <RecentSales sales={sales.slice(0, 5)} />
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <LowStockAlerts products={lowStockProducts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
