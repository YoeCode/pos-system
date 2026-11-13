import React, { useState, useCallback, useLayoutEffect, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { createEmptyForm, addProduct, fetchProductAttributesAsync, type ProductFormState } from './productsSlice';
import { nextSku, createProduct, createProductVariant, fetchVariantSkus } from './productsService';
import { selectSizeGroups, selectCategoryGroups, selectCategories, selectBrands, selectSeasons } from '../settings/settingsSlice';
import type { Product, ProductVariant } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n/useI18n';
import AttributeSlotSelector, { type AttributeSlot } from './AttributeSlotSelector';
import VariantCombinationsTable, { type VariantCombination } from './VariantCombinationsTable';
import TallaDimensionEditor from './TallaDimensionEditor';
import { variantSkuBase, allocateVariantSku } from './variantSku';

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialForm?: ProductFormState;
}

type ProductCreateFormState = ProductFormState & {
  autoGenerateSku: boolean;
};

const TALLA_DIMENSION = 'Talla';

function createEmptySlot(): AttributeSlot {
  return { id: crypto.randomUUID(), attributeName: '', selectedValues: [] };
}

function createTallaSlot(values: string[] = []): AttributeSlot {
  return { id: crypto.randomUUID(), attributeName: TALLA_DIMENSION, selectedValues: [...values], isTalla: true };
}

function combinationKey(attributes: Record<string, string>): string {
  return Object.keys(attributes)
    .sort()
    .map(k => `${k}\u0000${attributes[k]}`)
    .join('\u0001');
}

