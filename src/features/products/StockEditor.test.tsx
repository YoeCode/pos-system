import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StockEditor from './StockEditor';
import type { StockEditorProps } from './StockEditor';
import settingsReducer from '../settings/settingsSlice';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { Product, ProductSize, ProductVariant } from '../../types';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: vi.fn(() => false),
}));

const defaultSettings = settingsReducer(undefined, { type: '@@INIT' });

function createTestStore(role: 'admin' | 'cashier' = 'admin') {
  const authReducer = (state = {
    user: { id: 'u1', tenantId: 'test-tenant', name: 'Test', email: 'test@test.com', role: role as 'admin' | 'cashier', pin: '1234' },
    isAuthenticated: true,
    error: null as string | null,
    isLoading: false,
  }) => state;
  return configureStore({
    reducer: { settings: settingsReducer, auth: authReducer },
    preloadedState: {
      settings: { ...defaultSettings, language: { language: 'en' as const } },
    },
  });
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Tee',
    sku: 'TEE-1',
    category: 'Apparel',
    price: 20,
    costPrice: 10,
    stock: 12,
    minStock: 2,
    status: 'active',
    publishedOnline: false,
    hasVariants: false,
    variantAttributes: [],
    ...overrides,
  };
}

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'v1',
    productId: 'p1',
    sku: 'TEE-1-RED',
    price: 20,
    costPrice: null,
    stock: 5,
    minStock: 1,
    image: null,
    attributes: { Color: 'Red' },
    status: 'active',
    ...overrides,
  };
}

interface RenderedHandlers {
  onSizeFieldChange: Mock<(index: number, field: 'stock' | 'minStock', value: number) => void>;
  onUpdateSize: Mock<(size: ProductSize) => Promise<void>>;
  onUpdateStock: Mock<(stock: number, minStock: number) => Promise<void>>;
  onAddVariant: Mock<(variant: Omit<ProductVariant, 'id'>) => Promise<void>>;
  onUpdateVariant: Mock<(variant: ProductVariant) => Promise<void>>;
  onDeleteVariant: Mock<(variantId: string) => Promise<void>>;
}

/**
 * Stateful harness mirroring the panel: size edits buffer through
 * onSizeFieldChange (like FormState.sizes) before being committed.
 */
const StockEditorHarness: React.FC<{
  handlers: RenderedHandlers;
  initialSizes: ProductSize[];
  product: Product;
  isEditing: boolean;
  variantAttributes: StockEditorProps['variantAttributes'];
  attributes: StockEditorProps['attributes'];
}> = ({ handlers, initialSizes, ...props }) => {
  const [sizes, setSizes] = useState<ProductSize[]>(initialSizes);
  const onSizeFieldChange = (index: number, field: 'stock' | 'minStock', value: number) => {
    handlers.onSizeFieldChange(index, field, value);
    setSizes(prev => prev.map((s, i) => (i === index ? (field === 'stock' ? { ...s, stock: value } : { ...s, minStock: value }) : s)));
  };
  return (
    <StockEditor
      {...props}
      sizes={sizes}
      onSizeFieldChange={onSizeFieldChange}
      onUpdateSize={handlers.onUpdateSize}
      onUpdateStock={handlers.onUpdateStock}
      onAddVariant={handlers.onAddVariant}
      onUpdateVariant={handlers.onUpdateVariant}
      onDeleteVariant={handlers.onDeleteVariant}
    />
  );
};

function renderEditor(props: Partial<StockEditorProps> = {}, role: 'admin' | 'cashier' = 'admin'): RenderedHandlers {
  const handlers: RenderedHandlers = {
    onSizeFieldChange: vi.fn<(index: number, field: 'stock' | 'minStock', value: number) => void>(),
    onUpdateSize: vi.fn<(size: ProductSize) => Promise<void>>(async () => {}),
    onUpdateStock: vi.fn<(stock: number, minStock: number) => Promise<void>>(async () => {}),
    onAddVariant: vi.fn<(variant: Omit<ProductVariant, 'id'>) => Promise<void>>(async () => {}),
    onUpdateVariant: vi.fn<(variant: ProductVariant) => Promise<void>>(async () => {}),
    onDeleteVariant: vi.fn<(variantId: string) => Promise<void>>(async () => {}),
  };
  const product = props.product ?? makeProduct();
  const store = createTestStore(role);
  render(
    <Provider store={store}>
      <I18nProvider>
        <StockEditorHarness
          handlers={handlers}
          initialSizes={props.sizes ?? product.sizes ?? []}
          product={product}
          isEditing={props.isEditing ?? false}
          variantAttributes={props.variantAttributes ?? []}
          attributes={props.attributes ?? []}
        />
      </I18nProvider>
    </Provider>
  );
  return handlers;
}

