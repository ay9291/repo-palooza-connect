import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPersonalizedRecommendations } from '../src/features/commerce/modules/recommendation-engine.js';
import { buildSearchSummary } from '../src/features/commerce/modules/search-query.js';
import { evaluatePromotions } from '../src/features/commerce/modules/promotion-engine.js';
import { calculateNetRevenue, calculateAov } from '../src/features/admin/modules/analytics-metrics.js';
import { calculateEarnings } from '../src/features/delivery/modules/earnings-ledger.js';

test('recommendations exclude recently viewed products', () => {
  const out = buildPersonalizedRecommendations(
    [
      { id: '1', name: 'A', price: 100, rating: 5 },
      { id: '2', name: 'B', price: 200, rating: 4.5 },
    ],
    ['1'],
  );

  assert.equal(out.length, 1);
  assert.equal(out[0].id, '2');
});

test('search summary composes readable filters', () => {
  const summary = buildSearchSummary({ query: 'desk', minPrice: 1000, maxPrice: 4000, inStockOnly: true, sort: 'price-asc' });
  assert.match(summary, /desk/);
  assert.match(summary, /In-stock only/);
});

test('promotion engine applies enterprise pricing', () => {
  const promos = evaluatePromotions({ subtotal: 15000, customerTier: 'enterprise', isFirstOrder: false });
  assert.ok(promos.some((p) => p.label === 'Enterprise Contract Pricing'));
});

test('admin metrics calculate net revenue and AOV', () => {
  assert.equal(calculateNetRevenue({ grossRevenue: 1000, refunds: 120, orders: 10 }), 880);
  assert.equal(calculateAov({ grossRevenue: 1000, refunds: 120, orders: 10 }), 88);
});

test('delivery earnings include delivered jobs only', () => {
  const earnings = calculateEarnings([
    { id: '1', status: 'assigned', payout: 100 },
    { id: '2', status: 'delivered', payout: 220 },
  ]);

  assert.equal(earnings, 220);
});
