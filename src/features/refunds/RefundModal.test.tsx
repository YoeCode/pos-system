import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RefundModal from './RefundModal';
import refundsReducer from './refundsSlice';
import posReducer from '../pos/posSlice';
import productsReducer from '../products/productsSlice';
import settingsReducer from '../settings/settingsSlice';
import employeesReducer from '../employees/employeesSlice';
import salesReducer from '../sales/salesSlice';
import { restoreStock } from '../products/productsService';
import { I18nProvider } from '../../i18n/I18nProvider';
import { ToastProvider } from '../../components/ToastProvider';
import type { Product, ProductVariant, Sale } from '../../types';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: () => false,
}));

vi.mock('../products/productsService', () => ({
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

const TSHIRT: Product = {
  id: 'p1',
  name: 'T-Shirt',
  sku: 'TS-001',
  category: 'Ropa',
  price: 10,
  costPrice: 4,
  stock: 0,
  minStock: 0,
  status: 'active',
  publishedOnline: false,
  hasVariants: true,
  variantAttributes: ['Color', 'Size'],
};

const JEANS: Product = {
  id: 'p2',
  name: 'Jeans',
  sku: 'JN-001',
  category: 'Ropa',
  price: 30,
  costPrice: 12,
  stock: 0,
  minStock: 0,
  status: 'active',
  publishedOnline: false,
  hasVariants: false,
  variantAttributes: [],
};

function makeVariant(id: string, sku: string, price: number, attributes: Record<string, string>): ProductVariant {
  return {
    id,
    productId: TSHIRT.id,
    sku,
    price,
    costPrice: null,
    stock: 0,
    minStock: 0,
    image: null,
    attributes,
    status: 'active',
  };
}

const VARIANT_BLUE_M = makeVariant('var-blue-m', 'TS-BLU-M', 25, { Color: 'Blue', Size: 'M' });
const VARIANT_RED_S = makeVariant('var-red-s', 'TS-RED-S', 20, { Color: 'Red', Size: 'S' });

const SALE: Sale = {
  id: 'sale-1',
  order: {
    id: 'sale-1',
    orderNumber: '#1042',
    items: [
      { product: { ...TSHIRT }, quantity: 2, lineTotal: 50, selectedVariant: VARIANT_BLUE_M },
      { product: { ...TSHIRT }, quantity: 1, lineTotal: 20, selectedVariant: VARIANT_RED_S },
      { product: { ...JEANS }, quantity: 3, lineTotal: 90, selectedSize: '38' },
    ],
    subtotal: 160,
    tax: 0,
    total: 160,
    discount: 0,
    createdAt: '2026-11-12T10:00:00.000Z',
  },
  paymentMethod: 'cash',
  amountReceived: 160,
  change: 0,
  completedAt: '2026-11-12T10:00:00.000Z',
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

function createTestStore() {
  return configureStore({
    reducer: {
      pos: posReducer,
      products: productsReducer,
      settings: settingsReducer,
      employees: employeesReducer,
      sales: salesReducer,
      refunds: refundsReducer,
      auth: mockAuthReducer,
    },
    preloadedState: {
      settings: {
        ...defaultSettings,
        language: { language: 'en' as const },
        pos: {
          ...defaultSettings.pos,
          refundSettings: { enabled: true, requirePin: false, pinThreshold: 9999, maxRefundDays: 30 },
        },
      },
      sales: { sales: [SALE], nextOrderNumber: 1042, isLoading: false, error: null },
    },
  });
}

function renderRefundModal(store = createTestStore()) {
  const result = render(
    <Provider store={store}>
      <I18nProvider>
        <ToastProvider>
          <RefundModal isOpen={true} onClose={vi.fn()} />
        </ToastProvider>
      </I18nProvider>
    </Provider>
  );
  return { ...result, store };
}

async function goToSelectStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Número de orden o nombre de producto...'), 'T-Shirt');
  await user.click(screen.getByRole('button', { name: /#1042/ }));
}

function getLineRow(labelText: string): HTMLElement {
  const row = screen.getByText(labelText).closest('.rounded-lg');
  if (!row) throw new Error(`Refund line row for "${labelText}" not found`);
  return row as HTMLElement;
}

async function toggleLine(user: ReturnType<typeof userEvent.setup>, labelText: string) {
  const row = getLineRow(labelText);
  await user.click(within(row).getAllByRole('button')[0]);
}

async function confirmRefund(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Continuar/ }));
  await user.click(screen.getByRole('button', { name: 'Confirmar devolución' }));
}

describe('RefundModal — restore stock to the sold variant or size row', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('restores a variant line to its own variant row without colliding with sibling lines', async () => {
    const user = userEvent.setup();
    renderRefundModal();
    await goToSelectStep(user);

    // Two lines share product p1 with different variants; only Red · S is picked.
    await toggleLine(user, 'Red · S');
    expect(screen.getByText('1 items seleccionados')).toBeInTheDocument();

    await confirmRefund(user);

    expect(restoreStock).toHaveBeenCalledTimes(1);
    expect(restoreStock).toHaveBeenCalledWith('p1', 1, undefined, 'test-tenant', undefined, 'var-red-s');
  });

  it('restores a sized line to its size row', async () => {
    const user = userEvent.setup();
    renderRefundModal();
    await goToSelectStep(user);

    await toggleLine(user, '38');
    await confirmRefund(user);

    expect(restoreStock).toHaveBeenCalledTimes(1);
    expect(restoreStock).toHaveBeenCalledWith('p2', 1, '38', 'test-tenant', undefined, undefined);
  });

  it('threads variantId and selectedSize into the refund record and prices lines by the variant price', async () => {
    const user = userEvent.setup();
    const { store } = renderRefundModal();
    await goToSelectStep(user);

    await toggleLine(user, 'Blue · M');
    await confirmRefund(user);

    expect(restoreStock).toHaveBeenCalledWith('p1', 1, undefined, 'test-tenant', undefined, 'var-blue-m');

    const refund = store.getState().refunds.refunds[0];
    expect(refund.items).toHaveLength(1);
    expect(refund.items[0].variantId).toBe('var-blue-m');
    expect(refund.items[0].selectedSize).toBeUndefined();
    expect(refund.items[0].unitPrice).toBe(25);
    expect(refund.items[0].lineTotal).toBe(25);
    expect(refund.totalAmount).toBe(25);
  });

  it('selects the two variant lines of the same product independently', async () => {
    const user = userEvent.setup();
    renderRefundModal();
    await goToSelectStep(user);

    await toggleLine(user, 'Blue · M');
    await toggleLine(user, 'Red · S');
    expect(screen.getByText('2 items seleccionados')).toBeInTheDocument();

    await confirmRefund(user);

    expect(restoreStock).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(restoreStock).mock.calls;
    expect(calls.map(c => [c[0], c[1], c[2], c[5]])).toEqual(
      expect.arrayContaining([
        ['p1', 1, undefined, 'var-blue-m'],
        ['p1', 1, undefined, 'var-red-s'],
      ])
    );
  });
});

describe('RefundModal — line identity on screen', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders variant and size lines with their own identity so the operator can tell them apart', async () => {
    const user = userEvent.setup();
    renderRefundModal();
    await goToSelectStep(user);

    expect(screen.getByText('Blue · M')).toBeInTheDocument();
    expect(screen.getByText('Red · S')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
  });
});
