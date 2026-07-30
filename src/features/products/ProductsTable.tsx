import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectProduct } from './productsSlice';
import Badge from '../../components/ui/Badge';
import Fuse from 'fuse.js';

const PAGE_SIZE = 5;

const ProductsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, selectedProduct, searchQuery, selectedCategory, statusFilter, stockFilter, publishedFilter, brandFilter } = useAppSelector(state => state.products);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fuse = React.useMemo(() => {
    return new Fuse(items, {
      keys: ['name', 'sku', 'brand', 'category'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [items]);
  
  const searchResults = React.useMemo(() => {
    if (!searchQuery) return null;
    return new Set(fuse.search(searchQuery).map(r => r.item.id));
  }, [fuse, searchQuery]);

  const filtered = items.filter(p => {
    const matchesSearch = searchResults ? searchResults.has(p.id) : true;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPublished = publishedFilter === 'all' ||
      (publishedFilter === 'published' && p.publishedOnline) ||
      (publishedFilter === 'not-published' && !p.publishedOnline);
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && p.stock > 0 && p.stock <= p.minStock) ||
      (stockFilter === 'out' && p.stock === 0) ||
      (stockFilter === 'in' && p.stock > p.minStock);
    const matchesBrand = brandFilter === 'all' || p.brand === brandFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesPublished && matchesStock && matchesBrand;
  });

  const sorted = React.useMemo(() => {
    if (!sortColumn) return filtered;
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortColumn) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'brand':
          aVal = (a.brand || '').toLowerCase();
          bVal = (b.brand || '').toLowerCase();
          break;
        case 'sku':
          aVal = a.sku.toLowerCase();
          bVal = b.sku.toLowerCase();
          break;
        case 'category':
          aVal = a.category.toLowerCase();
          bVal = b.category.toLowerCase();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        case 'minStock':
          aVal = a.minStock;
          bVal = b.minStock;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [filtered, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedItems = sorted.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, statusFilter, stockFilter, publishedFilter, brandFilter]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortIcon = (column: string) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 text-text-muted/40 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 12V4m0 0l-4 4m4-4l4 4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 text-primary inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-primary inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const categoryBadgeVariant = (cat: string): 'info' | 'success' | 'warning' | 'neutral' => {
    switch (cat) {
      case 'Electronics': return 'info';
      case 'Food': return 'success';
      case 'Drinks': return 'info';
      case 'Apparel': return 'warning';
      default: return 'neutral';
    }
  };

  const stockStatusBadge = (stock: number, minStock: number): { variant: 'error' | 'warning' | 'success'; label: string } => {
    if (stock === 0) return { variant: 'error', label: 'Sin stock' };
    if (stock <= minStock) return { variant: 'warning', label: 'Stock bajo' };
    return { variant: 'success', label: 'OK' };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('name')}>Product{sortIcon('name')}</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('brand')}>Brand{sortIcon('brand')}</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('sku')}>SKU{sortIcon('sku')}</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('category')}>Category{sortIcon('category')}</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('price')}>Price{sortIcon('price')}</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('stock')}>Stock{sortIcon('stock')}</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors" onClick={() => handleSort('minStock')}>Min. Stock{sortIcon('minStock')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paginatedItems.map(product => {
            const displayStock = product.sizes && product.sizes.length > 0
              ? product.sizes.reduce((s, sz) => s + sz.stock, 0)
              : product.stock;

            return (
            <tr
              key={product.id}
              onClick={() => dispatch(selectProduct(product))}
              className={`cursor-pointer transition-colors ${
                selectedProduct?.id === product.id
                  ? 'bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Product */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{product.name}</p>
                    {product.brand && (
                      <p className="text-xs text-text-muted">{product.brand}</p>
                    )}
                    {product.version && (
                      <p className="text-xs text-text-muted">{product.version}</p>
                    )}
                  </div>
                </div>
              </td>

              {/* Brand */}
              <td className="py-3 px-4">
                <span className="text-xs text-text-muted">{product.brand || '—'}</span>
              </td>

              {/* SKU */}
              <td className="py-3 px-4">
                <span className="font-mono text-xs text-text-muted">{product.sku}</span>
              </td>

              {/* Category */}
              <td className="py-3 px-4">
                <Badge variant={categoryBadgeVariant(product.category)}>{product.category}</Badge>
              </td>

              {/* Price */}
              <td className="py-3 px-4 text-right">
                <span className="font-mono font-bold text-text-primary">${product.price.toFixed(2)}</span>
              </td>

              {/* Stock */}
              <td className="py-3 px-4 text-right">
                <span className={`font-mono text-sm font-semibold ${displayStock <= product.minStock ? 'text-error' : 'text-text-primary'}`}>
                  {displayStock}
                </span>
                <div className="mt-1">
                  <Badge variant={stockStatusBadge(displayStock, product.minStock).variant}>{stockStatusBadge(displayStock, product.minStock).label}</Badge>
                </div>
              </td>

              {/* Min. Stock */}
              <td className="py-3 px-4 text-right">
                <span className="font-mono text-sm text-text-muted">{product.minStock}</span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          No products match your search.
        </div>
      )}

      {/* Pagination bar */}
      {sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, sorted.length)} of {sorted.length} products
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-gray-100 transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-colors ${
                  page === currentPage ? 'bg-primary text-white' : 'text-text-muted hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-gray-100 transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