// Cartesian product across N dimensions. Stock entries survive regeneration
// (adding one more size keeps the stock already typed on the existing rows).
function generateCombinations(slots: AttributeSlot[], previous: VariantCombination[] = []): VariantCombination[] {
  const validSlots = slots.filter(s => s.attributeName && s.selectedValues.length > 0);
  if (validSlots.length === 0) return [];

  const acc: Record<string, string>[] = [{}];
  for (const slot of validSlots) {
    const next: Record<string, string>[] = [];
    for (const attrs of acc) {
      for (const value of slot.selectedValues) {
        next.push({ ...attrs, [slot.attributeName]: value });
      }
    }
    acc.splice(0, acc.length, ...next);
  }

  const previousByKey = new Map(previous.map(c => [combinationKey(c.attributes), c]));
  return acc.map(attributes => {
    const prev = previousByKey.get(combinationKey(attributes));
    return { attributes, stock: prev?.stock ?? 0, minStock: prev?.minStock ?? 0 };
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
  const [attributeSlots, setAttributeSlots] = useState<AttributeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [creationDone, setCreationDone] = useState(false);
  const t = useI18n();

  // Build attribute values map from attributes
  const attributeValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    attributes.forEach(attr => {
      map[attr.name] = attr.values;
    });
    return map;
  }, [attributes]);

  // Regenerate combinations whenever the dimensions change, preserving the
  // stock already typed for rows whose attributes match.
  useEffect(() => {
    setVariantCombinations(prev => generateCombinations(attributeSlots, prev));
  }, [attributeSlots]);

  useLayoutEffect(() => {
    if (isOpen) {
      const normalized = normalizeInitialForm(initialForm, categories);
      setForm(normalized);
      // Duplicating a legacy sizes product seeds the Talla dimension; its
      // per-size stock feeds the generated combinations.
      const tallaValues = normalized.sizes.map(s => s.size).filter(Boolean);
      const seededSlots = normalized.hasSizes ? [createTallaSlot(tallaValues)] : [];
      setAttributeSlots(seededSlots);
      setVariantCombinations(generateCombinations(
        seededSlots,
        normalized.sizes.map(s => ({ attributes: { [TALLA_DIMENSION]: s.size }, stock: s.stock, minStock: s.minStock ?? 0 }))
      ));
      setSubmitError(null);
      setCreationDone(false);
      dispatch(fetchProductAttributesAsync());
    }
  }, [isOpen, initialForm, categories, dispatch]);

  const handleClose = useCallback(() => {
    setForm(createEmptyProductForm(categories));
    setAttributeSlots([]);
    setVariantCombinations([]);
    setSubmitError(null);
    setCreationDone(false);
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
      newSlots[slotIndex] = { ...newSlots[slotIndex], attributeName, selectedValues: [] };
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

  // N dynamic attribute slots: add/remove freely.
  const addAttributeSlot = useCallback(() => {
    setAttributeSlots(prev => [...prev, createEmptySlot()]);
  }, []);

  const removeAttributeSlot = useCallback((slotIndex: number) => {
    setAttributeSlots(prev => prev.filter((_, i) => i !== slotIndex));
  }, []);

  // "Tallas" adds the Talla variant dimension (one more slot) instead of
  // creating product_sizes rows. It can be combined with attribute slots.
  const handleToggleTallas = (checked: boolean) => {
    if (checked) {
      setForm(prev => ({ ...prev, hasSizes: true, hasVariants: true }));
      setAttributeSlots(prev => {
        if (prev.some(s => s.isTalla)) return prev;
        // The Talla slot claims the "Talla" attribute name
        const cleared = prev.map(s =>
          s.attributeName === TALLA_DIMENSION ? { ...s, attributeName: '', selectedValues: [] } : s
        );
        return [createTallaSlot(), ...cleared];
      });
    } else {
      const remaining = attributeSlots.filter(s => !s.isTalla);
      setForm(prev => ({ ...prev, hasSizes: false, hasVariants: remaining.length > 0 }));
      setAttributeSlots(remaining);
    }
  };

  const handleToggleVariants = (checked: boolean) => {
    if (checked) {
      setForm(prev => ({ ...prev, hasVariants: true }));
      setAttributeSlots(prev => (prev.some(s => !s.isTalla) ? prev : [...prev, createEmptySlot()]));
    } else {
      setForm(prev => ({ ...prev, hasVariants: false, hasSizes: false }));
      setAttributeSlots([]);
    }
  };

  // Talla dimension values: size-group presets fill the slot, manual entry stays possible.
  const applySizePreset = (groupId: string) => {
    const group = sizeGroups.find(g => g.id === groupId);
    setForm(prev => ({ ...prev, sizeGroupId: groupId }));
    setAttributeSlots(prev =>
      prev.map(s => (s.isTalla ? { ...s, selectedValues: group ? [...group.sizes] : [] } : s))
    );
  };

  const addTallaValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAttributeSlots(prev =>
      prev.map(s =>
        s.isTalla && !s.selectedValues.includes(trimmed)
          ? { ...s, selectedValues: [...s.selectedValues, trimmed] }
          : s
      )
    );
  };

  const removeTallaValue = (value: string) => {
    setAttributeSlots(prev =>
      prev.map(s => (s.isTalla ? { ...s, selectedValues: s.selectedValues.filter(v => v !== value) } : s))
    );
  };

  const updateCombination = useCallback((index: number, next: VariantCombination) => {
    setVariantCombinations(prev => prev.map((c, i) => (i === index ? next : c)));
  }, []);

  const tallaSlot = attributeSlots.find(s => s.isTalla);
  const dimensionSlots = attributeSlots.filter(s => s.attributeName && s.selectedValues.length > 0);
  const dimensionNames = dimensionSlots.map(s => s.attributeName);

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

    const variantAttrNames = dimensionNames;
    const hasVariantDims = dimensionSlots.length > 0;

    const stock = hasVariantDims
      ? variantCombinations.reduce((sum, v) => sum + v.stock, 0)
      : form.stock;

    const minStock = hasVariantDims
      ? variantCombinations.reduce((sum, v) => sum + v.minStock, 0)
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
      // Sizes are Talla-dimension variants now - the modal never writes
      // product_sizes rows.
      sizes: undefined,
      sizeGroupId: form.sizeGroupId || undefined,
      hasVariants: hasVariantDims,
      variantAttributes: variantAttrNames,
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Create product first
      const created = await createProduct(newProduct, tenantId || '');
      if (!created) throw new Error('Failed to create product');

      // Create variants through the same service path as manual variants,
      // each with a guaranteed-unique SKU.
      const createdVariants: ProductVariant[] = [];
      const failedSkus: string[] = [];
      if (hasVariantDims && variantCombinations.length > 0) {
        const takenSkus = new Set(await fetchVariantSkus(tenantId || ''));
        for (const combo of variantCombinations) {
          const variantSku = allocateVariantSku(variantSkuBase(sku, combo.attributes, variantAttrNames), takenSkus);
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
          try {
            const saved = await createProductVariant(tenantId || '', variant);
            if (saved) createdVariants.push(saved);
            else failedSkus.push(variantSku);
          } catch {
            failedSkus.push(variantSku);
          }
        }
      }

      // Add to Redux store. Only persisted variants reach state - a failed
      // insert is reported below, never faked with a client-side UUID.
      dispatch(addProduct({
        ...newProduct,
        id: created.id,
        stock,
        variants: createdVariants.length > 0 ? createdVariants : undefined,
      }));

      if (failedSkus.length > 0) {
        setSubmitError(
          `El producto se creó, pero ${failedSkus.length} ${failedSkus.length === 1 ? 'variante no se pudo crear' : 'variantes no se pudieron crear'}: ${failedSkus.join(', ')}. Cierra y añádelas desde el panel del producto.`
        );
        setCreationDone(true);
        return;
      }
      handleClose();
    } catch {
      setSubmitError('No se pudo crear el producto. Inténtalo de nuevo.');
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
        {submitError && (
          <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

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

        {/* Tallas -> one "Talla" variant dimension */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasSizes}
              onChange={e => handleToggleTallas(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">{t.inventory.size}</span>
          </label>

          {form.hasSizes && tallaSlot && (
            <TallaDimensionEditor
              values={tallaSlot.selectedValues}
              sizeGroups={sizeGroups}
              sizeGroupId={form.sizeGroupId}
              onApplyPreset={applySizePreset}
              onAddValue={addTallaValue}
              onRemoveValue={removeTallaValue}
            />
          )}
        </div>

        {/* N dynamic attribute slots, combinable with Talla */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasVariants}
              onChange={e => handleToggleVariants(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">{t.settings.productHasVariants || 'Tiene variantes'}</span>
          </label>
          {form.hasVariants && (
            <div className="pl-6 flex flex-col gap-4">
              {attributeSlots.map((slot, slotIndex) =>
                slot.isTalla ? null : (
                  <AttributeSlotSelector
                    key={slot.id}
                    slotIndex={slotIndex}
                    slot={slot}
                    availableAttributes={getAvailableAttributes(slotIndex)}
                    attributeValuesMap={attributeValuesMap}
                    onUpdateAttribute={updateAttributeSlot}
                    onToggleValue={toggleAttributeValue}
                    onToggleAll={toggleAllValues}
                    onRemove={removeAttributeSlot}
                  />
                )
              )}
              <button
                type="button"
                onClick={addAttributeSlot}
                className="self-start text-xs text-primary hover:underline"
              >
                + Añadir atributo
              </button>
            </div>
          )}
        </div>

        {/* Variant combinations preview across N dimensions */}
        {dimensionSlots.length > 0 && (
          <VariantCombinationsTable
            combinations={variantCombinations}
            dimensionNames={dimensionNames}
            onChange={updateCombination}
          />
        )}

        <div className="flex gap-3 pt-2">
          {creationDone ? (
            <Button variant="primary" fullWidth onClick={handleClose}>
              {t.common.close}
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductCreateModal;
