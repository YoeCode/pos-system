import React, { useState, useCallback, useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { createEmptyForm, addProduct, fetchProductAttributesAsync, type ProductFormState } from './productsSlice';
import { nextSku, createProduct, createProductVariant } from './productsService';
import { selectSizeGroups, selectCategoryGroups, selectCategories, selectBrands, selectSeasons } from '../settings/settingsSlice';
import type { Product, ProductVariant } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/useI18n';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialForm?: ProductFormState;
}

type ProductCreateFormState = ProductFormState & {
  autoGenerateSku: boolean;
};

interface VariantCombination {
  attributes: Record<string, string>;
  stock: number;
  minStock: number;
}

interface AttributeSlot {
  attributeName: string;
  selectedValues: string[];
}

function generateCombinations(slots: AttributeSlot[]): VariantCombination[] {
  const validSlots = slots.filter(s => s.attributeName && s.selectedValues.length > 0);
  if (validSlots.length === 0) return [];

  const result: VariantCombination[][] = [[]];
  for (const slot of validSlots) {
    const newResult: VariantCombination[][] = [];
    for (const existing of result) {
      for (const value of slot.selectedValues) {
        newResult.push([...existing, { attributes: { [slot.attributeName]: value }, stock: 0, minStock: 0 }]);
      }
    }
    result.splice(0, result.length, ...newResult);
  }

  return result.map(combos => {
    const merged: Record<string, string> = {};
    combos.forEach(c => Object.assign(merged, c.attributes));
    return { attributes: merged, stock: 0, minStock: 0 };
  });
}

function createEmptyProductForm(categories: string[]): ProductCreateFormState {
  const base = createEmptyForm();
  return {
    ...base,
    category: categories[0] ?? '',
    brand: '',
    season: '',
    autoGenerateSku: true,
  };
}

function normalizeInitialForm(form: ProductFormState | undefined, categories: string[]): ProductCreateFormState {
  if (!form) return createEmptyProductForm(categories);
  return {
    ...createEmptyProductForm(categories),
    ...form,
    autoGenerateSku: !form.sku,
  };
}

