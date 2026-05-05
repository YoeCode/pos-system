import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { useI18n } from '../../i18n/I18nProvider';
import type { Product } from '../../types';

type InventoryTab = 'summary' | 'lowstock' | 'reorder';

const getProductStock = (product: Product): number => {
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.reduce((sum, s) => sum + s.stock, 0);
  }
  return product.stock;
};

const getProductMinStock = (product: Product): number => {
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.reduce((sum, s) => sum + (s.minStock || product.minStock), 0);
  }
  return product.minStock;
};

const InventoryPage: React.FC = () => {
  const t = useI18n();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<InventoryTab>('summary');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const products = useAppSelector(state => state.products.items);

  useEffect(() => {
    const tab = searchParams.get('tab') as InventoryTab;
    if (tab && ['summary', 'lowstock', 'reorder'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'summary' as const, label: t.inventory.summary },
    { id: 'lowstock' as const, label: t.inventory.lowStock },
    { id: 'reorder' as const, label: t.inventory.reorder },
  ];

  const stockByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      const cat = product.category || 'Uncategorized';
      const totalStock = getProductStock(product);
      const totalValue = totalStock * product.price;
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalStock: 0, totalValue: 0 };
      }
      acc[cat].count += 1;
      acc[cat].totalStock += totalStock;
      acc[cat].totalValue += totalValue;
      return acc;
    }, {} as Record<string, { count: number; totalStock: number; totalValue: number }>);
  }, [products]);

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => (p.category || 'Uncategorized') === selectedCategory);
  }, [products, selectedCategory]);

  const lowStockProducts = products.filter(p => {
    const stock = getProductStock(p);
    const minStock = getProductMinStock(p);
    return stock <= minStock && stock > 0;
  });

  const outOfStockProducts = products.filter(p => getProductStock(p) === 0);
  
  const reorderProducts = products.filter(p => {
    const stock = getProductStock(p);
    const minStock = getProductMinStock(p);
    return stock <= minStock;
  });

  const totalStock = products.reduce((sum, p) => sum + getProductStock(p), 0);
  const totalValue = products.reduce((sum, p) => sum + (getProductStock(p) * p.price), 0);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const renderCategoryProducts = () => (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
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
          {categoryProducts.map(product => {
            const stock = getProductStock(product);
            const minStock = getProductMinStock(product);
            const hasSizes = product.sizes && product.sizes.length > 0;
            return (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-text-primary">{product.name}</p>
                  {hasSizes && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {product.sizes!.map(s => (
                        <span 
                          key={s.size}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            s.stock === 0 
                              ? 'bg-red-100 text-red-700' 
                              : s.stock <= (s.minStock || product.minStock) 
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-text-muted'
                          }`}
                        >
                          {s.size}: {s.stock}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-right font-mono text-text-muted">{product.sku}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`text-sm font-mono font-medium ${stock <= minStock ? 'text-orange-600' : 'text-text-primary'}`}>
                    {stock}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-right font-mono text-text-muted">{minStock}</td>
                <td className="px-5 py-3 text-sm text-right font-mono text-text-primary">${(stock * product.price).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
        {!selectedCategory && (
          <>
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
          </>
        )}

        {activeTab === 'summary' && !selectedCategory && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.totalProducts}</p>
                <p className="text-3xl font-bold text-text-primary font-mono">{products.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{t.inventory.totalStock}</p>
                <p className="text-3xl font-bold text-primary font-mono">
                  {totalStock.toLocaleString()}
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
          </>
        )}

        {activeTab === 'summary' && selectedCategory && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={handleBack}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-text-muted">/</span>
              <span className="font-medium text-text-primary">{t.inventory.title}</span>
              <span className="text-text-muted">/</span>
              <span className="text-primary">{selectedCategory}</span>
            </div>
            {renderCategoryProducts()}
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
                  {lowStockProducts.map(product => {
                    const stock = getProductStock(product);
                    const minStock = getProductMinStock(product);
                    const hasSizes = product.sizes && product.sizes.length > 0;
                    return (
                      <tr key={product.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-text-primary">{product.name}</p>
                          {hasSizes && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {product.sizes!.filter(s => s.stock <= (s.minStock || product.minStock) && s.stock > 0).map(s => (
                                <span key={s.size} className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                                  {s.size}: {s.stock}
                                </span>
                              ))}
                            </div>
                          )}
                          {!hasSizes && <p className="text-xs text-text-muted">{product.sku}</p>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-sm font-mono font-bold ${stock <= minStock * 0.5 ? 'text-red-600' : 'text-orange-600'}`}>
                            {stock}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-mono text-text-muted">{minStock}</td>
                        <td className="px-5 py-3 text-sm text-right font-mono text-red-600 font-medium">
                          +{Math.max(0, minStock - stock)}
                        </td>
                      </tr>
                    );
                  })}
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
                      const stock = getProductStock(product);
                      const minStock = getProductMinStock(product);
                      const reorderQty = Math.max(10, minStock * 2 - stock);
                      const estimated = reorderQty * product.costPrice;
                      return (
                        <tr key={product.id} className="border-b border-border last:border-0">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-text-primary">{product.name}</p>
                            <p className="text-xs text-text-muted">{product.sku}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-sm font-mono font-bold ${stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                              {stock}
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