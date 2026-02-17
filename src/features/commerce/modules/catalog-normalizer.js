export function normalizeProducts(rawProducts) {
  return (rawProducts || [])
    .map((item) => ({
      id: String(item.id || ''),
      name: String(item.name || 'Unnamed Product'),
      slug: String(item.slug || item.id || 'product'),
      description: item.description ?? null,
      price: Number(item.price || 0),
      category_id: item.category_id ?? null,
      image_url: item.image_url ?? null,
      stock_quantity: Number(item.stock_quantity || 0),
      is_active: Boolean(item.is_active),
      created_at: String(item.created_at || ''),
      updated_at: String(item.updated_at || ''),
    }))
    .filter((item) => item.id.length > 0);
}

export async function withTimeout(promise, timeoutMs = 10000) {
  return await Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs)),
  ]);
}
