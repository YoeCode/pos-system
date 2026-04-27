import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '../../app/store';
import { addProduct, CATEGORIES, createEmptyForm, type ProductFormState } from './productsSlice';
import type { Product } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Toggle from '../../components/ui/Toggle';
import { useI18n } from '../../i18n/I18nProvider';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductCreateModal: React.FC<ProductCreateModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<ProductFormState>(createEmptyForm());
  const t = useI18n();

  const handleClose = useCallback(() => {
    setForm(createEmptyForm());
    onClose();
  }, [onClose]);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.sku.trim()) return;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      price: form.price,
      costPrice: form.costPrice,
      stock: form.stock,
      minStock: form.minStock,
      description: form.description.trim() || undefined,
      status: form.status,
      publishedOnline: form.publishedOnline,
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
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.price}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.costPrice}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costPrice}
                onChange={e => setForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.stock}</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={e => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.minStock}</label>
            <input
              type="number"
              min="0"
              value={form.minStock}
              onChange={e => setForm(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.status}</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Product['status'] }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
            >
              <option value="draft">{t.common.draft}</option>
              <option value="active">{t.common.active}</option>
              <option value="inactive">{t.common.inactive}</option>
            </select>
          </div>
          <div className="p-3 rounded-lg border border-border bg-background flex items-center">
            <Toggle
              checked={form.publishedOnline}
              onChange={val => setForm(prev => ({ ...prev, publishedOnline: val }))}
              label={t.products.publishedOnline}
              description={t.products.publishedOnline}
            />
          </div>
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
