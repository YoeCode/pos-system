import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PaymentStep from './PaymentStep';
import posReducer from '../posSlice';
import productsReducer from '../../products/productsSlice';
import settingsReducer from '../../settings/settingsSlice';
import employeesReducer from '../../employees/employeesSlice';
import salesReducer from '../../sales/salesSlice';
import customersReducer from '../../customers/customersSlice';
import { createSale } from '../../sales/salesService';
import { reduceStock } from '../../products/productsService';
import { I18nProvider } from '../../../i18n/I18nProvider';
import { ToastProvider } from '../../../components/ToastProvider';
import type { CartItem, Product, Sale } from '../../../types';

vi.mock('../../../supabase/client', () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: () => false,
}));

vi.mock('../../sales/salesService', () => ({
  mapDbSale: vi.fn(),
  fetchSales: vi.fn().mockResolvedValue([]),
  createSale: vi.fn(),
  getNextOrderNumber: vi.fn().mockResolvedValue(1042),
}));

vi.mock('../../products/productsService', () => ({
  fetchProducts: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn().mockResolvedValue(null),
  updateProduct: vi.fn().mockResolvedValue(null),
  deleteProduct: vi.fn().mockResolvedValue(true),
  reduceStock: vi.fn().mockResolvedValue(true),
  restoreStock: vi.fn().mockResolvedValue(true),
  fetchProductAttributes: vi.fn().mockResolvedValue([]),
  createProductAttribute: vi.fn().mockResolvedValue(null),
  updateProductAttribute: vi.fn().mockResolvedValue(true),
  deleteProductAttribute: vi.fn().mockResolvedValue(true),
  fetchProductVariants: vi.fn().mockResolvedValue([]),
  createProductVariant: vi.fn().mockResolvedValue(null),
  updateProductVariant: vi.fn().mockResolvedValue(null),
  deleteProductVariant: vi.fn().mockResolvedValue(true),
}));

const PRODUCT: Product = {
  id: 'p1',
  name: 'T-Shirt',
  sku: 'TS-001',
  category: 'Ropa',
  price: 10,
  costPrice: 4,
  stock: 50,
  minStock: 5,
  status: 'active',
  publishedOnline: false,
  hasVariants: false,
  variantAttributes: [],
};

const CART: CartItem[] = [{ product: PRODUCT, quantity: 2, lineId: 'l1' }];

const RECORDED_SALE: Sale = {
  id: 'sale-recorded',
  order: {
    id: 'sale-recorded',
    orderNumber: '#1042',
    items: [{ product: PRODUCT, quantity: 2, lineTotal: 20 }],
    subtotal: 20,
    tax: 0,
    total: 20,
    discount: 0,
    createdAt: '2026-11-14T10:00:00.000Z',
  },
  paymentMethod: 'card',
  amountReceived: null,
  change: null,
  completedAt: '2026-11-14T10:00:00.000Z',
  loyaltyPointsEarned: 0,
  loyaltyPointsRedeemed: 0,
  discountApplied: 0,
  refundIds: [],
  refundedAmount: 0,
};

const defaultSettings = settingsReducer(undefined, { type: '@@INIT' });

const mockAuthReducer = (state = {
  user: { id: 'u1', tenantId: 'test-tenant', name: 'Test', email: 'test@test.com', role: 'admin' as const, pin: '1234' },
  isAuthenticated: true,
  error: null as string | null,
  isLoading: false,
}) => state;

function renderPaymentStep(onComplete: (saleId: string, pointsEarned: number) => void) {
  const store = configureStore({
    reducer: {
      pos: posReducer,
      products: productsReducer,
      settings: settingsReducer,
      employees: employeesReducer,
      sales: salesReducer,
      customers: customersReducer,
      auth: mockAuthReducer,
    },
    preloadedState: {
      settings: { ...defaultSettings, language: { language: 'es' as const } },
    },
  });

  return render(
    <Provider store={store}>
      <I18nProvider>
        <ToastProvider>
          <PaymentStep
            cart={CART}
            subtotal={20}
            tax={0}
            total={20}
            paymentMethod="card"
            orderNumber="#1042"
            discountApplied={0}
            onComplete={onComplete}
          />
        </ToastProvider>
      </I18nProvider>
    </Provider>
  );
}

describe('PaymentStep — post-recording state guard (issue #56)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('retires the pay action and shows the recorded state after a post-recording failure', async () => {
    const user = userEvent.setup();
    vi.mocked(createSale).mockResolvedValue(RECORDED_SALE);
    // The sale records fine; the stock step (after recording) fails.
    vi.mocked(reduceStock).mockResolvedValue(false);

    const onComplete = vi.fn();
    renderPaymentStep(onComplete);

    await user.click(screen.getByRole('button', { name: 'Confirmar Pago' }));

    await waitFor(() => {
      expect(screen.getByText('La venta ya está registrada')).toBeInTheDocument();
    });

    // The pay action is gone — nothing on screen can record again.
    expect(screen.queryByRole('button', { name: 'Confirmar Pago' })).toBeNull();
    expect(createSale).toHaveBeenCalledTimes(1);

    // The stock-only retry never records a sale again.
    await user.click(screen.getByRole('button', { name: 'Reintentar descuento de stock' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Finalizar' })).toBeEnabled();
    });
    expect(createSale).toHaveBeenCalledTimes(1);

    // Finishing hands the recorded sale to the receipt flow.
    await user.click(screen.getByRole('button', { name: 'Finalizar' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(vi.mocked(createSale).mock.calls[0][0].id, 0);
    expect(createSale).toHaveBeenCalledTimes(1);
  });

  it('keeps the pay action available after a pre-recording failure and reuses the attempt id', async () => {
    const user = userEvent.setup();
    vi.mocked(reduceStock).mockResolvedValue(true);
    vi.mocked(createSale)
      .mockRejectedValueOnce(new Error('Failed to create sale'))
      .mockResolvedValueOnce(RECORDED_SALE);

    const onComplete = vi.fn();
    renderPaymentStep(onComplete);

    await user.click(screen.getByRole('button', { name: 'Confirmar Pago' }));

    // Nothing was recorded, so retrying is still offered.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar Pago' })).toBeEnabled();
    });
    expect(createSale).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Confirmar Pago' }));
    await waitFor(() => {
      expect(createSale).toHaveBeenCalledTimes(2);
    });

    // Same checkout attempt → same sale id on the retry: the idempotent seam.
    expect(vi.mocked(createSale).mock.calls[1][0].id).toBe(vi.mocked(createSale).mock.calls[0][0].id);
  });

  it('disables the pay button while a submit is in flight', async () => {
    const user = userEvent.setup();
    vi.mocked(reduceStock).mockResolvedValue(true);
    let resolveSale!: (sale: Sale | null) => void;
    vi.mocked(createSale).mockImplementation(
      () => new Promise<Sale | null>(resolve => { resolveSale = resolve; }),
    );

    const onComplete = vi.fn();
    renderPaymentStep(onComplete);

    await user.click(screen.getByRole('button', { name: 'Confirmar Pago' }));

    const busyButton = screen.getByRole('button', { name: /Procesando/ });
    expect(busyButton).toBeDisabled();

    resolveSale(RECORDED_SALE);
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(createSale).toHaveBeenCalledTimes(1);
  });
});
