export function buildSearchSummary(state) {
  const parts = [];

  if (state.query.trim()) parts.push(`Query: ${state.query.trim()}`);
  if (state.minPrice !== undefined || state.maxPrice !== undefined) {
    parts.push(`Price: ₹${state.minPrice ?? 0} - ₹${state.maxPrice ?? '∞'}`);
  }
  if (state.inStockOnly) parts.push('In-stock only');
  if (state.sort) parts.push(`Sort: ${state.sort}`);

  return parts.length ? parts.join(' · ') : 'All products';
}