const ProductCreateModal: React.FC<ProductCreateModalProps> = ({ isOpen, onClose, initialForm }) => {
  const dispatch = useAppDispatch();
  const sizeGroups = useAppSelector(selectSizeGroups);
  const categoryGroups = useAppSelector(selectCategoryGroups);
  const categories = useAppSelector(selectCategories);
  const brands = useAppSelector(selectBrands);
  const seasons = useAppSelector(selectSeasons);
  const attributes = useAppSelector(state => state.products.attributes);
  const tenantId = useAppSelector(state => state.auth.user?.tenantId);
  const [form, setForm] = useState<ProductCreateFormState>(() => createEmptyProductForm(categories));
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attributeSlots, setAttributeSlots] = useState<AttributeSlot[]>([
    { attributeName: '', selectedValues: [] },
    { attributeName: '', selectedValues: [] },
  ]);
  const t = useI18n();

  // Build attribute values map from attributes
  const attributeValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    attributes.forEach(attr => {
      map[attr.name] = attr.values;
    });
    return map;
  }, [attributes]);

  // Auto-generate combinations when attribute slots change
  useMemo(() => {
    if (form.hasVariants) {
      const combos = generateCombinations(attributeSlots);
      setVariantCombinations(combos);
    } else {
      setVariantCombinations([]);
    }
  }, [form.hasVariants, attributeSlots]);

  useLayoutEffect(() => {
    if (isOpen) {
      setForm(normalizeInitialForm(initialForm, categories));
      setVariantCombinations([]);
      setAttributeSlots([
        { attributeName: '', selectedValues: [] },
        { attributeName: '', selectedValues: [] },
      ]);
      dispatch(fetchProductAttributesAsync());
    }
  }, [isOpen, initialForm, categories, dispatch]);

  const handleClose = useCallback(() => {
    setForm(createEmptyProductForm(categories));
    setVariantCombinations([]);
    setAttributeSlots([
      { attributeName: '', selectedValues: [] },
      { attributeName: '', selectedValues: [] },
    ]);
    onClose();
  }, [onClose, categories]);

  // Get available attributes for a slot (exclude attributes used in other slots)
  const getAvailableAttributes = useCallback((slotIndex: number) => {
    const usedInOtherSlots = attributeSlots
      .filter((_, i) => i !== slotIndex)
      .map(s => s.attributeName)
      .filter(Boolean);
    return attributes.filter(attr => !usedInOtherSlots.includes(attr.name));
  }, [attributes, attributeSlots]);

  // Update attribute slot
  const updateAttributeSlot = useCallback((slotIndex: number, attributeName: string) => {
    setAttributeSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = { attributeName, selectedValues: [] };
      return newSlots;
    });
  }, []);

  // Toggle value in attribute slot
  const toggleAttributeValue = useCallback((slotIndex: number, value: string) => {
    setAttributeSlots(prev => {
      const newSlots = [...prev];
      const slot = newSlots[slotIndex];
      const newValues = slot.selectedValues.includes(value)
        ? slot.selectedValues.filter(v => v !== value)
        : [...slot.selectedValues, value];
      newSlots[slotIndex] = { ...slot, selectedValues: newValues };
      return newSlots;
    });
  }, []);

  // Select/deselect all values for a slot
  const toggleAllValues = useCallback((slotIndex: number) => {
    setAttributeSlots(prev => {
      const newSlots = [...prev];
      const slot = newSlots[slotIndex];
      const allValues = attributeValuesMap[slot.attributeName] || [];
      const allSelected = allValues.length === slot.selectedValues.length;
      newSlots[slotIndex] = { ...slot, selectedValues: allSelected ? [] : [...allValues] };
      return newSlots;
    });
  }, [attributeValuesMap]);

  const subcategories = categoryGroups.find(g => g.name === form.category)?.subcategories ?? [];

  const missingConfig = categories.length === 0 || seasons.length === 0 || brands.length === 0;

  const isFormValid = Boolean(
    form.name.trim() &&
    (form.sku.trim() || form.autoGenerateSku) &&
    form.category &&
    categories.includes(form.category) &&
    form.season &&
    seasons.includes(form.season) &&
    form.brand &&
    brands.includes(form.brand) &&
    !missingConfig
  );

  const handleSubmit = async () => {
    let sku = form.sku.trim();
    if (!sku && form.autoGenerateSku) {
      sku = await nextSku(form.category);
    }

    if (!form.name.trim() || !sku || !form.category || !form.season || !form.brand) return;

    const variantAttrNames = attributeSlots
      .filter(s => s.attributeName && s.selectedValues.length > 0)
      .map(s => s.attributeName);

    const stock = form.hasVariants
      ? variantCombinations.reduce((sum, v) => sum + v.stock, 0)
      : form.hasSizes 
        ? form.sizes.reduce((sum, s) => sum + s.stock, 0)
        : form.stock;
    
    const minStock = form.hasVariants
      ? variantCombinations.reduce((sum, v) => sum + v.minStock, 0)
      : form.hasSizes
        ? form.sizes.reduce((sum, s) => sum + (s.minStock || form.minStock), 0)
        : form.minStock;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      sku,
      category: form.category,
      subcategory: form.subcategory || undefined,
      season: form.season,
      brand: form.brand,
      price: form.price,
      costPrice: form.costPrice,
      stock,
      minStock,
      description: form.description.trim() || undefined,
      status: form.status,
      publishedOnline: form.publishedOnline,
      sizes: form.hasSizes ? form.sizes : undefined,
      sizeGroupId: form.sizeGroupId || undefined,
      hasVariants: form.hasVariants,
      variantAttributes: variantAttrNames,
    };

    setIsSubmitting(true);
    try {
      // Create product first
      const created = await createProduct(newProduct, tenantId || '');
      if (!created) throw new Error('Failed to create product');

      // Create variants if enabled
      if (form.hasVariants && variantCombinations.length > 0) {
        for (const combo of variantCombinations) {
          const variantSku = `${sku}-${Object.values(combo.attributes).map(v => v.substring(0, 2).toUpperCase()).join('')}`;
          const variant: Omit<ProductVariant, 'id'> = {
            productId: created.id,
            sku: variantSku,
            price: null,
            costPrice: null,
            stock: combo.stock,
            minStock: combo.minStock,
            image: null,
            attributes: combo.attributes,
            status: 'active',
          };
          await createProductVariant(tenantId || '', variant);
        }
      }

      // Add to Redux store with the created ID and variant info
      dispatch(addProduct({
        ...newProduct,
        id: created.id,
        stock,
        variants: form.hasVariants ? variantCombinations.map((c) => ({
          id: crypto.randomUUID(),
          productId: created.id,
          sku: `${sku}-${Object.values(c.attributes).map(v => v.substring(0, 2).toUpperCase()).join('')}`,
          price: null,
          costPrice: null,
          stock: c.stock,
          minStock: c.minStock,
          image: null,
          attributes: c.attributes,
          status: 'active' as const,
        })) : undefined,
      }));
      handleClose();
    } catch {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t.products.addProduct}
      subtitle={t.products.addProduct}
    >
      <div className="flex flex-col gap-5">
        {missingConfig && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Configura al menos una categoría, temporada y marca en{' '}
              <strong>Ajustes → Gestión de Productos</strong> antes de crear productos.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.products.name} <span className="text-error">*</span>
          </label>
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
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {t.products.category} <span className="text-error">*</span>
            </label>
            {categories.length === 0 ? (
              <div className="w-full px-3 py-2.5 text-sm border border-amber-300 rounded-lg bg-amber-50 text-amber-700">
                Configura categorías en Ajustes
              </div>
            ) : (
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Subcategoría</label>
            <select
              value={form.subcategory}
              disabled={!form.category || subcategories.length === 0}
              onChange={e => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white disabled:bg-gray-100 disabled:text-text-muted disabled:cursor-not-allowed"
            >
              <option value="">Sin subcategoría</option>
              {subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Temporada <span className="text-error">*</span>
            </label>
            {seasons.length === 0 ? (
              <div className="w-full px-3 py-2.5 text-sm border border-amber-300 rounded-lg bg-amber-50 text-amber-700">
                Configura temporadas en Ajustes
              </div>
            ) : (
              <select
                value={form.season}
                onChange={e => setForm(prev => ({ ...prev, season: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                <option value="">Seleccionar temporada</option>
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Marca <span className="text-error">*</span>
            </label>
            {brands.length === 0 ? (
              <div className="w-full px-3 py-2.5 text-sm border border-amber-300 rounded-lg bg-amber-50 text-amber-700">
                Configura marcas en Ajustes
              </div>
            ) : (
              <select
                value={form.brand}
                onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                <option value="">Seleccionar marca</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.products.sku} <span className="text-error">*</span>
          </label>
          <Input
            placeholder="e.g. PR-001"
            value={form.sku}
            disabled={form.autoGenerateSku}
            onChange={e => setForm(prev => ({ ...prev, sku: e.target.value }))}
            className="font-mono disabled:bg-gray-100 disabled:text-text-muted"
          />
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={form.autoGenerateSku}
              onChange={e => setForm(prev => ({ ...prev, autoGenerateSku: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">Autogenerar código</span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasSizes}
              disabled={form.hasVariants}
              onChange={e => setForm(prev => ({ 
                ...prev, 
                hasSizes: e.target.checked,
                sizes: e.target.checked ? [{ size: '', stock: 0, minStock: 0 }] : []
              }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
            />
            <span className={`text-sm font-medium ${form.hasVariants ? 'text-text-muted' : 'text-text-primary'}`}>{t.inventory.size}</span>
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

        {/* Variants toggle - similar to hasSizes toggle */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasVariants}
              onChange={e => setForm(prev => ({
                ...prev,
                hasVariants: e.target.checked,
                hasSizes: e.target.checked ? false : prev.hasSizes,
              }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">{t.settings.productHasVariants || 'Tiene variantes'}</span>
          </label>
          {form.hasVariants && (
            <div className="pl-6 flex flex-col gap-4">
              {attributeSlots.map((slot, slotIndex) => (
                <AttributeSlotSelector
                  key={slotIndex}
                  slotIndex={slotIndex}
                  slot={slot}
                  availableAttributes={getAvailableAttributes(slotIndex)}
                  attributeValuesMap={attributeValuesMap}
                  onUpdateAttribute={updateAttributeSlot}
                  onToggleValue={toggleAttributeValue}
                  onToggleAll={toggleAllValues}
                />
              ))}

              {/* Variant combinations preview */}
              {variantCombinations.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-border">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Combinaciones ({variantCombinations.length})
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {attributeSlots.filter(s => s.attributeName).map(s => (
                            <th key={s.attributeName} className="px-3 py-2 text-left text-xs font-semibold text-text-muted uppercase">
                              {s.attributeName}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-right text-xs font-semibold text-text-muted uppercase w-20">
                            Stock
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantCombinations.map((combo, idx) => (
                          <tr key={idx} className="border-b border-border last:border-b-0">
                            {attributeSlots.filter(s => s.attributeName).map(s => (
                              <td key={s.attributeName} className="px-3 py-2 text-text-primary">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                                  {combo.attributes[s.attributeName]}
                                </span>
                              </td>
                            ))}
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                value={combo.stock}
                                onChange={e => {
                                  const newCombos = [...variantCombinations];
                                  newCombos[idx] = { ...newCombos[idx], stock: parseInt(e.target.value) || 0 };
                                  setVariantCombinations(newCombos);
                                }}
                                className="w-16 px-2 py-1 text-xs border border-border rounded text-text-primary font-mono text-right"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 bg-gray-50 border-t border-border">
                    <p className="text-xs text-text-muted">
                      Stock total: {variantCombinations.reduce((sum, v) => sum + v.stock, 0)} unidades
                    </p>
                  </div>
                </div>
              )}
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
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (t.common.saving || 'Guardando...') : t.common.add}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface AttributeSlotSelectorProps {
  slotIndex: number;
  slot: AttributeSlot;
  availableAttributes: { id: string; name: string; values: string[] }[];
  attributeValuesMap: Record<string, string[]>;
  onUpdateAttribute: (slotIndex: number, attributeName: string) => void;
  onToggleValue: (slotIndex: number, value: string) => void;
  onToggleAll: (slotIndex: number) => void;
}

const AttributeSlotSelector: React.FC<AttributeSlotSelectorProps> = ({
  slotIndex,
  slot,
  availableAttributes,
  attributeValuesMap,
  onUpdateAttribute,
  onToggleValue,
  onToggleAll,
}) => {
  const [showValuesDropdown, setShowValuesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const values = attributeValuesMap[slot.attributeName] || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowValuesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        Atributo {slotIndex + 1}
      </label>
      <div className="flex gap-3">
        {/* Attribute selector */}
        <select
          value={slot.attributeName}
          onChange={e => onUpdateAttribute(slotIndex, e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-text-primary bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        >
          <option value="">Seleccionar atributo...</option>
          {availableAttributes.map(attr => (
            <option key={attr.id} value={attr.name}>{attr.name}</option>
          ))}
        </select>

        {/* Values multi-select */}
        {slot.attributeName && (
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowValuesDropdown(!showValuesDropdown)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary bg-white text-left focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {slot.selectedValues.length === 0
                ? 'Seleccionar valores...'
                : slot.selectedValues.length === values.length
                  ? `Todos (${values.length})`
                  : `${slot.selectedValues.length} de ${values.length} seleccionados`
              }
            </button>
            {showValuesDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-border">
                  <input
                    type="checkbox"
                    checked={values.length > 0 && values.length === slot.selectedValues.length}
                    onChange={() => onToggleAll(slotIndex)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-text-muted">Seleccionar todos</span>
                </label>
                {values.map(value => (
                  <label key={value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slot.selectedValues.includes(value)}
                      onChange={() => onToggleValue(slotIndex, value)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text-primary">{value}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCreateModal;
