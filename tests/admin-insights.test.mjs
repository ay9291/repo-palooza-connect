import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminKpis, buildPartnerAssignmentStats, filterOrdersByStatus } from '../src/features/premium/modules/admin-insights.js';

test('buildAdminKpis computes revenue and operational counts', () => {
  const kpis = buildAdminKpis({
    products: [{ stock_quantity: 2 }, { stock_quantity: 8 }],
    orders: [
      { status: 'placed', total_amount: 500 },
      { status: 'delivered', total_amount: 700 },
    ],
    assignments: [{ delivery_status: 'assigned' }, { delivery_status: 'delivered' }],
  });

  assert.equal(kpis.totalProducts, 2);
  assert.equal(kpis.lowStockCount, 1);
  assert.equal(kpis.openOrders, 1);
  assert.equal(kpis.totalRevenue, 700);
  assert.equal(kpis.activeAssignments, 1);
});

test('buildPartnerAssignmentStats derives per-partner metrics', () => {
  const stats = buildPartnerAssignmentStats(
    [{ id: 'p1', full_name: 'Rider A' }],
    [
      { partner_id: 'p1', delivery_status: 'assigned' },
      { partner_id: 'p1', delivery_status: 'delivered' },
    ],
  );

  assert.equal(stats[0].assignedOrders, 2);
  assert.equal(stats[0].deliveredOrders, 1);
});

test('filterOrdersByStatus returns scoped orders', () => {
  const orders = [{ status: 'placed' }, { status: 'delivered' }];
  assert.equal(filterOrdersByStatus(orders, 'placed').length, 1);
  assert.equal(filterOrdersByStatus(orders, 'all').length, 2);
});
