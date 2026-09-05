import React, { useState, useCallback, useMemo } from 'react';
import { useI18n } from '../../i18n/useI18n';
import type { Product, ProductVariant } from '../../types';

interface VariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSelect: (variant: ProductVariant) => void;
}

const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({ isOpen, onClose, product, onSelect }) => {
  const t = useI18n();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const attributes = product.variantAttributes;
  const variants = useMemo(() => product.variants ?? [], [product.variants]);

  const availableValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const attr of attributes) {
      const values = new Set<string>();
      for (const v of variants) {
        if (v.attributes[attr] && v.status !== 'inactive') {
          values.add(v.attributes[attr]);
        }
      }
      map[attr] = Array.from(values);
    }
    return map;
  }, [attributes, variants]);

  const matchingVariants = useMemo(() => {
    return variants.filter(v => {
      if (v.status === 'inactive') return false;
      for (const [attr, value] of Object.entries(selectedAttributes)) {
        if (v.attributes[attr] !== value) return false;
      }
      return true;
    });
  }, [variants, selectedAttributes]);

  const selectedVariant = useMemo(() => {
    const entries = Object.entries(selectedAttributes);
    if (entries.length !== attributes.length) return null;
    return matchingVariants.find(v => {
      for (const [attr, value] of entries) {
        if (v.attributes[attr] !== value) return false;
      }
      return true;
    }) ?? null;
  }, [matchingVariants, selectedAttributes, attributes]);

  const isValueDisabled = useCallback(
    (attr: string, value: string) => {
      const testAttrs = { ...selectedAttributes, [attr]: value };
      return !variants.some(v => {
        if (v.status === 'inactive') return false;
        for (const [a, val] of Object.entries(testAttrs)) {
          if (v.attributes[a] !== val) return false;
        }
        return true;
      });
    },
    [selectedAttributes, variants]
  );

  const handleAttributeSelect = (attr: string, value: string) => {
    setSelectedAttributes(prev => {
      if (prev[attr] === value) {
        const next = { ...prev };
        delete next[attr];
        return next;
      }
      return { ...prev, [attr]: value };
    });
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    onSelect(selectedVariant);
    handleClose();
  };

  const handleClose = useCallback(() => {
    setSelectedAttributes({});
    onClose();
  }, [onClose]);

  const displayPrice = selectedVariant?.price ?? product.price;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-sm mx-0 sm:mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">{product.name}</h3>
              <p className="text-sm text-text-muted mt-0.5">Seleccionar variante</p>
            </div>
            <button
              onClick={handleClose}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
              title={t.pos.close}
              aria-label={t.pos.closeSizeSelector}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {attributes.map(attr => (
            <div key={attr}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{attr}</p>
              <div className="flex flex-wrap gap-2">
                {availableValues[attr]?.map(value => {
                  const isSelected = selectedAttributes[attr] === value;
                  const disabled = isValueDisabled(attr, value);

                  return (
                    <button
                      key={value}
                      disabled={disabled}
                      onClick={() => handleAttributeSelect(attr, value)}
                      className={`
                        relative py-3 px-2 rounded-lg text-sm font-semibold transition-all duration-150
                        ${disabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                            : 'bg-white border border-border text-text-primary hover:border-primary hover:text-primary'
                        }
                      `}
                    >
                      {value}
                      {disabled && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedVariant && (
            <div className="pt-2 border-t border-border space-y-1">
              <p className="text-xs text-text-muted">
                SKU: <span className="font-mono text-text-primary">{selectedVariant.sku}</span>
              </p>
              <p className="text-xs text-text-muted">
                {t.pos.unitsAvailable}: <span className="font-semibold text-text-primary">{selectedVariant.stock}</span>
              </p>
              <p className="text-xs text-text-muted">
                Precio: <span className="font-semibold text-text-primary">€{displayPrice.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-[0.98]"
          >
            {t.pos.addToCartPrice} — €{displayPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectorModal;
