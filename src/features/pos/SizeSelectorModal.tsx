import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '../../app/store';
import { addToCart } from './posSlice';
import type { Product } from '../../types';

interface SizeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const SizeSelectorModal: React.FC<SizeSelectorModalProps> = ({ isOpen, onClose, product }) => {
  const dispatch = useAppDispatch();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setSelectedSize(null);
    onClose();
  }, [onClose]);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    dispatch(addToCart({ product, size: selectedSize }));
    handleClose();
  };

  if (!isOpen || !product.sizes) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-sm mx-0 sm:mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">{product.name}</h3>
              <p className="text-sm text-text-muted mt-0.5">Select size</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 gap-2">
            {product.sizes.map(sizeOption => {
              const isOutOfStock = sizeOption.stock === 0;
              const isSelected = selectedSize === sizeOption.size;

              return (
                <button
                  key={sizeOption.size}
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(sizeOption.size)}
                  className={`
                    relative py-3 px-2 rounded-lg text-sm font-semibold transition-all duration-150
                    ${isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSelected
                        ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                        : 'bg-white border border-border text-text-primary hover:border-primary hover:text-primary'
                    }
                  `}
                >
                  {sizeOption.size}
                  {isOutOfStock && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedSize && (
            <p className="text-xs text-text-muted mt-3 text-center">
              {product.sizes.find(s => s.size === selectedSize)?.stock} units available
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
          >
            Add to Cart — ${product.price.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeSelectorModal;
