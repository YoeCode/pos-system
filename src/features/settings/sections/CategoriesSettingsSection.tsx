import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { selectCategories, selectBrands, selectSizes, selectSizeGroups, updateCategories, updateBrands, updateSizes, addSizeGroup, updateSizeGroup, removeSizeGroup } from '../settingsSlice';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useI18n } from '../../../i18n/I18nProvider';
import type { SizeGroup } from '../../../types';

const CategoriesSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const brands = useAppSelector(selectBrands);
  const sizes = useAppSelector(selectSizes);
  const sizeGroups = useAppSelector(selectSizeGroups);
  const t = useI18n();
  
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSize, setNewSize] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Size groups state
  const [showSizeGroupForm, setShowSizeGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SizeGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

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

  const handleAddSize = () => {
    if (!newSize.trim()) return;
    if (sizes.includes(newSize.trim())) return;
    
    const updated = [...sizes, newSize.trim()];
    dispatch(updateSizes(updated));
    setNewSize('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    const updated = sizes.filter(s => s !== sizeToRemove);
    dispatch(updateSizes(updated));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleSizeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSize();
    }
  };

  const toggleSizeInGroup = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const openNewGroupForm = () => {
    setEditingGroup(null);
    setGroupName('');
    setSelectedSizes([]);
    setShowSizeGroupForm(true);
  };

  const openEditGroupForm = (group: SizeGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedSizes([...group.sizes]);
    setShowSizeGroupForm(true);
  };

  const handleSaveGroup = () => {
    if (!groupName.trim() || selectedSizes.length === 0) return;
    
    if (editingGroup) {
      dispatch(updateSizeGroup({ id: editingGroup.id, name: groupName.trim(), sizes: selectedSizes }));
    } else {
      dispatch(addSizeGroup({ id: `custom-${Date.now()}`, name: groupName.trim(), sizes: selectedSizes }));
    }
    
    setShowSizeGroupForm(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleDeleteGroup = (groupId: string) => {
    dispatch(removeSizeGroup(groupId));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
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

      <div className="border-t border-border pt-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">{t.settings.sizes || 'Sizes'}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t.settings.sizesDesc || 'Available sizes for products (S, M, L, 38, 40...)'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {sizes.map(size => (
            <div
              key={size}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 rounded-full text-sm text-purple-700"
            >
              <span>{size}</span>
              <button
                type="button"
                onClick={() => handleRemoveSize(size)}
                className="ml-1 text-purple-400 hover:text-error transition-colors"
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
              placeholder={t.settings.addSizePlaceholder || 'Add size (e.g. M, 38)'}
              value={newSize}
              onChange={e => setNewSize(e.target.value)}
              onKeyDown={handleSizeKeyDown}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleAddSize}
            disabled={!newSize.trim() || sizes.includes(newSize.trim())}
          >
            {t.common.add}
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{t.settings.sizeGroups || 'Size Groups'}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {t.settings.sizeGroupsDesc || 'Create groups of sizes for different product types'}
            </p>
          </div>
          <Button variant="secondary" onClick={openNewGroupForm} className="text-xs px-3 py-1.5">
            {t.common.add}
          </Button>
        </div>

        {showSizeGroupForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="mb-3">
              <Input
                placeholder={t.settings.sizeGroupNamePlaceholder || 'Group name (e.g. Camisetas)'}
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="mb-3">
              <p className="text-xs text-text-muted mb-2">{t.settings.selectSizes || 'Select sizes:'}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSizeInGroup(size)}
                    className={
                      selectedSizes.includes(size)
                        ? 'px-3 py-1.5 bg-primary text-white rounded-full text-xs font-medium'
                        : 'px-3 py-1.5 bg-white border border-border text-text-primary rounded-full text-xs'
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSaveGroup} disabled={!groupName.trim() || selectedSizes.length === 0}>
                {t.common.save}
              </Button>
              <Button variant="secondary" onClick={() => setShowSizeGroupForm(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sizeGroups.map(group => (
            <div key={group.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <span className="text-sm font-medium text-text-primary">{group.name}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {group.sizes.map(size => (
                    <span key={size} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEditGroupForm(group)}
                  className="p-1.5 text-text-muted hover:text-primary"
                  title={t.common.edit}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L13.828 15H11v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1.5 text-text-muted hover:text-error"
                  title={t.common.delete}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H6a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {savedFeedback && (
        <span className="text-xs text-green-600 font-medium">{t.common.save}</span>
      )}
    </div>
  );
};

export default CategoriesSettingsSection;