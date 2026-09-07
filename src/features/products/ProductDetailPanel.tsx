import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateProductAsync, deleteProductAsync, selectProduct, type ProductFormState, selectStockMovementsForProduct, createProductVariantAsync, updateProductVariantAsync, deleteProductVariantAsync, fetchProductVariantsAsync, fetchProductAttributesAsync } from './productsSlice';
import type { ProductVariant, Product, Employee } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { selectCategories, selectCategoryGroups, selectBrands, selectSeasons } from '../../features/settings/settingsSlice';
import Button from '../../components/ui/Button';
import PinAuthModal from '../pos/PinAuthModal';
import { useToast } from '../../components/useToast';
import { useI18n } from '../../i18n/useI18n';
import StockHistory from './StockHistory';
import DeleteConfirmModal from './DeleteConfirmModal';
import StatusField from './StatusField';
import PricingFields from './PricingFields';
import ImageSection from './ImageSection';
import PublishToggle from './PublishToggle';
import StockSection from './StockSection';
import ProductBasicFields from './ProductBasicFields';
import VariantsSection from './VariantsSection';

interface ProductDetailPanelProps {
  onDuplicate?: (form: ProductFormState) => void;
}

interface FormState {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  season: string;
  brand: string;
  price: number;
  costPrice: number;
  stock: number;
  description: string;
  publishedOnline: boolean;
  status: Product['status'];
  version: string;
  image: string;
  hasVariants: boolean;
  variantAttributes: string[];
}

