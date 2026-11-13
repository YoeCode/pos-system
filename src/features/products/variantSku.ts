// Collision-safe variant SKU generation.
//
// Mirrors the probe-loop pattern of migration 022: every attribute value maps
// to a stable short slug (equal values always produce the same code piece and
// the SKU does not depend on insertion order), and any residual collision -
// between values or against SKUs already in the database - is resolved with
// numeric suffixes probed until the candidate is free.

const SLUG_MAX_LENGTH = 3;

/** Stable short code for an attribute value: "Rosado" -> "ROS", "80B" -> "80B". */
export function variantValueSlug(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, SLUG_MAX_LENGTH);
  return slug || 'X';
}

/** Base candidate for a combination: "TP-100-ROS-XL". Dimension order keeps the SKU stable. */
export function variantSkuBase(
  productSku: string,
  attributes: Record<string, string>,
  dimensionOrder: string[]
): string {
  const slugs = dimensionOrder
    .filter(dimension => attributes[dimension] !== undefined)
    .map(dimension => variantValueSlug(attributes[dimension]));
  return [productSku, ...slugs].join('-');
}

/**
 * Allocates one guaranteed-unique SKU for a base: the base itself when free,
 * then base-1, base-2, ... while taken. `taken` is mutated to reserve the
 * result, so later allocations in the same batch cannot collide with it or
 * with a suffixed candidate of another base.
 */
export function allocateVariantSku(base: string, taken: Set<string>): string {
  let candidate = base;
  let suffix = 1;
  while (taken.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  taken.add(candidate);
  return candidate;
}
