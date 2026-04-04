import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setSearchQuery, setSelectedCategory, setStatusFilter, setStockFilter, setPublishedFilter } from '../../features/products/productsSlice';
import ProductsTable from '../../features/products/ProductsTable';
import ProductDetailPanel from '../../features/products/ProductDetailPanel';
import ProductCreateModal from '../../features/products/ProductCreateModal';
import Button from '../../components/ui/Button';

const CATEGORIES = ['All', 'Electronics', 'Food', 'Drinks', 'Apparel', 'Bakery', 'Merchandise'];

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchQuery, selectedCategory, selectedProduct, statusFilter, stockFilter, publishedFilter } = useAppSelector(state => state.products);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFiltersCount = [
    statusFilter !== 'all',
    stockFilter !== 'all',
    publishedFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Product Catalog</h1>
            <p className="text-sm text-text-muted mt-0.5">Manage your inventory and product listings</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={e => dispatch(setSelectedCategory(e.target.value))}
            className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>

          {/* More filters */}
          <div ref={filterRef} className="relative">
            <Button variant="secondary" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              More Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {isFiltersOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-border z-20 p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => dispatch(setStatusFilter(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Stock</label>
                  <select
                    value={stockFilter}
                    onChange={e => dispatch(setStockFilter(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                  >
                    <option value="all">All</option>
                    <option value="in">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Online</label>
                  <select
                    value={publishedFilter}
                    onChange={e => dispatch(setPublishedFilter(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="not-published">Not Published</option>
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      dispatch(setStatusFilter('all'));
                      dispatch(setStockFilter('all'));
                      dispatch(setPublishedFilter('all'));
                    }}
                    className="text-xs text-primary hover:text-primary-dark font-medium transition-colors text-left"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className={`flex-1 overflow-auto bg-white ${selectedProduct ? '' : 'rounded-b-none'}`}>
          <ProductsTable />
        </div>

        {/* Detail Panel */}
        {selectedProduct && (
          <ProductDetailPanel />
        )}
      </div>

      {/* Create Modal */}
      <ProductCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};

export default ProductsPage;
