import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCheckoutTotals } from '../src/lib/checkout-pricing.js';

test('calculates totals with discount and tax', () => {
  const result = calculateCheckoutTotals({
    subtotal: 1000,
    discountPercent: 10,
    taxRate: 0.18,
    shippingFlat: 100,
  });

  assert.equal(result.discountAmount, 100);
  assert.equal(result.taxableAmount, 900);
  assert.equal(result.taxAmount, 162);
  assert.equal(result.total, 1162);
});

test('guards invalid input values', () => {
  const result = calculateCheckoutTotals({
    subtotal: -100,
    discountPercent: -5,
    taxRate: -1,
    shippingFlat: -50,
  });

  assert.equal(result.subtotal, 0);
  assert.equal(result.total, 0);
});