const ProductDetailPanel: React.FC<ProductDetailPanelProps> = ({ onDuplicate }) => {
  const dispatch = useAppDispatch();
  const product = useAppSelector(state => state.products.selectedProduct);
  const movements = useAppSelector(state => product ? selectStockMovementsForProduct(state, product.id) : []);
  const { hasPermission } = usePermission();
  const categories = useAppSelector(selectCategories);
  const categoryGroups = useAppSelector(selectCategoryGroups);
  const brands = useAppSelector(selectBrands);
  const seasons = useAppSelector(selectSeasons);
  const { addToast } = useToast();
  const t = useI18n();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const attributes = useAppSelector(state => state.products.attributes);

  const [form, setForm] = useState<FormState>({
    id: '',
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    season: '',
    brand: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    description: '',
    publishedOnline: false,
    status: 'active',
    version: '',
    image: '',
    hasVariants: false,
    variantAttributes: [],
  });

  const [snapshot, setSnapshot] = useState<FormState | null>(null);
  const variantsSnapshot = useRef<ProductVariant[]>([]);
  const [unlockedActions, setUnlockedActions] = useState<Set<'publish'>>(new Set());
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<'publish' | null>(null);
  const [authorizedBy, setAuthorizedBy] = useState<Employee | null>(null);

  const subcategories = form.category
    ? categoryGroups.find(g => g.name === form.category)?.subcategories || []
    : [];

  useLayoutEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        subcategory: product.subcategory || '',
        season: product.season || '',
        brand: product.brand || '',
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        description: product.description || '',
        publishedOnline: product.publishedOnline,
        status: product.status,
        version: product.version || '',
        image: product.image || '',
        hasVariants: product.hasVariants || false,
        variantAttributes: product.variantAttributes || [],
      });
      if (product.hasVariants) {
        dispatch(fetchProductVariantsAsync(product.id));
      }
      dispatch(fetchProductAttributesAsync());
    }
    setIsEditing(false);
    setUnlockedActions(new Set());
    setAuthorizedBy(null);
    setPendingAuthAction(null);
  }, [product?.id]);

  const handleSave = useCallback(async () => {
    const oldPrice = snapshot?.price ?? product!.price;
    const oldCostPrice = snapshot?.costPrice ?? product!.costPrice;
    const priceChanged = form.price !== oldPrice;
    const costPriceChanged = form.costPrice !== oldCostPrice;

    const updated: Product = {
      ...product!,
      name: form.name,
      sku: form.sku,
      category: form.category,
      subcategory: form.subcategory || undefined,
      season: form.season || undefined,
      brand: form.brand || undefined,
      price: form.price,
      costPrice: form.costPrice,
      stock: form.stock,
      description: form.description,
      publishedOnline: form.publishedOnline,
      status: form.status,
      version: form.version,
      image: form.image || undefined,
    };
    setIsSaving(true);
    try {
      await dispatch(updateProductAsync(updated)).unwrap();

      const variants = variantsSnapshot.current;
      if ((priceChanged || costPriceChanged) && variants.length > 0) {
        for (const v of variants) {
          const matchesPrice = priceChanged && v.price === oldPrice;
          const inheritsPrice = priceChanged && v.price === null;
          const matchesCost = costPriceChanged && v.costPrice === oldCostPrice;
          const inheritsCost = costPriceChanged && v.costPrice === null;

          if (matchesPrice || inheritsPrice || matchesCost || inheritsCost) {
            const patched: ProductVariant = {
              ...v,
              price: matchesPrice ? form.price : inheritsPrice ? null : v.price,
              costPrice: matchesCost ? form.costPrice : inheritsCost ? null : v.costPrice,
            };
            await dispatch(updateProductVariantAsync(patched)).unwrap();
          }
        }
      }

      if (product?.hasVariants) {
        await dispatch(fetchProductVariantsAsync(product.id)).unwrap();
      }

      addToast('Producto actualizado correctamente', 'success');
      setIsEditing(false);
      setUnlockedActions(new Set());
      setAuthorizedBy(null);
      setPendingAuthAction(null);
    } catch {
      addToast('Error al guardar el producto', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [product, form, snapshot, dispatch, addToast]);

  const handleCancel = useCallback(() => {
    if (snapshot) setForm(snapshot);
    setIsEditing(false);
    setUnlockedActions(new Set());
    setAuthorizedBy(null);
    setPendingAuthAction(null);
  }, [snapshot]);

  const handleEdit = useCallback(() => {
    setSnapshot({ ...form });
    variantsSnapshot.current = product?.variants ? [...product.variants] : [];
    setIsEditing(true);
  }, [form, product?.variants]);

  const handleAddVariant = async (variant: Omit<ProductVariant, 'id'>) => {
    if (!product) return;
    try {
      await dispatch(createProductVariantAsync(variant)).unwrap();
      addToast('Variante creada correctamente', 'success');
    } catch {
      addToast('Error al crear la variante', 'error');
    }
  };

  const handleUpdateVariant = async (variant: ProductVariant) => {
    try {
      await dispatch(updateProductVariantAsync(variant)).unwrap();
      addToast('Variante actualizada correctamente', 'success');
    } catch {
      addToast('Error al actualizar la variante', 'error');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      await dispatch(deleteProductVariantAsync(variantId)).unwrap();
      addToast('Variante eliminada correctamente', 'success');
    } catch {
      addToast('Error al eliminar la variante', 'error');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setShowDeleteConfirm(false);
    try {
      await dispatch(deleteProductAsync(product.id)).unwrap();
      dispatch(selectProduct(null));
      addToast('Producto eliminado correctamente', 'success');
    } catch {
      addToast('Error al eliminar el producto', 'error');
    }
  };

  const requestAuth = (action: 'publish') => {
    setPendingAuthAction(action);
    setShowPinModal(true);
  };

  const handleAuthSuccess = (employee: Employee) => {
    if (pendingAuthAction) {
      setUnlockedActions(prev => new Set(prev).add(pendingAuthAction));
    }
    setAuthorizedBy(employee);
    setShowPinModal(false);
    setPendingAuthAction(null);
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const statusLabel = form.status === 'active' ? t.products.detail.active : form.status === 'inactive' ? t.products.detail.inactive : t.products.detail.draft;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 's') {
        e.preventDefault();
        if (isEditing && hasPermission('product:edit') && !isSaving) {
          handleSave();
        }
      }

      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (showPinModal) {
          setShowPinModal(false);
          setPendingAuthAction(null);
        } else if (isEditing) {
          handleCancel();
        }
      }

      if (isMod && e.key === 'e') {
        e.preventDefault();
        if (!isEditing && hasPermission('product:edit')) {
          handleEdit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isSaving, showDeleteConfirm, showPinModal, hasPermission, handleSave, handleCancel, handleEdit]);

  if (!product) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-xl border border-border">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <h3 className="text-xl font-bold text-text-primary">{t.products.detail.title}</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>{t.common.cancel}</Button>
            {hasPermission('product:edit') && (
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? t.products.detail.saving : t.common.save}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {hasPermission('product:create') && onDuplicate && (
              <button
                onClick={() => {
                  const dupForm: ProductFormState = {
                    name: `${product.name} ${t.products.detail.copy}`,
                    sku: `${product.sku}${t.products.detail.copySuffix}`,
                    category: product.category,
                    subcategory: product.subcategory ?? '',
                    season: product.season ?? '',
                    brand: product.brand || '',
                    price: product.price,
                    costPrice: product.costPrice,
                    stock: product.stock,
                    minStock: product.minStock,
                    description: product.description || '',
                    publishedOnline: product.publishedOnline,
                    status: product.status,
                    sizes: product.sizes ? product.sizes.map(s => ({ ...s })) : [],
                    hasSizes: !!(product.sizes && product.sizes.length > 0),
                    sizeGroupId: product.sizeGroupId || '',
                    hasVariants: false,
                    variantAttributes: [],
                  };
                  onDuplicate(dupForm);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 10h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.products.detail.duplicate}
              </button>
            )}
            {hasPermission('product:edit') && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t.common.edit}
              </button>
            )}
            {hasPermission('product:delete') && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-error border border-error rounded-lg hover:bg-error/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t.common.delete}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5 overflow-y-auto">
        <ImageSection isEditing={isEditing} image={form.image} onImageChange={img => setForm(prev => ({ ...prev, image: img }))} />

        <ProductBasicFields
          isEditing={isEditing}
          name={form.name}
          description={form.description}
          sku={form.sku}
          category={form.category}
          subcategory={form.subcategory}
          season={form.season}
          brand={form.brand}
          onFieldChange={handleFieldChange}
          categories={categories}
          subcategories={subcategories}
          seasons={seasons}
          brands={brands}
        />

        <PricingFields
          isEditing={isEditing}
          price={form.price}
          costPrice={form.costPrice}
          onPriceChange={v => setForm(prev => ({ ...prev, price: v }))}
          onCostPriceChange={v => setForm(prev => ({ ...prev, costPrice: v }))}
        />

        <StockSection
          stock={product.stock}
          stockLabel={t.products.detail.stockLevel}
        />

        <VariantsSection
          product={product}
          isEditing={isEditing}
          variantAttributes={form.variantAttributes}
          attributes={attributes}
          onAddVariant={handleAddVariant}
          onUpdateVariant={handleUpdateVariant}
          onDeleteVariant={handleDeleteVariant}
        />

        <StatusField
          isEditing={isEditing}
          status={form.status}
          statusLabel={statusLabel}
          onStatusChange={s => setForm(prev => ({ ...prev, status: s }))}
        />

        <PublishToggle
          isEditing={isEditing}
          publishedOnline={form.publishedOnline}
          onToggle={v => setForm(prev => ({ ...prev, publishedOnline: v }))}
          isPublishUnlocked={unlockedActions.has('publish')}
          authorizedBy={authorizedBy}
          onRequestAuth={() => requestAuth('publish')}
        />
      </div>

      <StockHistory movements={movements} />

      <PinAuthModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPendingAuthAction(null); }}
        onSuccess={handleAuthSuccess}
        title={t.products.detail.publishToOnline}
        description={t.products.detail.publishDescription}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default ProductDetailPanel;
