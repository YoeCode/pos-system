import { describe, it, expect, vi, afterEach } from 'vitest';
import posReducer, { addCustomProductToCart } from './posSlice';
import { isManualProductId } from '../../utils/manualProduct';

const getActiveWindow = (state: ReturnType<typeof posReducer>) =>
  state.windows.find(w => w.id === state.activeWindowId);

describe('posSlice — manual product ids', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives two manual products added in the same millisecond different ids', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    let state = posReducer(undefined, { type: '@@INIT' });
    state = posReducer(state, addCustomProductToCart({ name: 'Manual A', category: 'General', price: 10 }));
    state = posReducer(state, addCustomProductToCart({ name: 'Manual B', category: 'General', price: 20 }));

    const cart = getActiveWindow(state)?.cart ?? [];
    expect(cart).toHaveLength(2);
    expect(cart[0].product.id).not.toBe(cart[1].product.id);
    expect(cart[0].product.sku).not.toBe(cart[1].product.sku);
  });

  it('marks manual product ids so sale persistence can detect them explicitly', () => {
    const state = posReducer(undefined, addCustomProductToCart({ name: 'Manual A', category: 'General', price: 10 }));

    const product = getActiveWindow(state)?.cart[0].product;
    expect(product).toBeDefined();
    expect(isManualProductId(product!.id)).toBe(true);
  });
});
