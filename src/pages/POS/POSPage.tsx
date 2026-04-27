import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import CategoryPills from '../../features/pos/CategoryPills';
import ProductCard from '../../features/pos/ProductCard';
import Cart from '../../features/pos/Cart';
import ManualProductModal from '../../features/pos/ManualProductModal';
import { useI18n } from '../../i18n/I18nProvider';
import { addCustomProductToCart } from '../../features/pos/posSlice';
import { selectEnableManualProduct } from '../../features/settings/settingsSlice';

const POSPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedCategory } = useAppSelector(state => state.pos);
  const products = useAppSelector(state => state.products.items);
  const enableManualProduct = useAppSelector(selectEnableManualProduct);
  const t = useI18n();
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const filtered = selectedCategory === 'All Items'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleAddManualProduct = (product: { name: string; category: string; price: number }) => {
    dispatch(addCustomProductToCart(product));
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left: product area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Category pills + Manual product button */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex-1">
            <CategoryPills />
          </div>
          {enableManualProduct && (
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="ml-4 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.settings.addManualProduct}
            </button>
          )}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="text-text-muted text-sm">{t.common.noResults}</p>
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

      {/* Manual Product Modal */}
      <ManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={handleAddManualProduct}
      />
    </div>
  );
};

export default POSPage;