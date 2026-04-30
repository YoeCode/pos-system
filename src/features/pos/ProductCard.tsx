import React from 'react';
import type { Product } from '../../types';
import { useAppDispatch } from '../../app/store';
import { addToCart } from './posSlice';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer">
      {/* Image area */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        {/* Low stock badge */}
        {product.stock < 10 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-error/90 text-white text-xs font-semibold rounded">
            Low Stock
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-primary leading-tight line-clamp-2">{product.name}</p>
        {product.brand && (
          <p className="text-xs text-text-muted truncate">{product.brand}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-semibold text-primary font-mono">${product.price.toFixed(2)}</span>
          <button
            onClick={() => dispatch(addToCart(product))}
            className="w-7 h-7 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center justify-center transition-all duration-150 active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
