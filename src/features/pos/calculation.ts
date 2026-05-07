import type { CartItem, LoyaltyTierConfig } from '../../types';

export interface LineCalculation {
  lineId: string;
  lineTotal: number;
  itemDiscountAmount: number;
  itemDiscountPct: number;
  loyaltyAmount: number;
  appliedDiscount: number;
  discountSource: 'none' | 'manual' | 'loyalty';
  lineNet: number;
}

export interface CartCalculation {
  grossSubtotal: number;
  totalDiscount: number;
  netSubtotal: number;
  tax: number;
  total: number;
  lines: LineCalculation[];
}

interface CalculationOptions {
  taxRate: number;
  taxIncludedInPrice: boolean;
  itemDiscounts: Record<string, number>;
  loyaltyTierConfig?: LoyaltyTierConfig;
  manualDiscount?: number;
}

/**
 * Unified cart calculation logic.
 *
 * Rules:
 * - Per line: item discount and loyalty do NOT stack. The MAX of the two is applied.
 * - Loyalty is calculated on the raw line total (NOT on remaining after item discounts).
 * - Cart-level manual discount competes with total loyalty (max wins, they don't stack).
 * - Gross subtotal = sum of all line totals (before any discounts).
 * - Tax is calculated on the net subtotal (after discounts).
 */
export function calculateCart(
  cart: CartItem[],
  options: CalculationOptions,
): CartCalculation {
  const { taxRate, taxIncludedInPrice, itemDiscounts, loyaltyTierConfig, manualDiscount = 0 } = options;
  const loyaltyPct = loyaltyTierConfig ? loyaltyTierConfig.discountPct : 0;

  const lines: LineCalculation[] = cart.map(item => {
    const lineTotal = item.product.price * item.quantity;
    const itemDiscountPct = itemDiscounts[item.lineId] || 0;
    const itemDiscountAmount = lineTotal * itemDiscountPct / 100;
    const loyaltyAmount = lineTotal * loyaltyPct;

    const appliedDiscount = Math.max(itemDiscountAmount, loyaltyAmount);
    const discountSource: LineCalculation['discountSource'] =
      appliedDiscount === 0 ? 'none'
        : itemDiscountAmount >= loyaltyAmount ? 'manual'
        : 'loyalty';

    return {
      lineId: item.lineId,
      lineTotal,
      itemDiscountAmount,
      itemDiscountPct,
      loyaltyAmount,
      appliedDiscount,
      discountSource,
      lineNet: lineTotal - appliedDiscount,
    };
  });

  const grossSubtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemDiscountsTotal = lines.reduce((sum, l) => sum + l.itemDiscountAmount, 0);
  const loyaltyTotal = lines.reduce((sum, l) => sum + (l.discountSource === 'loyalty' ? l.appliedDiscount : 0), 0);

  // Cart-level: manual discount competes with loyalty (max wins)
  const appliedGlobalDiscount = Math.max(manualDiscount, loyaltyTotal);
  const totalDiscount = itemDiscountsTotal + appliedGlobalDiscount;
  const netSubtotal = grossSubtotal - totalDiscount;

  let tax: number;
  let total: number;

  if (taxIncludedInPrice) {
    const basePrice = netSubtotal / (1 + taxRate);
    tax = netSubtotal - basePrice;
    total = netSubtotal;
  } else {
    tax = netSubtotal * taxRate;
    total = netSubtotal + tax;
  }

  return {
    grossSubtotal,
    totalDiscount,
    netSubtotal,
    tax,
    total,
    lines,
  };
}
