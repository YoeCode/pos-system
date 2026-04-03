import React from 'react';
import { useAppSelector } from '../../app/store';
import CategoryPills from '../../features/pos/CategoryPills';
import ProductCard from '../../features/pos/ProductCard';
import Cart from '../../features/pos/Cart';

const POSPage: React.FC = () => {
  const { selectedCategory } = useAppSelector(state => state.pos);
  const products = useAppSelector(state => state.products.items);

  const filtered = selectedCategory === 'All Items'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left: product area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Category pills */}
        <div className="px-6 pt-5 pb-3">
          <CategoryPills />
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="text-text-muted text-sm">No products in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <Cart />
    </div>
  );
};

export default POSPage;
