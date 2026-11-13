import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductCreateModal from './ProductCreateModal';
import productsReducer, { createEmptyForm } from './productsSlice';
import settingsReducer from '../settings/settingsSlice';
import { I18nProvider } from '../../i18n/I18nProvider';
import { createProduct, createProductVariant, fetchVariantSkus } from './productsService';

const mockAttributes = vi.hoisted(() => [
  { id: 'attr-color', name: 'Color', values: ['Rojo', 'Rosado', 'Rosa'] },
  { id: 'attr-material', name: 'Material', values: ['Algodón', 'Poliéster'] },
  { id: 'attr-fit', name: 'Ajuste', values: ['Regular', 'Slim'] },
]);

vi.mock('./productsService', () => ({
  nextSku: vi.fn().mockResolvedValue('GEN-001'),
  fetchProducts: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn((product: any) => Promise.resolve(product)),
  updateProduct: vi.fn().mockResolvedValue(null),
  deleteProduct: vi.fn().mockResolvedValue(true),
  reduceStock: vi.fn().mockResolvedValue(true),
  restoreStock: vi.fn().mockResolvedValue(true),
  fetchProductAttributes: vi.fn().mockImplementation(() => Promise.resolve(mockAttributes)),
  createProductAttribute: vi.fn().mockResolvedValue(null),
  updateProductAttribute: vi.fn().mockResolvedValue(true),
  deleteProductAttribute: vi.fn().mockResolvedValue(true),
  fetchProductVariants: vi.fn().mockResolvedValue([]),
  // The same service path as manual variants: the returned row is what lands
  // in Redux state (id = sku keeps tests deterministic).
  createProductVariant: vi.fn((_tenantId: string, variant: any) => Promise.resolve({ id: variant.sku, ...variant })),
  updateProductVariant: vi.fn().mockResolvedValue(null),
  deleteProductVariant: vi.fn().mockResolvedValue(true),
  fetchVariantSkus: vi.fn().mockResolvedValue([]),
  updateProductSize: vi.fn().mockResolvedValue(true),
}));

const defaultSettings = settingsReducer(undefined, { type: '@@INIT' });

const mockAuthReducer = (state = {
  user: { id: 'u1', tenantId: 'test-tenant', name: 'Test', email: 'test@test.com', role: 'admin' as const, pin: '1234' },
  isAuthenticated: true,
  error: null as string | null,
  isLoading: false,
}) => state;

function createTestStore() {
  return configureStore({
    reducer: {
      products: productsReducer,
      settings: settingsReducer,
      auth: mockAuthReducer,
    },
    preloadedState: {
      settings: { ...defaultSettings, language: { language: 'en' as const } },
    },
  });
}

function renderModal(isOpen: boolean, onClose = vi.fn(), store = createTestStore()) {
  const result = render(
    <Provider store={store}>
      <I18nProvider>
        <ProductCreateModal isOpen={isOpen} onClose={onClose} />
      </I18nProvider>
    </Provider>
  );
  return { ...result, store, onClose };
}

function getSelectByLabel(labelText: string): HTMLSelectElement {
  const select = screen.getByText(labelText).parentElement?.querySelector('select');
  if (!select) throw new Error(`Select for label "${labelText}" not found`);
  return select;
}

interface FillRequiredFieldsOptions {
  name: string;
  sku: string;
  category?: string;
  season?: string;
  brand?: string;
}

// Fills every field the create form requires: name, a manual SKU
// (auto-generation toggled off), category, season and brand.
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, options: FillRequiredFieldsOptions) {
  await user.type(screen.getByPlaceholderText('Enter product name'), options.name);
  await user.click(screen.getByRole('checkbox', { name: 'Auto-generate code' }));
  await user.type(screen.getByPlaceholderText('e.g. PR-001'), options.sku);
  await user.selectOptions(getSelectByLabel('Category'), options.category ?? 'Food');
  await user.selectOptions(getSelectByLabel('Season'), options.season ?? 'Permanente');
  await user.selectOptions(getSelectByLabel('Brand'), options.brand ?? 'Nestlé');
}

