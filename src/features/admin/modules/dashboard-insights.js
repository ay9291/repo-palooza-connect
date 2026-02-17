export function computeFulfillmentMetrics(orders) {
  const total = orders.length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const progress = total ? Math.round((delivered / total) * 100) : 0;
  return { total, delivered, cancelled, pending, progress };
}

export function collectStatusBreakdown(orders) {
  const breakdown = new Map();
  for (const order of orders) {
    const key = order.status || 'unknown';
    breakdown.set(key, (breakdown.get(key) || 0) + 1);
  }
  return [...breakdown.entries()].map(([status, count]) => ({ status, count }));
}

export function detectOperationalFlags({ pendingOrders, lowStockCount, cancellationRate }) {
  return {
    pendingSpike: pendingOrders >= 10,
    lowStockRisk: lowStockCount >= 5,
    cancellationRisk: cancellationRate >= 0.15,
  };
}

export function summarizeTopProducts(orderItems) {
  const map = new Map();
  for (const item of orderItems) {
    const name = item.product_name || 'Unknown';
    const prev = map.get(name) || { qty: 0, revenue: 0 };
    prev.qty += Number(item.quantity || 0);
    prev.revenue += Number(item.quantity || 0) * Number(item.price_at_purchase || 0);
    map.set(name, prev);
  }

  return [...map.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}
