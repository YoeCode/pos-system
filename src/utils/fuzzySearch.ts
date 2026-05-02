import Fuse from 'fuse.js';

export interface FuseSearchOptions {
  threshold?: number;
  keys?: string[];
}

const defaultKeys = ['name', 'brand', 'category', 'sku'];

export function createFuseSearch<T>(data: T[], options?: FuseSearchOptions): Fuse<T> {
  return new Fuse(data, {
    keys: options?.keys || defaultKeys,
    threshold: options?.threshold ?? 0.3,
    includeScore: true,
  });
}

export interface FuzzyResult<T> {
  item: T;
  score?: number;
}

export function fuzzySearch<T>(
  fuse: Fuse<T>,
  query: string
): FuzzyResult<T>[] {
  if (!query.trim()) return [];
  
  const results = fuse.search(query, { limit: 50 });
  return results.map(r => ({ item: r.item, score: r.score }));
}