describe('StockEditor — plain products (stock + min_stock)', () => {
  it('persists stock and min_stock through the rich inline form', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({ product: makeProduct({ stock: 12, minStock: 2 }) });

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const stockInput = screen.getByRole('spinbutton', { name: 'Stock' });
    await user.clear(stockInput);
    await user.type(stockInput, '25');
    const minStockInput = screen.getByRole('spinbutton', { name: 'Min. Stock' });
    await user.clear(minStockInput);
    await user.type(minStockInput, '4');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(handlers.onUpdateStock).toHaveBeenCalledWith(25, 4);
  });

  it('cancel closes the form without persisting anything', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({ product: makeProduct({ stock: 12, minStock: 2 }) });

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const stockInput = screen.getByRole('spinbutton', { name: 'Stock' });
    await user.clear(stockInput);
    await user.type(stockInput, '99');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(handlers.onUpdateStock).not.toHaveBeenCalled();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders the "—" fallback when product:edit is missing', () => {
    renderEditor({ product: makeProduct() }, 'cashier');
    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('StockEditor — legacy size rows', () => {
  const sizes: ProductSize[] = [
    { size: 'S', stock: 5, minStock: 1 },
    { size: 'M', stock: 7, minStock: 1 },
  ];

  it('edits a size row through the form and routes it to the size persistence path', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({ product: makeProduct({ sizes }), sizes });

    const menus = screen.getAllByRole('button', { name: 'Actions' });
    await user.click(menus[1]);
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Size: M')).toBeInTheDocument();

    const stockInput = screen.getByRole('spinbutton', { name: 'Stock' });
    await user.clear(stockInput);
    await user.type(stockInput, '3');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(handlers.onSizeFieldChange).toHaveBeenCalledWith(1, 'stock', 3);
    expect(handlers.onUpdateSize).toHaveBeenCalledWith({ size: 'M', stock: 3, minStock: 1 });
  });

  it('cancel restores the original row values without persisting', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({ product: makeProduct({ sizes }), sizes });

    const menus = screen.getAllByRole('button', { name: 'Actions' });
    await user.click(menus[1]);
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const stockInput = screen.getByRole('spinbutton', { name: 'Stock' });
    await user.clear(stockInput);
    await user.type(stockInput, '3');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(handlers.onSizeFieldChange).toHaveBeenCalledWith(1, 'stock', 7);
    expect(handlers.onSizeFieldChange).toHaveBeenCalledWith(1, 'minStock', 1);
    expect(handlers.onUpdateSize).not.toHaveBeenCalled();
  });

  it('keeps the amber low-stock cue on rows at or below min stock', () => {
    const lowSizes: ProductSize[] = [{ size: 'S', stock: 0, minStock: 2 }];
    renderEditor({ product: makeProduct({ sizes: lowSizes }), sizes: lowSizes });
    expect(screen.getByText('0')).toHaveClass('text-amber-600');
  });
});

describe('StockEditor — variant rows (existing variant capabilities)', () => {
  const variantProduct = () =>
    makeProduct({
      hasVariants: true,
      variantAttributes: ['Color'],
      variants: [makeVariant()],
      stock: 5,
    });
  const attributes = [{ id: 'a1', name: 'Color', values: ['Red', 'Blue'] }];

  it('updates a variant and keeps the inherit-from-parent price semantics', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({
      product: variantProduct(),
      variantAttributes: ['Color'],
      attributes,
    });

    await user.click(screen.getByRole('button', { name: 'acciones' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit variant')).toBeInTheDocument();

    const priceInput = screen.getByPlaceholderText('Inherits from parent: $20.00');
    await user.clear(priceInput);
    const stockInput = screen.getByDisplayValue('5');
    await user.clear(stockInput);
    await user.type(stockInput, '4');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(handlers.onUpdateVariant).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v1', sku: 'TEE-1-RED', price: null, stock: 4 })
    );
  });

  it('adds a variant through the rich form', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({
      product: variantProduct(),
      isEditing: true,
      variantAttributes: ['Color'],
      attributes,
    });

    await user.click(screen.getByRole('button', { name: '+ Add variant' }));

    expect(screen.getByText('New variant')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'TEE-1-BLUE');
    const spinbuttons = screen.getAllByRole('spinbutton');
    await user.clear(spinbuttons[2]);
    await user.type(spinbuttons[2], '2');

    await user.click(screen.getByRole('button', { name: 'Create variant' }));

    expect(handlers.onAddVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'p1',
        sku: 'TEE-1-BLUE',
        price: null,
        costPrice: null,
        stock: 2,
        minStock: 0,
        attributes: {},
        status: 'active',
      })
    );
  });

  it('deletes a variant from the row menu', async () => {
    const user = userEvent.setup();
    const handlers = renderEditor({
      product: variantProduct(),
      variantAttributes: ['Color'],
      attributes,
    });

    await user.click(screen.getByRole('button', { name: 'acciones' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(handlers.onDeleteVariant).toHaveBeenCalledWith('v1');
  });
});
