import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectProduct } from './productsSlice';
import Badge from '../../components/ui/Badge';

const PAGE_SIZE = 5;

const ProductsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, selectedProduct, searchQuery, selectedCategory, statusFilter, stockFilter, publishedFilter } = useAppSelector(state => state.products);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = items.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPublished = publishedFilter === 'all' ||
      (publishedFilter === 'published' && p.publishedOnline) ||
      (publishedFilter === 'not-published' && !p.publishedOnline);
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && p.stock > 0 && p.stock <= p.minStock) ||
      (stockFilter === 'out' && p.stock === 0) ||
      (stockFilter === 'in' && p.stock > p.minStock);
    return matchesSearch && matchesCategory && matchesStatus && matchesPublished && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, statusFilter, stockFilter, publishedFilter]);

  const categoryBadgeVariant = (cat: string): 'info' | 'success' | 'warning' | 'neutral' => {
    switch (cat) {
      case 'Electronics': return 'info';
      case 'Food': return 'success';
      case 'Drinks': return 'info';
      case 'Apparel': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Product</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">SKU</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Category</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Price</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Stock</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Min. Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paginatedItems.map(product => (
            <tr
              key={product.id}
              onClick={() => dispatch(selectProduct(selectedProduct?.id === product.id ? null : product))}
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
                    {product.version && (
                      <p className="text-xs text-text-muted">{product.version}</p>
                    )}
                  </div>
                </div>
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
                <span className={`font-mono text-sm font-semibold ${product.stock <= product.minStock ? 'text-error' : 'text-text-primary'}`}>
                  {product.stock}
                </span>
              </td>

              {/* Min. Stock */}
              <td className="py-3 px-4 text-right">
                <span className="font-mono text-sm text-text-muted">{product.minStock}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          No products match your search.
        </div>
      )}

      {/* Pagination bar */}
      {filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} products
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
