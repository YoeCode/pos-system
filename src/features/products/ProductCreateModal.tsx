import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addProduct, DEFAULT_CATEGORIES, createEmptyForm, type ProductFormState } from './productsSlice';
import { selectSizeGroups } from '../settings/settingsSlice';
import type { Product } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductCreateModal: React.FC<ProductCreateModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const sizeGroups = useAppSelector(selectSizeGroups);
  const [form, setForm] = useState<ProductFormState>(createEmptyForm());
  const t = useI18n();

  const handleClose = useCallback(() => {
    setForm(createEmptyForm());
    onClose();
  }, [onClose]);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.sku.trim()) return;

    const stock = form.hasSizes 
      ? form.sizes.reduce((sum, s) => sum + s.stock, 0)
      : form.stock;
    
    const minStock = form.hasSizes
      ? form.sizes.reduce((sum, s) => sum + (s.minStock || form.minStock), 0)
      : form.minStock;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      brand: form.brand || undefined,
      price: form.price,
      costPrice: form.costPrice,
      stock,
      minStock,
      description: form.description.trim() || undefined,
      status: form.status,
      publishedOnline: form.publishedOnline,
      sizes: form.hasSizes ? form.sizes : undefined,
      sizeGroupId: form.sizeGroupId || undefined,
    };

    dispatch(addProduct(newProduct));
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t.products.addProduct}
      subtitle={t.products.addProduct}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.name}</label>
          <Input
            placeholder="Enter product name"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.description}</label>
          <textarea
            placeholder="Brief product description"
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.sku}</label>
            <Input
              placeholder="e.g. PR-001"
              value={form.sku}
              onChange={e => setForm(prev => ({ ...prev, sku: e.target.value }))}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.category}</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
            >
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
</div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasSizes}
              onChange={e => setForm(prev => ({ 
                ...prev, 
                hasSizes: e.target.checked,
                sizes: e.target.checked ? [{ size: '', stock: 0, minStock: 0 }] : []
              }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">{t.inventory.size}</span>
          </label>

          {form.hasSizes && (
            <div className="flex flex-col gap-2 pl-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted">{t.settings.sizeGroups || 'Size Group'}</label>
                <select
                  value={form.sizeGroupId}
                  onChange={e => {
                    const groupId = e.target.value;
                    const group = sizeGroups.find(g => g.id === groupId);
                    setForm(prev => ({
                      ...prev,
                      sizeGroupId: groupId,
                      sizes: group ? group.sizes.map(size => ({ size, stock: 0, minStock: 0 })) : [{ size: '', stock: 0, minStock: 0 }]
                    }));
                  }}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                >
                  <option value="">{t.common.select || 'Select...'}</option>
                  {sizeGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              {form.sizes.map((s, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Talla"
                    value={s.size}
                    onChange={e => {
                      const newSizes = [...form.sizes];
                      newSizes[idx] = { ...newSizes[idx], size: e.target.value };
                      setForm(prev => ({ ...prev, sizes: newSizes }));
                    }}
                    className="px-2 py-2 text-sm border border-border rounded text-text-primary font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={s.stock}
                    onChange={e => {
                      const newSizes = [...form.sizes];
                      newSizes[idx] = { ...newSizes[idx], stock: parseInt(e.target.value) || 0 };
                      setForm(prev => ({ ...prev, sizes: newSizes }));
                    }}
                    className="px-2 py-2 text-sm border border-border rounded text-text-primary font-mono"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={s.minStock}
                    onChange={e => {
                      const newSizes = [...form.sizes];
                      newSizes[idx] = { ...newSizes[idx], minStock: parseInt(e.target.value) || 0 };
                      setForm(prev => ({ ...prev, sizes: newSizes }));
                    }}
                    className="px-2 py-2 text-sm border border-border rounded text-text-primary font-mono"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm(prev => ({ 
                  ...prev, 
                  sizes: [...prev.sizes, { size: '', stock: 0, minStock: 0 }] 
                }))}
                className="text-xs text-primary hover:underline"
              >
                + Añadir talla
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.sku.trim()}
          >
            {t.common.add}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductCreateModal;
