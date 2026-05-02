import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../app/store';
import { useI18n } from '../../i18n/I18nProvider';

type InventoryTab = 'summary' | 'lowstock' | 'reorder';

const InventoryPage: React.FC = () => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<InventoryTab>('summary');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const products = useAppSelector(state => state.products.items);

  const tabs = [
    { id: 'summary' as const, label: t.inventory.summary },
    { id: 'lowstock' as const, label: t.inventory.lowStock },
    { id: 'reorder' as const, label: t.inventory.reorder },
  ];

  const stockByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      const cat = product.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalStock: 0, totalValue: 0 };
      }
      acc[cat].count += 1;
      acc[cat].totalStock += product.stock;
      acc[cat].totalValue += product.stock * product.price;
      return acc;
    }, {} as Record<string, { count: number; totalStock: number; totalValue: number }>);
  }, [products]);

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => (p.category || 'Uncategorized') === selectedCategory);
  }, [products, selectedCategory]);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const reorderProducts = products.filter(p => p.stock <= p.minStock);

  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t.inventory.title}</h1>
          <p className="text-sm text-text-muted mt-0.5">{t.inventory.subtitle}</p>
        </div>

        <div className="flex gap-1 bg-white rounded-lg border border-border p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'summary' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.totalProducts}</p>
                <p className="text-3xl font-bold text-text-primary font-mono">{products.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.totalStock}</p>
                <p className="text-3xl font-bold text-primary font-mono">
                  {products.reduce((sum, p) => sum + p.stock, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.totalValue}</p>
                <p className="text-3xl font-bold text-secondary font-mono">${totalValue.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-gray-50">
                <h3 className="text-sm font-semibold text-text-primary">{t.inventory.byCategory}</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.category}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.products}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.stock}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.value}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stockByCategory).map(([category, data]) => (
                    <tr 
                      key={category} 
                      className="border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <td className="px-5 py-3 text-sm font-medium text-text-primary">{category}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">{data.count}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">{data.totalStock}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">${data.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCategory && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-primary/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{selectedCategory}</h3>
                    <p className="text-xs text-text-muted">{categoryProducts.length} {t.inventory.products.toLowerCase()}</p>
                  </div>
                  <button 
                    onClick={handleBack}
                    className="text-xs font-medium text-primary hover:text-primary/80"
                  >
                    {t.common.back}
                  </button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.product}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">SKU</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.stock}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.minStock}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.value}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryProducts.map(product => (
                      <tr key={product.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-sm font-medium text-text-primary">{product.name}</td>
                        <td className="px-5 py-3 text-sm text-right font-mono text-text-muted">{product.sku}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-sm font-mono font-medium ${product.stock <= product.minStock ? 'text-orange-600' : 'text-text-primary'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-mono text-text-muted">{product.minStock}</td>
                        <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">${(product.stock * product.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'lowstock' && (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-red-50">
              <h3 className="text-sm font-semibold text-red-700">{t.inventory.lowStockProducts} ({lowStockProducts.length})</h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="px-5 py-10 text-center text-text-muted">
                {t.inventory.noLowStock}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.product}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.currentStock}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.minStock}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.needed}</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(product => (
                    <tr key={product.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-text-primary">{product.name}</p>
                        <p className="text-xs text-text-muted">{product.sku}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-mono font-bold ${product.stock <= product.minStock * 0.5 ? 'text-red-600' : 'text-orange-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-text-muted">{product.minStock}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-red-600 font-medium">
                        +{Math.max(0, product.minStock - product.stock)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'reorder' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.lowStock}</p>
                <p className="text-2xl font-bold text-orange-600 font-mono">{lowStockProducts.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.outOfStock}</p>
                <p className="text-2xl font-bold text-red-600 font-mono">{outOfStockProducts.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-orange-50">
                <h3 className="text-sm font-semibold text-orange-700">{t.inventory.reorderList} ({reorderProducts.length})</h3>
              </div>
              {reorderProducts.length === 0 ? (
                <div className="px-5 py-10 text-center text-text-muted">
                  {t.inventory.noReorder}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.product}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.stock}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.reorderQty}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase">{t.inventory.estimated}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderProducts.map(product => {
                      const reorderQty = Math.max(10, product.minStock * 2 - product.stock);
                      const estimated = reorderQty * product.costPrice;
                      return (
                        <tr key={product.id} className="border-b border-border last:border-0">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-text-primary">{product.name}</p>
                            <p className="text-xs text-text-muted">{product.sku}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-sm font-mono font-bold ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-text-primary font-medium">{reorderQty}</td>
                          <td className="px-5 py-3 text-sm text-right font-mono text-secondary font-medium">${estimated.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;