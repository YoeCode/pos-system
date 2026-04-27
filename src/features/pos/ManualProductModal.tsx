import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { CATEGORIES } from '../products/productsSlice';

interface ManualProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: { name: string; category: string; price: number }) => void;
}

const ManualProductModal: React.FC<ManualProductModalProps> = ({ isOpen, onClose, onAdd }) => {
  const t = useI18n();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    
    onAdd({
      name: name.trim(),
      category,
      price: parseFloat(price),
    });
    
    setName('');
    setCategory(CATEGORIES[0]);
    setPrice('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setCategory(CATEGORIES[0]);
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
            {t.settings.productName}
          </label>
          <Input
            placeholder={t.settings.productName}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.settings.selectCategory}
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.settings.productPrice}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
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
          <Button type="submit" variant="primary" fullWidth disabled={!name.trim() || !price}>
            {t.settings.createProduct}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualProductModal;