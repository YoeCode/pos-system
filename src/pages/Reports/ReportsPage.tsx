import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../app/store';
import { useI18n } from '../../i18n/I18nProvider';
import { selectFilteredSales } from '../../features/dashboard/dashboardSlice';
import Modal from '../../components/ui/Modal';

type ReportTab = 'sales' | 'products' | 'employees';
type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

const ReportsPage: React.FC = () => {
  const t = useI18n();
  const allSales = useAppSelector(selectFilteredSales);
  const employees = useAppSelector(state => state.employees.employees);
  
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'sales', label: t.reports.salesReport },
    { id: 'products', label: t.reports.productReport },
    { id: 'employees', label: t.reports.employeeReport },
  ];

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'today', label: t.reports.today },
    { value: 'week', label: t.reports.thisWeek },
    { value: 'month', label: t.reports.thisMonth },
    { value: 'year', label: t.reports.thisYear },
    { value: 'custom', label: t.reports.custom },
  ];

  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return allSales.filter(sale => {
      const saleDate = new Date(sale.completedAt);
      
      switch (dateRange) {
        case 'today':
          return saleDate >= today;
        case 'week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return saleDate >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return saleDate >= monthAgo;
        }
        case 'year': {
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return saleDate >= yearAgo;
        }
        case 'custom':
          if (!customStartDate || !customEndDate) return true;
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59);
          return saleDate >= start && saleDate <= end;
        default:
          return true;
      }
    });
  }, [allSales, dateRange, customStartDate, customEndDate]);

  const salesStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.order.total, 0);
    const totalTax = filteredSales.reduce((sum, s) => sum + s.order.tax, 0);
    const totalOrders = filteredSales.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const byPayment: Record<string, number> = { cash: 0, card: 0, qr: 0 };
    filteredSales.forEach(s => {
      byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.order.total;
    });
    
    return { totalRevenue, totalTax, totalOrders, avgTicket, byPayment };
  }, [filteredSales]);

  const productStats = useMemo(() => {
    const productSales: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    const categorySales: Record<string, number> = {};
    
    filteredSales.forEach(sale => {
      sale.order.items.forEach(item => {
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { 
            name: item.product.name, 
            category: item.product.category,
            qty: 0, 
            revenue: 0 
          };
        }
        productSales[item.product.id].qty += item.quantity;
        productSales[item.product.id].revenue += item.lineTotal;
        
        categorySales[item.product.category] = (categorySales[item.product.category] || 0) + item.lineTotal;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return { topProducts, categorySales };
  }, [filteredSales]);

  const productCategories = useMemo(() => {
    return ['all', ...Object.keys(productStats.categorySales).sort()];
  }, [productStats.categorySales]);

  const filteredTopProducts = useMemo(() => {
    if (selectedProductCategory === 'all') return productStats.topProducts;
    return productStats.topProducts.filter(p => p.category === selectedProductCategory);
  }, [productStats.topProducts, selectedProductCategory]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportSales = () => {
    const data = filteredSales.map(sale => ({
      order: sale.order.orderNumber,
      date: formatDate(sale.completedAt),
      items: sale.order.items.length,
      subtotal: sale.order.subtotal.toFixed(2),
      tax: sale.order.tax.toFixed(2),
      total: sale.order.total.toFixed(2),
      payment: sale.paymentMethod
    }));
    exportToCSV(data, 'sales_report');
  };

  const handleExportProducts = () => {
    const data = filteredTopProducts.map(p => ({
      name: p.name,
      category: p.category,
      quantity: p.qty,
      revenue: p.revenue.toFixed(2)
    }));
    exportToCSV(data, 'products_report');
  };

  const handleExportEmployees = () => {
    const data = employees.map(emp => ({
      name: emp.name,
      role: emp.role,
      active: emp.active ? 'Yes' : 'No'
    }));
    exportToCSV(data, 'employees_report');
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t.reports.title}</h1>
        <p className="text-text-muted mt-1">{t.reports.title}</p>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 flex-shrink-0 flex flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary rounded-lg px-4 py-2.5 text-sm font-medium w-full text-left'
                  : 'text-text-muted hover:text-text-primary hover:bg-gray-50 rounded-lg px-4 py-2.5 text-sm font-medium w-full text-left transition-colors'
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-text-primary">{t.reports.dateRange}:</label>
              <div className="flex gap-2">
                {dateRangeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      dateRange === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => {
                    if (activeTab === 'sales') handleExportSales();
                    else if (activeTab === 'products') handleExportProducts();
                    else handleExportEmployees();
                  }}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t.reports.exportExcel}
                </button>
              </div>
              
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 ml-4">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-border rounded-lg"
                  />
                  <span className="text-text-muted">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {activeTab === 'sales' && (
            <div className="flex flex-col gap-4 lg:gap-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.reports.totalSales}</p>
                  <p className="text-xl lg:text-2xl font-bold text-text-primary mt-1">{formatCurrency(salesStats.totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.reports.totalOrders}</p>
                  <p className="text-xl lg:text-2xl font-bold text-text-primary mt-1">{salesStats.totalOrders}</p>
                </div>
                <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.dashboard.averageTicket}</p>
                  <p className="text-xl lg:text-2xl font-bold text-text-primary mt-1">{formatCurrency(salesStats.avgTicket)}</p>
                </div>
                <div className="bg-white rounded-xl border border-border p-4 lg:p-5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.reports.totalTax}</p>
                  <p className="text-xl lg:text-2xl font-bold text-text-primary mt-1">{formatCurrency(salesStats.totalTax)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">{t.pos.paymentMethod}</h3>
                  <div className="flex flex-col gap-3">
                    {Object.entries(salesStats.byPayment).map(([method, amount]) => (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm text-text-muted capitalize">{t.pos[method as 'cash' | 'card' | 'bizum']}</span>
                        <span className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">{t.reports.salesByCategory}</h3>
                  {Object.keys(productStats.categorySales).length === 0 ? (
                    <p className="text-sm text-text-muted">{t.reports.noData}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.entries(productStats.categorySales)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, amount]) => (
                          <div key={cat} className="flex items-center justify-between">
                            <span className="text-sm text-text-muted">{cat}</span>
                            <span className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t.reports.totalOrders}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">Order</th>
                        <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.products.name}</th>
                        <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.pos.total}</th>
                        <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.pos.paymentMethod}</th>
                        <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.products.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.slice(0, 20).map(sale => (
                        <tr key={sale.id} className="border-b border-border">
                          <td className="py-3 text-sm font-mono text-text-primary">{sale.order.orderNumber}</td>
                          <td className="py-3 text-sm text-text-muted">{sale.order.items.length} items</td>
                          <td className="py-3 text-sm font-mono text-text-primary text-right">{formatCurrency(sale.order.total)}</td>
                          <td className="py-3 text-sm text-text-muted text-right capitalize">{t.pos[sale.paymentMethod as 'cash' | 'card' | 'bizum']}</td>
                          <td className="py-3 text-sm text-text-muted text-right">{formatDate(sale.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">{t.products.category}:</span>
                  <div className="flex gap-2 flex-wrap">
                    {productCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedProductCategory(cat)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          selectedProductCategory === cat
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                        }`}
                      >
                        {cat === 'all' ? t.common.all : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t.reports.bestSellers}</h3>
                {filteredTopProducts.length === 0 ? (
                  <p className="text-sm text-text-muted">{t.reports.noData}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">#</th>
                          <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.products.name}</th>
                          <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.products.category}</th>
                          <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.reports.quantity}</th>
                          <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider py-3">{t.reports.revenue}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTopProducts.map((product, idx) => (
                          <tr key={idx} className="border-b border-border">
                            <td className="py-3 text-sm font-mono text-text-muted">{idx + 1}</td>
                            <td className="py-3 text-sm font-medium text-text-primary">{product.name}</td>
                            <td className="py-3 text-sm text-text-muted">{product.category}</td>
                            <td className="py-3 text-sm font-mono text-text-primary text-right">{product.qty}</td>
                            <td className="py-3 text-sm font-mono font-semibold text-text-primary text-right">{formatCurrency(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{t.reports.salesByEmployee}</h3>
                {filteredSales.length === 0 ? (
                  <p className="text-sm text-text-muted">{t.reports.noData}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {employees.filter(e => e.active).map(emp => {
                      const empSales = filteredSales.filter(s => s.employeeId === emp.id);
                      const totalRevenue = empSales.reduce((sum, s) => sum + s.order.total, 0);
                      return (
                        <div 
                          key={emp.id} 
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{emp.name}</p>
                              <p className="text-xs text-text-muted">{emp.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(totalRevenue)}</p>
                            <p className="text-xs text-text-muted">{empSales.length} {t.reports.totalOrders.toLowerCase()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        title={employees.find(e => e.id === selectedEmployeeId)?.name || ''}
        subtitle={t.reports.salesByEmployee}
      >
        {selectedEmployeeId && (() => {
          const empSales = filteredSales.filter(s => s.employeeId === selectedEmployeeId);
          if (empSales.length === 0) {
            return <p className="text-sm text-text-muted">{t.reports.noData}</p>;
          }
          return (
            <div className="flex flex-col gap-3">
              {empSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-border">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">{sale.order.orderNumber}</span>
                    <span className="text-xs text-text-muted">
                      {sale.order.items.length} {t.reports.quantity.toLowerCase()} · {formatDate(sale.completedAt)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(sale.order.total)}</p>
                    <p className="text-xs text-text-muted capitalize">{t.pos[sale.paymentMethod as 'cash' | 'card' | 'bizum']}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default ReportsPage;