import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBulkDiscount,
  buildOperationalAlerts,
  buildOrdersCsv,
  filterProducts,
  summarizeTopProducts,
} from '../src/features/premium/modules/admin-advanced.js';

test('filterProducts supports query and category', () => {
  const out = filterProducts(
    [{ name: 'Oak Desk', category: 'desk' }, { name: 'Pine Chair', category: 'chair' }],
    'oak',
    'desk',
  );
  assert.equal(out.length, 1);
});

test('applyBulkDiscount clamps and computes prices', () => {
  const out = applyBulkDiscount([{ id: '1', price: 1000 }], 10);
  assert.equal(out[0].nextPrice, 900);
});

test('buildOrdersCsv formats CSV lines', () => {
  const csv = buildOrdersCsv([{ order_number: 'PO-1', status: 'placed', total_amount: 100, created_at: '2025-01-01' }]);
  assert.match(csv, /order_number,status,total_amount,created_at/);
  assert.match(csv, /PO-1/);
});

test('buildOperationalAlerts detects stale orders and assignments', () => {
  const alerts = buildOperationalAlerts(
    [{ status: 'placed', created_at: '2025-01-01T00:00:00Z' }],
    [{ delivery_status: 'assigned', created_at: '2025-01-01T00:00:00Z' }],
    '2025-01-03T00:00:00Z',
  );
  assert.equal(alerts.stalePlacedOrders, 1);
  assert.equal(alerts.longRunningAssignments, 1);
});

test('summarizeTopProducts aggregates and sorts', () => {
  const top = summarizeTopProducts([
    { product_name: 'Desk', quantity: 2, unit_price: 100 },
    { product_name: 'Chair', quantity: 1, unit_price: 500 },
    { product_name: 'Desk', quantity: 1, unit_price: 100 },
  ]);
  assert.equal(top[0].name, 'Chair');
});
