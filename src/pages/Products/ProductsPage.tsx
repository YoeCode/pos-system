import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { setSearchQuery, setSelectedCategory, setStatusFilter, setStockFilter, setPublishedFilter, setBrandFilter, selectProduct, createProductAsync, processDeliveryNoteAsync } from '../../features/products/productsSlice';
import { selectCategories, selectPosSettings } from '../../features/settings/settingsSlice';
import ProductsTable from '../../features/products/ProductsTable';
import ProductDetailPanel from '../../features/products/ProductDetailPanel';
import ProductCreateModal from '../../features/products/ProductCreateModal';
import DeliveryNoteReviewModal from '../../features/products/DeliveryNoteReviewModal';
import type { DeliveryAction } from '../../features/products/DeliveryNoteReviewModal';
import { processDeliveryNote, processDeliveryNoteVision, assignCategories } from '../../features/products/deliveryNoteService';
import type { ParsedDeliveryNote } from '../../features/products/deliveryNoteService';
import StockAlertBanner from '../../components/StockAlertBanner';
import Button from '../../components/ui/Button';
import { usePermission } from '../../hooks/usePermission';
import { useI18n } from '../../i18n/useI18n';
import type { ProductFormState } from '../../features/products/productsSlice';
import type { Product } from '../../types';
// Tesseract is loaded dynamically to reduce initial bundle size

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchQuery, selectedCategory, selectedProduct, statusFilter, stockFilter, publishedFilter, brandFilter } = useAppSelector(state => state.products);
  const categories = useAppSelector(selectCategories);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [duplicatingProduct, setDuplicatingProduct] = useState<ProductFormState | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const { hasPermission } = usePermission();
  const t = useI18n();

  const handleCloseProduct = () => {
    dispatch(selectProduct(null));
  };

  const handleDuplicate = (form: ProductFormState) => {
    setDuplicatingProduct(form);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setDuplicatingProduct(null);
  };

  const allItems = useAppSelector(state => state.products.items);
  const posSettings = useAppSelector(selectPosSettings);
  const tenantId = useAppSelector(state => state.auth.user?.tenantId);
  const [parsedNote, setParsedNote] = useState<ParsedDeliveryNote | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isProcessingDelivery, setIsProcessingDelivery] = useState(false);

  const handleExportCsv = useCallback(() => {
    const headers = ['name', 'sku', 'category', 'brand', 'price', 'costPrice', 'stock', 'minStock', 'status', 'publishedOnline'];
    const rows = allItems.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      p.price,
      p.costPrice,
      p.stock,
      p.minStock,
      p.status,
      p.publishedOnline ? 'true' : 'false',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [allItems]);

  const handleImportCsv = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const headerMap: Record<string, number> = {};
      headers.forEach((h, i) => { headerMap[h] = i; });

      const rows = lines.slice(1);
      let imported = 0;
      rows.forEach(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = cols[headerMap['name']];
        const sku = cols[headerMap['sku']];
        if (!name || !sku) return;

        const newProduct: Product = {
          id: crypto.randomUUID(),
          name,
          sku,
          category: cols[headerMap['category']] || 'Uncategorized',
          brand: cols[headerMap['brand']] || undefined,
          price: parseFloat(cols[headerMap['price']]) || 0,
          costPrice: parseFloat(cols[headerMap['costPrice']]) || 0,
          stock: parseInt(cols[headerMap['stock']]) || 0,
          minStock: parseInt(cols[headerMap['minStock']]) || 0,
          status: (cols[headerMap['status']] as Product['status']) || 'draft',
          publishedOnline: cols[headerMap['publishedOnline']]?.toLowerCase() === 'true',
          hasVariants: false,
          variantAttributes: [],
        };
        dispatch(createProductAsync(newProduct));
        imported++;
      });
      alert(`Imported ${imported} products.`);
    };
    reader.readAsText(file);
  }, [dispatch]);

  const handleDeliveryNoteUpload = useCallback(async (file: File) => {
    if (!tenantId) return;
    setIsProcessingDelivery(true);
    let rawResult: ParsedDeliveryNote | null = null;

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const hasEnoughText = text && text.trim().length >= 50;

      if (hasEnoughText) {
        try {
          rawResult = await processDeliveryNote(text, tenantId);
        } catch {
          rawResult = null;
        }
      }

      const textFailed = !hasEnoughText || !rawResult || rawResult.error || !rawResult.items || rawResult.items.length === 0;

      if (textFailed) {
        try {
          rawResult = await processDeliveryNoteVision(file, tenantId);
        } catch {
          alert(`No se pudo procesar este documento.\n\nEl OCR local (Tesseract) extrajo texto ilegible (${text?.length || 0} caracteres de basura), y el análisis visual (IA) también falló.\n\nEste tipo de documento digital con tablas complejas puede requerir:\n1. Exportar a PDF y subir el PDF (próximamente)\n2. Usar una foto más nítida del documento impreso\n3. Escanear el documento en lugar de fotografiarlo`);
          setIsProcessingDelivery(false);
          return;
        }
      }

      if (!rawResult || rawResult.error || !rawResult.items || rawResult.items.length === 0) {
        alert(`Error: ${rawResult?.error || 'No se pudo procesar el albarán'}`);
        return;
      }

      const result = assignCategories(rawResult, categories);
      setParsedNote(result);
      setIsReviewOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process delivery note');
    } finally {
      setIsProcessingDelivery(false);
    }
  }, [tenantId, categories]);

  const handleDeliveryNoteConfirm = useCallback((actions: DeliveryAction[]) => {
    const restocks = actions
      .filter(a => a.type === 'restock' && a.matchedProduct)
      .map(a => ({
        productId: a.matchedProduct!.id,
        quantity: a.quantity,
        costPrice: a.costPrice ?? undefined,
      }));

    const creates = actions
      .filter(a => a.type === 'create')
      .map(a => {
        const item = a.parsedItem;
        const newProduct: Product = {
          id: crypto.randomUUID(),
          name: item.nombre,
          sku: item.referenciaProveedor || `ALB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: item.categoria || 'Uncategorized',
          brand: item.marca || undefined,
          price: 0,
          costPrice: item.precioCoste || 0,
          stock: a.quantity,
          minStock: 0,
          description: `Imported from delivery note. Supplier ref: ${item.referenciaProveedor || 'N/A'}`,
          status: 'draft',
          publishedOnline: false,
          hasVariants: false,
          variantAttributes: [],
        };
        return newProduct;
      });

    dispatch(processDeliveryNoteAsync({ restocks, creates }));
    setIsReviewOpen(false);
    setParsedNote(null);
    alert(`Processed: ${restocks.length} restocked, ${creates.length} created.`);
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFiltersCount = [
    statusFilter !== 'all',
    stockFilter !== 'all',
    publishedFilter !== 'all',
    brandFilter !== 'all',
  ].filter(Boolean).length;

return (
    <div className="flex flex-col">
      {selectedProduct ? (
        <div className="flex-1 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-body-md">
            <button
              onClick={handleCloseProduct}
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-[10px] hover:bg-surface-container-low"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-text-muted">Productos</span>
            <span className="text-text-muted">/</span>
            <span className="font-medium text-primary">{selectedProduct.name}</span>
          </div>
          <ProductDetailPanel onDuplicate={handleDuplicate} />
        </div>
      ) : (
        <>
          <StockAlertBanner />
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
            {/* Header */}
            <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-headline-lg text-text-primary tracking-tight">{t.products.title}</h1>
                  <span className="text-label-md text-text-muted bg-surface-container px-2.5 py-1 rounded-full border border-border">
                    {allItems.length} productos registrados
                  </span>
                </div>
                <p className="text-body-sm text-text-muted mt-1">Catálogo maestro, control de tarifas e inventario.</p>
              </div>
              {hasPermission('product:create') && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-import"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImportCsv(file);
                      (e.target as HTMLInputElement).value = '';
                    }}
                  />
                  <label htmlFor="csv-import" className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-white border border-border hover:bg-surface-container-low text-text-primary text-label-md font-semibold rounded-[10px] active:scale-95 transition-all shadow-card">
                    <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Importar CSV
                  </label>
                  {posSettings.enableAiDeliveryNote && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="delivery-note-upload"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleDeliveryNoteUpload(file);
                          (e.target as HTMLInputElement).value = '';
                        }}
                      />
                      <label
                        htmlFor="delivery-note-upload"
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-white border border-border hover:bg-surface-container-low text-text-primary text-label-md font-semibold rounded-[10px] active:scale-95 transition-all shadow-card ${isProcessingDelivery ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {isProcessingDelivery ? 'Procesando...' : 'Escanear albarán'}
                      </label>
                    </>
                  )}
                  <Button variant="secondary" size="md" onClick={handleExportCsv}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar
                  </Button>
                  <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                    <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.products.addProduct}
                  </Button>
                </div>
              )}
            </section>

            {/* Search and Filter Bar */}
            <section className="bg-white rounded-xl p-3.5 border border-border shadow-card space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    placeholder={t.products.searchPlaceholder}
                    value={searchQuery}
                    onChange={e => dispatch(setSearchQuery(e.target.value))}
                    className="w-full h-12 pl-11 pr-4 bg-background rounded-[10px] border border-border text-body-md text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => dispatch(setSelectedCategory(e.target.value))}
                  className="h-12 px-3.5 text-body-md bg-white border border-border rounded-[10px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                >
                  <option value="All">{t.products.allCategories}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div ref={filterRef} className="relative">
                  <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="inline-flex items-center justify-center gap-2 px-4 h-12 bg-white border border-border hover:bg-surface-container-low text-text-primary text-label-md font-semibold rounded-[10px] active:scale-95 transition-all"
                  >
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    {t.common.filter}
                    {activeFiltersCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-label-sm flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {isFiltersOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-modal border border-border z-20 p-5 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md text-text-muted">{t.products.status}</label>
                        <select
                          value={statusFilter}
                          onChange={e => dispatch(setStatusFilter(e.target.value))}
                          className="w-full h-11 px-3.5 text-body-md bg-white border border-border rounded-[10px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                        >
                          <option value="all">{t.common.all}</option>
                          <option value="active">{t.common.active}</option>
                          <option value="inactive">{t.common.inactive}</option>
                          <option value="draft">{t.common.draft}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md text-text-muted">{t.products.stock}</label>
                        <select
                          value={stockFilter}
                          onChange={e => dispatch(setStockFilter(e.target.value))}
                          className="w-full h-11 px-3.5 text-body-md bg-white border border-border rounded-[10px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                        >
                          <option value="all">{t.common.all}</option>
                          <option value="in">{t.products.inStock}</option>
                          <option value="low">{t.products.lowStock}</option>
                          <option value="out">{t.products.outOfStock}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-label-md text-text-muted">{t.products.publishedOnline}</label>
                        <select
                          value={publishedFilter}
                          onChange={e => dispatch(setPublishedFilter(e.target.value))}
                          className="w-full h-11 px-3.5 text-body-md bg-white border border-border rounded-[10px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors"
                        >
                          <option value="all">{t.common.all}</option>
                          <option value="published">Publicados</option>
                          <option value="not-published">No publicados</option>
                        </select>
                      </div>

                      {activeFiltersCount > 0 && (
                        <button
                          onClick={() => {
                            dispatch(setStatusFilter('all'));
                            dispatch(setStockFilter('all'));
                            dispatch(setPublishedFilter('all'));
                            dispatch(setBrandFilter('all'));
                          }}
                          className="text-body-sm text-primary hover:text-primary-dark font-medium transition-colors text-left"
                        >
                          {t.common.clearFilters}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Products Table */}
            <div className="flex-1">
              <ProductsTable />
            </div>
          </div>
        </>
      )}

      <ProductCreateModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} initialForm={duplicatingProduct || undefined} />

      <DeliveryNoteReviewModal
        isOpen={isReviewOpen}
        onClose={() => { setIsReviewOpen(false); setParsedNote(null); }}
        parsedNote={parsedNote}
        onConfirm={handleDeliveryNoteConfirm}
      />
    </div>
  );
};

export default ProductsPage;