// Adds manual sizes to the Talla dimension.
async function addManualSizes(user: ReturnType<typeof userEvent.setup>, sizes: string[]) {
  const sizeInput = screen.getByPlaceholderText('Size');
  for (const size of sizes) {
    await user.type(sizeInput, size);
    await user.click(screen.getByRole('button', { name: '+ Add size' }));
  }
}

// Picks values for an attribute slot from its multi-select dropdown.
async function pickSlotValues(user: ReturnType<typeof userEvent.setup>, slotLabel: string, values: string[]) {
  const select = screen.getByRole('combobox', { name: slotLabel });
  const container = select.parentElement?.parentElement;
  if (!container) throw new Error(`Slot container for "${slotLabel}" not found`);
  const valuesButton = within(container)
    .getAllByRole('button')
    .find(b => /Select values|selected|All/.test(b.textContent ?? ''));
  if (!valuesButton) throw new Error(`Values button for "${slotLabel}" not found`);
  await user.click(valuesButton);
  for (const value of values) {
    await user.click(within(container).getByRole('checkbox', { name: value }));
  }
  await user.click(document.body); // close the dropdown
}

describe('ProductCreateModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    renderModal(false);
    expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
  });

  it('renders modal with title and subtitle when open', () => {
    renderModal(true);
    expect(screen.getAllByText('Add Product').length).toBeGreaterThanOrEqual(2);
  });

  it('renders all form fields', () => {
    renderModal(true);
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief product description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. PR-001')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('has correct default values', () => {
    renderModal(true);
    const nameInput = screen.getByPlaceholderText('Enter product name');
    const skuInput = screen.getByPlaceholderText('e.g. PR-001');
    expect(nameInput).toHaveValue('');
    expect(skuInput).toHaveValue('');
  });

  it('disables create button when name or sku is empty', () => {
    renderModal(true);
    const createButton = screen.getByRole('button', { name: 'Add' });
    expect(createButton).toBeDisabled();
  });

  it('enables create button when all required fields are filled', async () => {
    const user = userEvent.setup();
    renderModal(true);
    const createButton = screen.getByRole('button', { name: 'Add' });

    expect(createButton).toBeDisabled();

    await fillRequiredFields(user, { name: 'Test Product', sku: 'TP-001' });

    expect(createButton).not.toBeDisabled();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(true, onClose);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(true, onClose);

    const backdrop = document.querySelector('.absolute.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('resets form when modal is reopened', () => {
    const store = createTestStore();
    const { rerender } = render(
      <Provider store={store}>
        <I18nProvider>
          <ProductCreateModal isOpen={false} onClose={vi.fn()} />
        </I18nProvider>
      </Provider>
    );

    rerender(
      <Provider store={store}>
        <I18nProvider>
          <ProductCreateModal isOpen={true} onClose={vi.fn()} />
        </I18nProvider>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText('Enter product name');
    const skuInput = screen.getByPlaceholderText('e.g. PR-001');
    expect(nameInput).toHaveValue('');
    expect(skuInput).toHaveValue('');
  });

  it('adds product to store on submit', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await fillRequiredFields(user, { name: 'Test Widget', sku: 'TW-100', category: 'Food' });
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'TW-100')).toBe(true);
    });

    const product = store.getState().products.items.find(p => p.sku === 'TW-100')!;
    expect(product.name).toBe('Test Widget');
    expect(product.sku).toBe('TW-100');
    expect(product.category).toBe('Food');
    expect(product.status).toBe('draft');
    expect(product.publishedOnline).toBe(false);
  });

  it('trims whitespace from name and sku before dispatch', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await fillRequiredFields(user, { name: '  Trimmed Name  ', sku: '  TW-200  ' });
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'TW-200')).toBe(true);
    });

    const product = store.getState().products.items.find(p => p.sku === 'TW-200')!;
    expect(product.name).toBe('Trimmed Name');
  });

  it('changes category selection', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Category Item');
    await user.click(screen.getByRole('checkbox', { name: 'Auto-generate code' }));
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'CI-400');

    const categorySelect = getSelectByLabel('Category');
    await user.selectOptions(categorySelect, 'Food');

    await user.selectOptions(getSelectByLabel('Season'), 'Permanente');
    await user.selectOptions(getSelectByLabel('Brand'), 'Nestlé');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'CI-400')).toBe(true);
    });

    const product = store.getState().products.items.find(p => p.sku === 'CI-400')!;
    expect(product.category).toBe('Food');
  });

  it('calls onClose and resets form after successful creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(true, onClose);

    await fillRequiredFields(user, { name: 'Final Item', sku: 'FI-700' });
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('sets description on created product', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await fillRequiredFields(user, { name: 'Described Item', sku: 'DI-800' });
    await user.type(screen.getByPlaceholderText('Brief product description'), 'A great product');

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'DI-800')).toBe(true);
    });

    const product = store.getState().products.items.find(p => p.sku === 'DI-800')!;
    expect(product.description).toBe('A great product');
  });

  it('generates a UUID for new product id', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await fillRequiredFields(user, { name: 'UUID Item', sku: 'UI-900' });
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'UI-900')).toBe(true);
    });

    const product = store.getState().products.items.find(p => p.sku === 'UI-900')!;
    expect(product.id).toBeDefined();
    expect(typeof product.id).toBe('string');
    expect(product.id.length).toBeGreaterThan(0);
  });
});

