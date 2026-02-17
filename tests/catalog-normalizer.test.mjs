import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProducts, withTimeout } from '../src/features/commerce/modules/catalog-normalizer.js';

test('normalizeProducts sanitizes malformed values', () => {
  const out = normalizeProducts([{ id: 1, name: null, price: '1000', stock_quantity: '2', is_active: 1 }]);
  assert.equal(out[0].id, '1');
  assert.equal(out[0].name, 'Unnamed Product');
  assert.equal(out[0].price, 1000);
  assert.equal(out[0].stock_quantity, 2);
});

test('withTimeout rejects slow promises', async () => {
  await assert.rejects(() => withTimeout(new Promise((resolve) => setTimeout(resolve, 30)), 10));
});
