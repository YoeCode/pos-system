import React, { useState } from 'react';
import type { Product } from '../../types';
import { useAppDispatch } from '../../app/store';
import { addToCart } from './posSlice';
import { useToast } from '../../components/useToast';
import { useI18n } from '../../i18n/useI18n';
import SizeSelectorModal from './SizeSelectorModal';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const t = useI18n();
  const [showSizeModal, setShowSizeModal] = useState(false);

  const hasSizes = product.sizes && product.sizes.length > 0;

  const isOutOfStock = !hasSizes && product.stock === 0;
  const isInactive = product.status !== 'active';

  const handleClick = () => {
    if (isInactive) {
      addToast(t.pos.inactiveProduct || 'Producto inactivo — no disponible para venta', 'error');
      return;
    }
    if (isOutOfStock) {
      addToast(`${t.pos.outOfStockAdd}: ${product.name}`, 'error');
      return;
    }
    if (hasSizes) {
      setShowSizeModal(true);
    } else {
      dispatch(addToCart({ product }));
      addToast(`${t.pos.addedToCart}: ${product.name}`, 'success');
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl border border-border overflow-hidden transition-all duration-150 ${
          isOutOfStock || isInactive
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-md cursor-pointer'
        }`}
        onClick={isOutOfStock || isInactive ? undefined : handleClick}
      >
        {/* Image area */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          {isInactive && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-500/90 text-white text-xs font-semibold rounded">
              {t.pos.inactive || 'Inactivo'}
            </div>
          )}
          {isOutOfStock && !isInactive && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-error/90 text-white text-xs font-semibold rounded">
              {t.pos.outOfStock || 'Sin stock'}
            </div>
          )}
          {!isOutOfStock && !isInactive && product.stock < 10 && !hasSizes && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-warning/90 text-white text-xs font-semibold rounded">
              {t.pos.lowStock || 'Stock bajo'}
            </div>
          )}
          {hasSizes && !isInactive && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600/90 text-white text-xs font-semibold rounded">
              {t.pos.sizes || 'Tallas'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-text-primary leading-tight line-clamp-2">{product.name}</p>
          {product.brand && (
            <p className="text-xs text-text-muted truncate">{product.brand}</p>
          )}
          {product.sku && (
            <p className="text-[11px] text-text-muted font-mono tracking-wide uppercase">{product.sku}</p>
          )}
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-sm font-semibold text-primary font-mono">€{product.price.toFixed(2)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={isOutOfStock || isInactive}
              className="w-11 h-11 bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md flex items-center justify-center transition-all duration-150 active:scale-95"
              aria-label={isOutOfStock ? `${product.name} ${t.pos.outOfStock || 'sin stock'}` : isInactive ? `${product.name} ${t.pos.inactive || 'inactivo'}` : `${t.pos.addToCart || 'Añadir'} ${product.name} ${t.pos.toCart || 'al carrito'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {hasSizes && (
        <SizeSelectorModal
          isOpen={showSizeModal}
          onClose={() => setShowSizeModal(false)}
          product={product}
        />
      )}
    </>
  );
};

export default ProductCard;
