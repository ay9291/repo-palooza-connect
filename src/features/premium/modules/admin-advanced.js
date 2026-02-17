export function filterProducts(products, query, category) {
  return products.filter((product) => {
    const matchesQuery = !query || product.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'all' || !category ? true : (product.category || 'uncategorized') === category;
    return matchesQuery && matchesCategory;
  });
}

export function applyBulkDiscount(products, percent) {
  const safePercent = Math.max(0, Math.min(90, Number(percent) || 0));
  return products.map((product) => ({
    id: product.id,
    nextPrice: Math.max(1, Number((product.price * (1 - safePercent / 100)).toFixed(2))),
  }));
}

export function buildOrdersCsv(orders) {
  const header = 'order_number,status,total_amount,created_at';
  const rows = orders.map((order) => [order.order_number, order.status, order.total_amount, order.created_at].join(','));
  return [header, ...rows].join('\n');
}

export function buildOperationalAlerts(orders, assignments, nowIso = new Date().toISOString()) {
  const now = new Date(nowIso).getTime();

  const stalePlacedOrders = orders.filter((order) => {
    if (order.status !== 'placed') return false;
    const ageHours = (now - new Date(order.created_at).getTime()) / 1000 / 3600;
    return ageHours >= 24;
  }).length;

  const longRunningAssignments = assignments.filter((assignment) => {
    if (assignment.delivery_status === 'delivered') return false;
    const ageHours = (now - new Date(assignment.created_at).getTime()) / 1000 / 3600;
    return ageHours >= 18;
  }).length;

  return { stalePlacedOrders, longRunningAssignments };
}

export function summarizeTopProducts(orderItems) {
  const totals = new Map();
  for (const item of orderItems) {
    const key = item.product_name || 'Unknown Product';
    const prev = totals.get(key) || { qty: 0, revenue: 0 };
    prev.qty += Number(item.quantity || 0);
    prev.revenue += Number(item.quantity || 0) * Number(item.unit_price || 0);
    totals.set(key, prev);
  }

  return [...totals.entries()]
    .map(([name, metrics]) => ({ name, ...metrics }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}
