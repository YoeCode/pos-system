import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setSearchQuery, setSelectedCategory } from '../../features/products/productsSlice';
import ProductsTable from '../../features/products/ProductsTable';
import ProductDetailPanel from '../../features/products/ProductDetailPanel';
import ProductCreateModal from '../../features/products/ProductCreateModal';
import Button from '../../components/ui/Button';

const CATEGORIES = ['All', 'Electronics', 'Food', 'Drinks', 'Apparel', 'Bakery', 'Merchandise'];

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchQuery, selectedCategory, selectedProduct } = useAppSelector(state => state.products);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
          <Button variant="secondary" size="sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            More Filters
          </Button>
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
