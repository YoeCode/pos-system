import { describe, it, expect, vi } from 'vitest';
import type { RootState } from '../../app/store';
import { DEFAULT_ORDER_SEED, selectFormattedOrderNumber } from './settingsSlice';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

function stateWith(nextOrderNumber: number, prefix = 'ORD-'): RootState {
  return {
    settings: { pos: { orderNumberPrefix: prefix } },
    sales: { nextOrderNumber },
  } as unknown as RootState;
}

describe('order number display — fresh-install numbering', () => {
  it('renders the first ticket as ORD-0001', () => {
    expect(selectFormattedOrderNumber(stateWith(1))).toBe('ORD-0001');
  });

  it('zero-pads to four digits below 1000', () => {
    expect(selectFormattedOrderNumber(stateWith(42))).toBe('ORD-0042');
  });

  it('keeps four-digit numbers unchanged', () => {
    expect(selectFormattedOrderNumber(stateWith(1042))).toBe('ORD-1042');
  });

  it('honors the configured prefix', () => {
    expect(selectFormattedOrderNumber(stateWith(1, 'TK-'))).toBe('TK-0001');
  });

  it('defaults the order number seed to 1 for fresh installs', () => {
    expect(DEFAULT_ORDER_SEED).toBe(1);
  });
});
