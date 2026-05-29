import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductCreateModal from './ProductCreateModal';
import productsReducer from './productsSlice';
import settingsReducer from '../settings/settingsSlice';
import { I18nProvider } from '../../i18n/I18nProvider';

vi.mock('./productsService', () => ({
  fetchProducts: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn((product: any) => Promise.resolve(product)),
  updateProduct: vi.fn().mockResolvedValue(null),
  deleteProduct: vi.fn().mockResolvedValue(true),
  reduceStock: vi.fn().mockResolvedValue(true),
  restoreStock: vi.fn().mockResolvedValue(true),
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

describe('ProductCreateModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
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

  it('enables create button when name and sku are filled', async () => {
    const user = userEvent.setup();
    renderModal(true);
    const nameInput = screen.getByPlaceholderText('Enter product name');
    const skuInput = screen.getByPlaceholderText('e.g. PR-001');
    const createButton = screen.getByRole('button', { name: 'Add' });

    await user.type(nameInput, 'Test Product');
    await user.type(skuInput, 'TP-001');

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

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Test Widget');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'TW-100');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(store.getState().products.items.some(p => p.sku === 'TW-100')).toBe(true);
    });

    const product = store.getState().products.items.find(p => p.sku === 'TW-100')!;
    expect(product.name).toBe('Test Widget');
    expect(product.sku).toBe('TW-100');
    expect(product.category).toBe('Electronics');
    expect(product.status).toBe('draft');
    expect(product.publishedOnline).toBe(false);
  });

  it('trims whitespace from name and sku before dispatch', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await user.type(screen.getByPlaceholderText('Enter product name'), '  Trimmed Name  ');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), '  TW-200  ');
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
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'CI-400');

    const categorySelect = screen.getByRole('combobox');
    await user.selectOptions(categorySelect, 'Food');

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

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Final Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'FI-700');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets description on created product', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    renderModal(true, vi.fn(), store);

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Described Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'DI-800');
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

    await user.type(screen.getByPlaceholderText('Enter product name'), 'UUID Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'UI-900');
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
