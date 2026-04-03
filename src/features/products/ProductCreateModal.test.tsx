import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductCreateModal from './ProductCreateModal';
import productsReducer, { addProduct } from './productsSlice';

function createTestStore() {
  return configureStore({
    reducer: {
      products: productsReducer,
    },
  });
}

function renderModal(isOpen: boolean, onClose = vi.fn()) {
  const store = createTestStore();
  const result = render(
    <Provider store={store}>
      <ProductCreateModal isOpen={isOpen} onClose={onClose} />
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
    expect(screen.queryByText('New Product')).not.toBeInTheDocument();
  });

  it('renders modal with title and subtitle when open', () => {
    renderModal(true);
    expect(screen.getByText('New Product')).toBeInTheDocument();
    expect(screen.getByText('Add a new product to your inventory')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderModal(true);
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief product description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. PR-001')).toBeInTheDocument();
    expect(screen.getByText('Sale Price')).toBeInTheDocument();
    expect(screen.getByText('Cost Price')).toBeInTheDocument();
    expect(screen.getByText('Stock Level')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Publish online')).toBeInTheDocument();
  });

  it('has correct default values', () => {
    renderModal(true);
    const nameInput = screen.getByPlaceholderText('Enter product name');
    const skuInput = screen.getByPlaceholderText('e.g. PR-001');
    expect(nameInput).toHaveValue('');
    expect(skuInput).toHaveValue('');
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('disables create button when name or sku is empty', () => {
    renderModal(true);
    const createButton = screen.getByRole('button', { name: 'Create Product' });
    expect(createButton).toBeDisabled();
  });

  it('enables create button when name and sku are filled', async () => {
    const user = userEvent.setup();
    renderModal(true);
    const nameInput = screen.getByPlaceholderText('Enter product name');
    const skuInput = screen.getByPlaceholderText('e.g. PR-001');
    const createButton = screen.getByRole('button', { name: 'Create Product' });

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
    const { rerender } = renderModal(false);

    rerender(
      <Provider store={createTestStore()}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText('Enter product name');
    const skuInput = screen.getByPlaceholderText('e.g. PR-001');
    expect(nameInput).toHaveValue('');
    expect(skuInput).toHaveValue('');
  });

  it('dispatches addProduct with correct data on submit', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Test Widget');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'TW-100');
    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    expect(dispatchedAction).toBeDefined();
    const product = (dispatchedAction![0] as any).payload;
    expect(product.name).toBe('Test Widget');
    expect(product.sku).toBe('TW-100');
    expect(product.category).toBe('Electronics');
    expect(product.price).toBe(0);
    expect(product.costPrice).toBe(0);
    expect(product.stock).toBe(0);
    expect(product.status).toBe('draft');
    expect(product.publishedOnline).toBe(false);
  });

  it('trims whitespace from name and sku before dispatch', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), '  Trimmed Name  ');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), '  TW-200  ');
    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.name).toBe('Trimmed Name');
    expect(product.sku).toBe('TW-200');
  });

  it('updates price, costPrice, and stock from numeric inputs', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Priced Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'PI-300');

    const inputs = screen.getAllByRole('spinbutton');
    const priceInput = inputs[0];
    const costInput = inputs[1];
    const stockInput = inputs[2];

    await user.clear(priceInput);
    await user.type(priceInput, '29.99');
    await user.clear(costInput);
    await user.type(costInput, '15.50');
    await user.clear(stockInput);
    await user.type(stockInput, '42');

    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.price).toBe(29.99);
    expect(product.costPrice).toBe(15.5);
    expect(product.stock).toBe(42);
  });

  it('changes category selection', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Category Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'CI-400');

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    await user.selectOptions(categorySelect, 'Food');

    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.category).toBe('Food');
  });

  it('changes status selection', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Status Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'SI-500');

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[1];
    await user.selectOptions(statusSelect, 'active');

    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.status).toBe('active');
  });

  it('toggles publishedOnline', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Published Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'PI-600');

    const toggleButtons = screen.getAllByRole('button');
    const publishToggle = toggleButtons.find(btn =>
      btn.getAttribute('class')?.includes('inline-flex h-6 w-11')
    );
    expect(publishToggle).toBeDefined();
    await user.click(publishToggle!);

    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.publishedOnline).toBe(true);
  });

  it('calls onClose and resets form after successful creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const store = createTestStore();

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={onClose} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Final Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'FI-700');
    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets description on created product', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'Described Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'DI-800');
    await user.type(screen.getByPlaceholderText('Brief product description'), 'A great product');

    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.description).toBe('A great product');
  });

  it('generates a UUID for new product id', async () => {
    const user = userEvent.setup();
    const store = createTestStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ProductCreateModal isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    await user.type(screen.getByPlaceholderText('Enter product name'), 'UUID Item');
    await user.type(screen.getByPlaceholderText('e.g. PR-001'), 'UI-900');
    await user.click(screen.getByRole('button', { name: 'Create Product' }));

    const dispatchedAction = dispatchSpy.mock.calls.find(
      call => (call[0] as any).type === addProduct.type
    );
    const product = (dispatchedAction![0] as any).payload;
    expect(product.id).toBeDefined();
    expect(typeof product.id).toBe('string');
    expect(product.id.length).toBeGreaterThan(0);
  });
});
