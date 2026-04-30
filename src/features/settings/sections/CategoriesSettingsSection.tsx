import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { selectCategories, selectBrands, updateCategories, updateBrands } from '../settingsSlice';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useI18n } from '../../../i18n/I18nProvider';

const CategoriesSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const brands = useAppSelector(selectBrands);
  const t = useI18n();
  
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) return;
    
    const updated = [...categories, newCategory.trim()];
    dispatch(updateCategories(updated));
    setNewCategory('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const updated = categories.filter(c => c !== categoryToRemove);
    dispatch(updateCategories(updated));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleAddBrand = () => {
    if (!newBrand.trim()) return;
    if (brands.includes(newBrand.trim())) return;
    
    const updated = [...brands, newBrand.trim()];
    dispatch(updateBrands(updated));
    setNewBrand('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleRemoveBrand = (brandToRemove: string) => {
    const updated = brands.filter(b => b !== brandToRemove);
    dispatch(updateBrands(updated));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleBrandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBrand();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{t.settings.categoriesSettings}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {t.settings.categoriesSettingsDesc}
        </p>
      </div>

      {/* Existing categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <div
            key={category}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-text-primary"
          >
            <span>{category}</span>
            <button
              type="button"
              onClick={() => handleRemoveCategory(category)}
              className="ml-1 text-text-muted hover:text-error transition-colors"
              title={t.common.delete}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new category */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder={t.settings.addCategoryPlaceholder}
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleAddCategory}
          disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
        >
          {t.common.add}
        </Button>
      </div>

      
      <div className="border-t border-border pt-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Brands</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Product brands for identification
          </p>
        </div>

        
        <div className="flex flex-wrap gap-2 mb-3">
          {brands.map(brand => (
            <div
              key={brand}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700"
            >
              <span>{brand}</span>
              <button
                type="button"
                onClick={() => handleRemoveBrand(brand)}
                className="ml-1 text-blue-400 hover:text-error transition-colors"
                title={t.common.delete}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Add brand (e.g. Coca-Cola)"
              value={newBrand}
              onChange={e => setNewBrand(e.target.value)}
              onKeyDown={handleBrandKeyDown}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleAddBrand}
            disabled={!newBrand.trim() || brands.includes(newBrand.trim())}
          >
            {t.common.add}
          </Button>
        </div>
      </div>

      {savedFeedback && (
        <span className="text-xs text-green-600 font-medium">{t.common.save}</span>
      )}
    </div>
  );
};

export default CategoriesSettingsSection;