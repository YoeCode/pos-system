import React from 'react';
import { useI18n } from '../../i18n/useI18n';

interface ProductBasicFieldsProps {
  isEditing: boolean;
  name: string;
  description: string;
  sku: string;
  category: string;
  subcategory: string;
  season: string;
  brand: string;
  onFieldChange: (field: string, value: string) => void;
  categories: string[];
  subcategories: string[];
  seasons: string[];
  brands: string[];
}

const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({
  isEditing,
  name,
  description,
  sku,
  category,
  subcategory,
  season,
  brand,
  onFieldChange,
  categories,
  subcategories,
  seasons,
  brands,
}) => {
  const t = useI18n();

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.productName}</label>
        {isEditing ? (
          <input
            value={name}
            onChange={e => onFieldChange('name', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        ) : (
          <p className="text-sm text-text-primary py-2">{name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.description}</label>
        {isEditing ? (
          <textarea
            value={description}
            onChange={e => onFieldChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
          />
        ) : (
          <p className="text-sm text-text-muted py-2">{description || '—'}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">SKU</label>
          {isEditing ? (
            <input
              value={sku}
              onChange={e => onFieldChange('sku', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          ) : (
            <p className="text-sm font-mono text-text-primary py-2">{sku}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.category}</label>
          {isEditing ? (
            categories.length === 0 ? (
              <div className="w-full px-3 py-2.5 text-sm border border-amber-300 rounded-lg bg-amber-50 text-amber-700">
                {t.products.detail.configCategories}
              </div>
            ) : (
              <select
                value={category}
                onChange={e => {
                  onFieldChange('category', e.target.value);
                  onFieldChange('subcategory', '');
                }}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                <option value="">{t.products.detail.selectCategory}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )
          ) : (
            <p className="text-sm text-text-primary py-2">{category}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.subcategory}</label>
          {isEditing ? (
            <select
              value={subcategory}
              disabled={!category || subcategories.length === 0}
              onChange={e => onFieldChange('subcategory', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white disabled:bg-gray-100 disabled:text-text-muted disabled:cursor-not-allowed"
            >
              <option value="">—</option>
              {subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-text-primary py-2">{subcategory || '—'}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.season}</label>
          {isEditing ? (
            seasons.length === 0 ? (
              <div className="w-full px-3 py-2.5 text-sm border border-amber-300 rounded-lg bg-amber-50 text-amber-700">
                {t.products.detail.configSeasons}
              </div>
            ) : (
              <select
                value={season}
                onChange={e => onFieldChange('season', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                <option value="">{t.products.detail.selectSeason}</option>
                {seasons.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )
          ) : (
            <p className="text-sm text-text-primary py-2">{season || '—'}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.brand}</label>
          {isEditing ? (
            brands.length === 0 ? (
              <div className="w-full px-3 py-2.5 text-sm border border-amber-300 rounded-lg bg-amber-50 text-amber-700">
                {t.products.detail.configBrands}
              </div>
            ) : (
              <select
                value={brand}
                onChange={e => onFieldChange('brand', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                <option value="">{t.products.detail.selectBrand}</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )
          ) : (
            <p className="text-sm text-text-primary py-2">{brand || '—'}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductBasicFields;
