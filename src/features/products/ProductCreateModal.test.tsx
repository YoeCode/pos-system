import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductCreateModal from './ProductCreateModal';
import productsReducer from './productsSlice';

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
});
