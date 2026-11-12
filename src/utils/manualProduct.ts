// Manual (non-catalog) products created at the POS never get a products row.
// Their synthetic ids are recognized by prefix so persistence can detect them
// explicitly: their sale lines are stored with product_id NULL plus snapshot
// columns, never with the synthetic id (which would violate the FK to products).

export const MANUAL_PRODUCT_ID_PREFIX = 'custom-';

export function createManualProductId(): string {
  return `${MANUAL_PRODUCT_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isManualProductId(id: string | undefined | null): boolean {
  return !!id && id.startsWith(MANUAL_PRODUCT_ID_PREFIX);
}