describe('ProductCreateModal variant-native creation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('creates size products as Talla variants and never writes product_sizes rows', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await fillRequiredFields(user, { name: 'Size Product', sku: 'SP-100' });
    await user.click(screen.getByRole('checkbox', { name: 'Size' }));
    await addManualSizes(user, ['M', 'L']);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'SP-100')).toBe(true);
    });

    const created = vi.mocked(createProduct).mock.calls[0][0];
    expect(created.hasVariants).toBe(true);
    expect(created.variantAttributes).toEqual(['Talla']);
    expect(created.sizes).toBeUndefined();

    const variantCalls = vi.mocked(createProductVariant).mock.calls;
    expect(variantCalls.map(c => c[1].sku)).toEqual(['SP-100-M', 'SP-100-L']);
    expect(variantCalls.map(c => c[1].attributes)).toEqual([{ Talla: 'M' }, { Talla: 'L' }]);

    const product = store.getState().products.items.find(p => p.sku === 'SP-100')!;
    expect(product.variants).toHaveLength(2);
    expect(product.variants!.map(v => v.sku)).toEqual(['SP-100-M', 'SP-100-L']);
  });

  it('fills the Talla dimension from size-group presets', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await fillRequiredFields(user, { name: 'Preset Product', sku: 'PP-100' });
    await user.click(screen.getByRole('checkbox', { name: 'Size' }));
    await user.selectOptions(getSelectByLabel('Size Groups'), 'standard');

    expect(screen.getByText('Combinations (6)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(vi.mocked(createProductVariant)).toHaveBeenCalledTimes(6);
    });
    expect(vi.mocked(createProductVariant).mock.calls.map(c => c[1].attributes.Talla))
      .toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  it('combines the Talla dimension with attribute slots (Color x Talla)', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await fillRequiredFields(user, { name: 'T-Shirt', sku: 'TS-100' });
    await user.click(screen.getByRole('checkbox', { name: 'Size' }));
    await addManualSizes(user, ['M', 'L']);

    await user.click(screen.getByRole('button', { name: '+ Add attribute' }));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Color' })).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Attribute 2' }), 'Color');
    await pickSlotValues(user, 'Attribute 2', ['Rojo', 'Rosado']);

    expect(screen.getByText('Combinations (4)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(vi.mocked(createProductVariant)).toHaveBeenCalledTimes(4);
    });

    const created = vi.mocked(createProduct).mock.calls[0][0];
    expect(created.hasVariants).toBe(true);
    expect(created.variantAttributes).toEqual(['Talla', 'Color']);

    const variantCalls = vi.mocked(createProductVariant).mock.calls;
    expect(variantCalls.map(c => c[1].sku)).toEqual(['TS-100-M-ROJ', 'TS-100-M-ROS', 'TS-100-L-ROJ', 'TS-100-L-ROS']);
    expect(variantCalls[0][1].attributes).toEqual({ Talla: 'M', Color: 'Rojo' });
  });

  it('generates the cartesian product across N attribute slots and removes slots', async () => {
    const user = userEvent.setup();
    renderModal(true);

    await fillRequiredFields(user, { name: 'Complex Product', sku: 'CP-100' });
    await user.click(screen.getByRole('checkbox', { name: 'Has variants' }));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Color' })).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Attribute 1' }), 'Color');
    await pickSlotValues(user, 'Attribute 1', ['Rojo', 'Rosado']);

    await user.click(screen.getByRole('button', { name: '+ Add attribute' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Attribute 2' }), 'Material');
    await pickSlotValues(user, 'Attribute 2', ['Algodón', 'Poliéster']);

    await user.click(screen.getByRole('button', { name: '+ Add attribute' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Attribute 3' }), 'Ajuste');
    await pickSlotValues(user, 'Attribute 3', ['Regular', 'Slim']);

    expect(screen.getByText('Combinations (8)')).toBeInTheDocument();

    // Removing a slot drops its dimension from the cartesian product
    await user.click(screen.getByRole('button', { name: 'Remove attribute 3' }));
    expect(screen.getByText('Combinations (4)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(vi.mocked(createProductVariant)).toHaveBeenCalledTimes(4);
    });
    const skus = vi.mocked(createProductVariant).mock.calls.map(c => c[1].sku);
    expect(new Set(skus).size).toBe(4);
  });

  it('allocates collision-safe SKUs with probe-loop numeric suffixes', async () => {
    const user = userEvent.setup();
    renderModal(true);
    vi.mocked(fetchVariantSkus).mockResolvedValue(['TS-100-ROS']);

    await fillRequiredFields(user, { name: 'Pinks', sku: 'TS-100' });
    await user.click(screen.getByRole('checkbox', { name: 'Has variants' }));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Color' })).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Attribute 1' }), 'Color');
    // "Rosado" and "Rosa" slug to the same "ROS" code
    await pickSlotValues(user, 'Attribute 1', ['Rosado', 'Rosa']);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(vi.mocked(createProductVariant)).toHaveBeenCalledTimes(2);
    });

    const skus = vi.mocked(createProductVariant).mock.calls.map(c => c[1].sku);
    // The DB already holds TS-100-ROS, so both combinations probe suffixes
    expect(skus).toEqual(['TS-100-ROS-1', 'TS-100-ROS-2']);
    expect(new Set(skus).size).toBe(2);
  });

  it('reports failed variant inserts and never adds ghost variants', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const onClose = vi.fn();
    renderModal(true, onClose, store);
    vi.mocked(createProductVariant).mockResolvedValueOnce(null);

    await fillRequiredFields(user, { name: 'Ghost Trap', sku: 'GT-100' });
    await user.click(screen.getByRole('checkbox', { name: 'Size' }));
    await addManualSizes(user, ['M', 'L']);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('GT-100-M');
    expect(onClose).not.toHaveBeenCalled();

    const product = store.getState().products.items.find(p => p.sku === 'GT-100')!;
    // Only the persisted variant reaches state - no client-side UUID ghost
    expect(product.variants).toHaveLength(1);
    expect(product.variants![0].sku).toBe('GT-100-L');

    // Creation is finished: the footer offers only closing the modal
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('duplicates a variant product seeding dimensions and per-variant stock', async () => {
    render(
      <Provider store={createTestStore()}>
        <I18nProvider>
          <ProductCreateModal
            isOpen
            onClose={vi.fn()}
            initialForm={{
              ...createEmptyForm(),
              name: 'Shirt (Copy)',
              category: 'Food',
              season: 'Permanente',
              brand: 'Nestlé',
              hasVariants: true,
              variantAttributes: ['Color'],
              variants: [
                { attributes: { Color: 'Rojo' }, stock: 5, minStock: 1 },
                { attributes: { Color: 'Rosado' }, stock: 3, minStock: 0 },
              ],
            }}
          />
        </I18nProvider>
      </Provider>
    );

    // Dimensions are seeded: the Color slot is selected with its values
    await waitFor(() => {
      expect(screen.getByText('Combinations (2)')).toBeInTheDocument();
    });
    expect(screen.getByRole('combobox', { name: 'Attribute 1' })).toHaveValue('Color');

    // Per-variant stock and min stock seed the generated combinations
    const stockInputs = screen.getAllByRole('spinbutton');
    expect(stockInputs.map(input => (input as HTMLInputElement).value)).toEqual(['5', '1', '3', '0']);
  });
});
