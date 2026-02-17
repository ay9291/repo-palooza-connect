import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCoupon,
  getShippingAmount,
  performFraudScreening,
  validateShippingAddress,
} from '../src/lib/checkout-engine.js';

test('validates shipping address fields and phone/pin format', () => {
  const invalid = validateShippingAddress({
    fullName: 'Jane Doe',
    street: '42 Test Road',
    city: 'Pune',
    state: 'MH',
    zipCode: '12345',
    phone: '99999',
  });

  assert.equal(invalid.ok, false);

  const valid = validateShippingAddress({
    fullName: 'Jane Doe',
    street: '42 Test Road',
    city: 'Pune',
    state: 'MH',
    zipCode: '411045',
    phone: '9876543210',
  });

  assert.equal(valid.ok, true);
});

test('evaluates coupon with minimum subtotal and caps discount', () => {
  const lowSubtotal = evaluateCoupon('WELCOME10', 200);
  assert.equal(lowSubtotal.ok, false);

  const valid = evaluateCoupon('WELCOME10', 100000);
  assert.equal(valid.ok, true);
  assert.equal(valid.discountAmount, 4000);
});

test('calculates shipping by tier and subtotal', () => {
  assert.equal(getShippingAmount({ subtotal: 2500, shippingTier: 'standard' }), 99);
  assert.equal(getShippingAmount({ subtotal: 3500, shippingTier: 'standard' }), 0);
  assert.equal(getShippingAmount({ subtotal: 4500, shippingTier: 'express' }), 249);
  assert.equal(getShippingAmount({ subtotal: 6000, shippingTier: 'express' }), 149);
});

test('flags suspicious order patterns for fraud screening', () => {
  const blocked = performFraudScreening({
    subtotal: 200000,
    paymentMethod: 'cod',
    shippingAddress: {
      street: 'A',
    },
  });

  assert.equal(blocked.approved, false);

  const approved = performFraudScreening({
    subtotal: 20000,
    paymentMethod: 'card',
    shippingAddress: {
      street: '123 Prime Street',
    },
  });

  assert.equal(approved.approved, true);
});
