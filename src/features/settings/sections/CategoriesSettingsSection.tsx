import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
  selectCategoryGroups,
  selectBrands,
  selectSeasons,
  selectSizes,
  selectSizeGroups,
  addCategoryAsync,
  removeCategoryAsync,
  updateCategoryAsync,
  syncCategoriesToSupabase,
  addBrandAsync,
  removeBrandAsync,
  addSeasonAsync,
  removeSeasonAsync,
  addSizeAsync,
  removeSizeAsync,
  addSizeGroupAsync,
  updateSizeGroupAsync,
  removeSizeGroupAsync,
} from '../settingsSlice';
import {
  fetchProductAttributesAsync,
  addProductAttributeAsync,
  updateProductAttributeAsync,
  removeProductAttributeAsync,
} from '../../products/productsSlice';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useI18n } from '../../../i18n/useI18n';
import { useToast } from '../../../components/useToast';
import type { SizeGroup, CategoryGroup } from '../../../types';

const CategoriesSettingsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const categoryGroups = useAppSelector(selectCategoryGroups);
  const brands = useAppSelector(selectBrands);
  const seasons = useAppSelector(selectSeasons);
  const sizes = useAppSelector(selectSizes);
  const sizeGroups = useAppSelector(selectSizeGroups);
  const tenantId = useAppSelector(state => state.auth.user?.tenantId);
  const t = useI18n();
  const { addToast } = useToast();

  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newSeason, setNewSeason] = useState('');
  const [newSize, setNewSize] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Category expansion and subcategory input state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [subcategoryInputs, setSubcategoryInputs] = useState<Record<string, string>>({});

  // Inline rename state
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Size groups state
  const [showSizeGroupForm, setShowSizeGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SizeGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Attributes state
  const attributes = useAppSelector(state => state.products.attributes);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [editingAttrValues, setEditingAttrValues] = useState<Record<string, string>>({});

  const showSavedFeedback = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categoryGroups.some(g => g.name === newCategory.trim())) return;
    if (!tenantId) return;

    try {
      await dispatch(addCategoryAsync({ tenantId, name: newCategory.trim(), subcategories: [] })).unwrap();
      setNewCategory('');
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error saving category', 'error');
    }
  };

  const handleRemoveCategory = async (categoryToRemove: string) => {
    if (!tenantId) return;

    try {
      await dispatch(removeCategoryAsync({ tenantId, name: categoryToRemove })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error removing category', 'error');
    }
  };

  const handleStartRename = (categoryName: string) => {
    setRenamingCategory(categoryName);
    setRenameValue(categoryName);
  };

  const handleCancelRename = () => {
    setRenamingCategory(null);
    setRenameValue('');
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === oldName) {
      handleCancelRename();
      return;
    }
    if (categoryGroups.some(g => g.name === trimmed)) {
      addToast(t.settings.categoryExists || 'A category with this name already exists', 'error');
      return;
    }
    if (!tenantId) return;

    try {
      await dispatch(updateCategoryAsync({ tenantId, oldName, newName: trimmed })).unwrap();
      setRenamingCategory(null);
      setRenameValue('');
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error renaming category', 'error');
    }
  };

  const toggleExpand = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const buildSyncedCategories = (
    source: CategoryGroup[],
    categoryName: string,
    updater: (group: CategoryGroup) => CategoryGroup
  ): CategoryGroup[] => {
    return source.map(group =>
      group.name === categoryName ? updater(group) : group
    );
  };

  const handleAddSubcategory = async (categoryName: string) => {
    const inputValue = (subcategoryInputs[categoryName] || '').trim();
    if (!inputValue || !tenantId) return;

    const group = categoryGroups.find(g => g.name === categoryName);
    if (!group) return;
    if (group.subcategories.includes(inputValue)) return;

    const updated = buildSyncedCategories(categoryGroups, categoryName, g => ({
      ...g,
      subcategories: [...g.subcategories, inputValue],
    }));

    try {
      await dispatch(syncCategoriesToSupabase({ tenantId, categories: updated })).unwrap();
      setSubcategoryInputs(prev => ({ ...prev, [categoryName]: '' }));
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error adding subcategory', 'error');
    }
  };

  const handleRemoveSubcategory = async (categoryName: string, subcategoryToRemove: string) => {
    if (!tenantId) return;

    const updated = buildSyncedCategories(categoryGroups, categoryName, g => ({
      ...g,
      subcategories: g.subcategories.filter(s => s !== subcategoryToRemove),
    }));

    try {
      await dispatch(syncCategoriesToSupabase({ tenantId, categories: updated })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error removing subcategory', 'error');
    }
  };

  const handleSubcategoryKeyDown = (e: React.KeyboardEvent, categoryName: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubcategory(categoryName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;
    if (brands.includes(newBrand.trim())) return;
    if (!tenantId) return;

    try {
      await dispatch(addBrandAsync({ tenantId, name: newBrand.trim() })).unwrap();
      setNewBrand('');
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error saving brand', 'error');
    }
  };

  const handleRemoveBrand = async (brandToRemove: string) => {
    if (!tenantId) return;

    try {
      await dispatch(removeBrandAsync({ tenantId, name: brandToRemove })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error removing brand', 'error');
    }
  };

  const handleBrandKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBrand();
    }
  };

  const handleAddSeason = async () => {
    if (!newSeason.trim()) return;
    if (seasons.includes(newSeason.trim())) return;
    if (!tenantId) return;

    try {
      await dispatch(addSeasonAsync({ tenantId, name: newSeason.trim() })).unwrap();
      setNewSeason('');
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error saving season', 'error');
    }
  };

  const handleRemoveSeason = async (seasonToRemove: string) => {
    if (!tenantId) return;

    try {
      await dispatch(removeSeasonAsync({ tenantId, name: seasonToRemove })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error removing season', 'error');
    }
  };

  const handleSeasonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSeason();
    }
  };

  const handleAddSize = async () => {
    if (!newSize.trim()) return;
    if (sizes.includes(newSize.trim())) return;
    if (!tenantId) return;

    try {
      await dispatch(addSizeAsync({ tenantId, name: newSize.trim() })).unwrap();
      setNewSize('');
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error saving size', 'error');
    }
  };

  const handleRemoveSize = async (sizeToRemove: string) => {
    if (!tenantId) return;

    try {
      await dispatch(removeSizeAsync({ tenantId, name: sizeToRemove })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error removing size', 'error');
    }
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

  const handleSaveGroup = async () => {
    if (!groupName.trim() || selectedSizes.length === 0 || !tenantId) return;

    try {
      if (editingGroup) {
        await dispatch(updateSizeGroupAsync({ tenantId, group: { id: editingGroup.id, name: groupName.trim(), sizes: selectedSizes } })).unwrap();
      } else {
        await dispatch(addSizeGroupAsync({ tenantId, group: { id: `custom-${Date.now()}`, name: groupName.trim(), sizes: selectedSizes } })).unwrap();
      }
      setShowSizeGroupForm(false);
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error saving size group', 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!tenantId) return;

    try {
      await dispatch(removeSizeGroupAsync({ tenantId, id: groupId })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : t.common.error || 'Error removing size group', 'error');
    }
  };

  const handleAddAttribute = async () => {
    if (!newAttrName.trim() || !tenantId) return;
    const values = newAttrValues.split(',').map(v => v.trim()).filter(Boolean);
    if (values.length === 0) return;
    try {
      await dispatch(addProductAttributeAsync({ name: newAttrName.trim(), values })).unwrap();
      setNewAttrName('');
      setNewAttrValues('');
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Error saving attribute', 'error');
    }
  };

  const handleRemoveAttribute = async (attrId: string) => {
    if (!tenantId) return;
    try {
      await dispatch(removeProductAttributeAsync(attrId)).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Error removing attribute', 'error');
    }
  };

  const handleAddValue = async (attrId: string, currentValue: string[]) => {
    const newValues = editingAttrValues[attrId];
    if (!newValues?.trim() || !tenantId) return;
    const valueToAdd = newValues.trim();
    if (currentValue.includes(valueToAdd)) return;
    try {
      await dispatch(updateProductAttributeAsync({ attrId, values: [...currentValue, valueToAdd] })).unwrap();
      setEditingAttrValues(prev => ({ ...prev, [attrId]: '' }));
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Error adding value', 'error');
    }
  };

  const handleRemoveValue = async (attrId: string, currentValue: string[], valueToRemove: string) => {
    if (!tenantId) return;
    try {
      await dispatch(updateProductAttributeAsync({ attrId, values: currentValue.filter(v => v !== valueToRemove) })).unwrap();
      showSavedFeedback();
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Error removing value', 'error');
    }
  };

  React.useEffect(() => {
    if (tenantId) {
      dispatch(fetchProductAttributesAsync());
    }
  }, [tenantId, dispatch]);

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{t.settings.categoriesSettings}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {t.settings.categoriesSettingsDesc}
        </p>
      </div>

      {/* Existing categories */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-text-primary">{t.settings.categories || 'Categorías'}</h3>
        <p className="text-xs text-text-muted mt-0.5">
          {t.settings.categoriesDesc || 'Categorías con subcategorías anidadas'}
        </p>
      </div>

      <div className="space-y-3">
        {categoryGroups.map(group => {
          const isExpanded = expandedCategories.has(group.name);
          const isRenaming = renamingCategory === group.name;
          const subcategoryInput = subcategoryInputs[group.name] || '';

          return (
            <div
              key={group.name}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(group.name)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                    title={isExpanded ? t.common.collapse || 'Collapse' : t.common.expand || 'Expand'}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isRenaming ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveRename(group.name);
                          }
                          if (e.key === 'Escape') {
                            handleCancelRename();
                          }
                        }}
                        className="text-sm py-1.5"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(group.name)}
                        className="text-green-600 hover:text-green-700"
                        title={t.common.save}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="text-text-muted hover:text-error"
                        title={t.common.cancel}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-text-primary truncate">{group.name}</span>
                      <span className="text-xs text-text-muted">
                        {group.subcategories.length} {t.settings.subcategories || 'subcategories'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  {!isRenaming && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartRename(group.name)}
                        className="p-1.5 text-text-muted hover:text-primary transition-colors"
                        title={t.common.edit}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L13.828 15H11v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(group.name)}
                        className="p-1.5 text-text-muted hover:text-error transition-colors"
                        title={t.common.delete}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H6a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-white space-y-3">
                  {group.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {group.subcategories.map(subcategory => (
                        <div
                          key={subcategory}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-text-primary"
                        >
                          <span>{subcategory}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(group.name, subcategory)}
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
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={t.settings.addSubcategoryPlaceholder || 'New subcategory...'}
                        value={subcategoryInput}
                        onChange={e => setSubcategoryInputs(prev => ({ ...prev, [group.name]: e.target.value }))}
                        onKeyDown={e => handleSubcategoryKeyDown(e, group.name)}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleAddSubcategory(group.name)}
                      disabled={!subcategoryInput.trim() || group.subcategories.includes(subcategoryInput.trim())}
                    >
                      {t.common.add}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
          disabled={!newCategory.trim() || categoryGroups.some(g => g.name === newCategory.trim())}
        >
          {t.common.add}
        </Button>
      </div>

      <div className="border-t border-border pt-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">{t.settings.brands || 'Brands'}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t.settings.brandsDesc || 'Product brands for identification'}
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
              placeholder={t.settings.addBrandPlaceholder || 'Add brand (e.g. Coca-Cola)'}
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
          <h3 className="text-sm font-semibold text-text-primary">{t.settings.seasons || 'Seasons'}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t.settings.seasonsDesc || 'Product seasons or collections'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {seasons.map(season => (
            <div
              key={season}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-full text-sm text-amber-700"
            >
              <span>{season}</span>
              <button
                type="button"
                onClick={() => handleRemoveSeason(season)}
                className="ml-1 text-amber-400 hover:text-error transition-colors"
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
              placeholder={t.settings.addSeasonPlaceholder || 'Add season (e.g. Summer 2026)'}
              value={newSeason}
              onChange={e => setNewSeason(e.target.value)}
              onKeyDown={handleSeasonKeyDown}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleAddSeason}
            disabled={!newSeason.trim() || seasons.includes(newSeason.trim())}
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
                placeholder={t.settings.sizeGroupNamePlaceholder || 'Group name (e.g. T-Shirts)'}
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

      <div className="border-t border-border pt-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-text-primary">{t.settings.variantAttributes || 'Atributos de Variante'}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {t.settings.variantAttributesDesc || 'Define los atributos para variantes de productos (Color, Talla, Material)'}
          </p>
        </div>

        {attributes.map(attr => (
          <div key={attr.id} className="border border-border rounded-lg mb-3 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-sm font-medium text-text-primary">{attr.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttribute(attr.id)}
                className="p-1.5 text-text-muted hover:text-error transition-colors"
                title={t.common.delete}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H6a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-white space-y-3">
              <div className="flex flex-wrap gap-2">
                {attr.values.map(value => (
                  <div
                    key={value}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full text-sm text-green-700"
                  >
                    <span>{value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(attr.id, attr.values, value)}
                      className="ml-1 text-green-400 hover:text-error transition-colors"
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
                <Input
                  placeholder={t.settings.addValuePlaceholder || 'Nuevo valor...'}
                  value={editingAttrValues[attr.id] || ''}
                  onChange={e => setEditingAttrValues(prev => ({ ...prev, [attr.id]: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValue(attr.id, attr.values);
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleAddValue(attr.id, attr.values)}
                  disabled={!editingAttrValues[attr.id]?.trim() || attr.values.includes(editingAttrValues[attr.id].trim())}
                >
                  {t.common.add}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={t.settings.addAttributeNamePlaceholder || 'Nombre del atributo (ej: Color)'}
              value={newAttrName}
              onChange={e => setNewAttrName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder={t.settings.addAttributeValuePlaceholder || 'Valores (separados por coma)'}
              value={newAttrValues}
              onChange={e => setNewAttrValues(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAttribute();
                }
              }}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleAddAttribute}
            disabled={!newAttrName.trim() || !newAttrValues.trim() || attributes.some(a => a.name === newAttrName.trim())}
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
