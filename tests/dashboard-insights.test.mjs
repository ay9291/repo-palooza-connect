import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectStatusBreakdown,
  computeFulfillmentMetrics,
  detectOperationalFlags,
  summarizeTopProducts,
} from '../src/features/admin/modules/dashboard-insights.js';

test('computeFulfillmentMetrics returns progress and counts', () => {
  const result = computeFulfillmentMetrics([
    { status: 'delivered' },
    { status: 'pending' },
    { status: 'cancelled' },
  ]);
  assert.equal(result.progress, 33);
  assert.equal(result.pending, 1);
});

test('collectStatusBreakdown groups statuses', () => {
  const result = collectStatusBreakdown([{ status: 'pending' }, { status: 'pending' }, { status: 'delivered' }]);
  assert.equal(result.find((r) => r.status === 'pending').count, 2);
});

test('detectOperationalFlags identifies risk thresholds', () => {
  const result = detectOperationalFlags({ pendingOrders: 15, lowStockCount: 5, cancellationRate: 0.2 });
  assert.equal(result.pendingSpike, true);
  assert.equal(result.lowStockRisk, true);
  assert.equal(result.cancellationRisk, true);
});

test('summarizeTopProducts aggregates revenue', () => {
  const result = summarizeTopProducts([
    { product_name: 'Desk', quantity: 2, price_at_purchase: 100 },
    { product_name: 'Chair', quantity: 1, price_at_purchase: 500 },
  ]);
  assert.equal(result[0].name, 'Chair');
});
