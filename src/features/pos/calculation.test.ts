import { describe, it, expect } from 'vitest';
import { calculateCart, getEffectiveUnitPrice } from './calculation';
import type { CartItem, Product, ProductVariant } from '../../types';

const BASE_PRODUCT: Product = {
  id: 'p-base',
  name: 'T-Shirt',
  sku: 'TS-001',
  category: 'Ropa',
  price: 10,
  costPrice: 4,
  stock: 50,
  minStock: 5,
  status: 'active',
  publishedOnline: false,
  hasVariants: true,
  variantAttributes: ['Color', 'Size'],
};

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'v-1',
    productId: BASE_PRODUCT.id,
    sku: 'TS-BLU-M',
    price: 25,
    costPrice: null,
    stock: 10,
    minStock: 2,
    image: null,
    attributes: { Color: 'Blue', Size: 'M' },
    status: 'active',
    ...overrides,
  };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product: BASE_PRODUCT,
    quantity: 2,
    lineId: 'line-1',
    ...overrides,
  };
}

const options = { taxRate: 0, taxIncludedInPrice: true, itemDiscounts: {} };

describe('getEffectiveUnitPrice', () => {
  it('returns the variant custom price when present', () => {
    const item = makeCartItem({ selectedVariant: makeVariant({ price: 25 }) });
    expect(getEffectiveUnitPrice(item)).toBe(25);
  });

  it('falls back to the product price when the variant price is null', () => {
    const item = makeCartItem({ selectedVariant: makeVariant({ price: null }) });
    expect(getEffectiveUnitPrice(item)).toBe(10);
  });

  it('returns the product price for plain and sized lines', () => {
    expect(getEffectiveUnitPrice(makeCartItem())).toBe(10);
    expect(getEffectiveUnitPrice(makeCartItem({ selectedSize: 'M' }))).toBe(10);
  });
});

describe('calculateCart — effective variant price', () => {
  it('computes line and cart totals from the variant price, not the product price', () => {
    const cart = [makeCartItem({ selectedVariant: makeVariant({ price: 25 }), quantity: 2 })];
    const calc = calculateCart(cart, options);

    expect(calc.lines[0].lineTotal).toBe(50);
    expect(calc.grossSubtotal).toBe(50);
    expect(calc.total).toBe(50);
  });

  it('inherits the product price when the variant has no custom price', () => {
    const cart = [makeCartItem({ selectedVariant: makeVariant({ price: null }), quantity: 3 })];
    const calc = calculateCart(cart, options);

    expect(calc.lines[0].lineTotal).toBe(30);
    expect(calc.grossSubtotal).toBe(30);
  });

  it('keeps product price for mixed carts with plain lines', () => {
    const cart = [
      makeCartItem({ lineId: 'a', selectedVariant: makeVariant({ price: 25 }), quantity: 1 }),
      makeCartItem({ lineId: 'b', quantity: 2 }),
    ];
    const calc = calculateCart(cart, options);

    expect(calc.grossSubtotal).toBe(45);
  });
});
