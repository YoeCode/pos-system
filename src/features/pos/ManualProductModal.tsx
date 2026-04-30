import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { useAppSelector } from '../../app/store';
import { selectCategories, selectBrands } from '../settings/settingsSlice';

interface ManualProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: { name: string; category: string; brand?: string; price: number }) => void;
}

const ManualProductModal: React.FC<ManualProductModalProps> = ({ isOpen, onClose, onAdd }) => {
  const t = useI18n();
  const categories = useAppSelector(selectCategories);
  const brands = useAppSelector(selectBrands);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !category) return;
    
    onAdd({
      name: name.trim(),
      category,
      brand: brand || undefined,
      price: parseFloat(price),
    });
    
    setName('');
    setCategory(categories[0] || '');
    setBrand('');
    setPrice('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setCategory(categories[0] || '');
    setBrand('');
    setPrice('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t.settings.addManualProduct}
      subtitle={t.settings.addManualProduct}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.settings.productName} <span className="text-text-muted/50 normal-case">(opcional)</span>
          </label>
          <Input
            placeholder={t.settings.productNamePlaceholder || 'Ej: Café con leche'}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.settings.selectCategory} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`
                  px-3 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200
                  ${category === cat 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-white text-text-secondary hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {brands.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Brand <span className="text-text-muted/50 normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              list="brand-options"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="Escribe o selecciona marca..."
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white placeholder:text-text-muted"
            />
            <datalist id="brand-options">
              {brands.map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.settings.productPrice} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">€</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="primary" fullWidth disabled={!price || !category}>
            {t.settings.createProduct}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualProductModal;