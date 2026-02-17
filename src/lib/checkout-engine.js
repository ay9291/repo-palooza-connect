const PIN_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^\d{10}$/;

export const COUPON_RULES = {
  WELCOME10: {
    type: 'percent',
    value: 10,
    minSubtotal: 1000,
    maxDiscount: 4000,
  },
  SAVE5: {
    type: 'percent',
    value: 5,
    minSubtotal: 500,
    maxDiscount: 1500,
  },
  FLAT250: {
    type: 'flat',
    value: 250,
    minSubtotal: 3000,
    maxDiscount: 250,
  },
};

export function validateShippingAddress(address) {
  const requiredFields = ['fullName', 'street', 'city', 'state', 'zipCode', 'phone'];

  for (const field of requiredFields) {
    if (!address[field] || !String(address[field]).trim()) {
      return { ok: false, message: 'Please fill in all shipping address fields.' };
    }
  }

  if (!PIN_REGEX.test(address.zipCode.trim())) {
    return { ok: false, message: 'ZIP Code must be a valid 6-digit PIN.' };
  }

  if (!PHONE_REGEX.test(address.phone.trim())) {
    return { ok: false, message: 'Phone number must be a valid 10-digit mobile number.' };
  }

  return { ok: true };
}

export function evaluateCoupon(code, subtotal) {
  const normalized = String(code || '').trim().toUpperCase();

  if (!normalized) {
    return { ok: false, message: 'Enter a coupon code first.' };
  }

  const rule = COUPON_RULES[normalized];
  if (!rule) {
    return { ok: false, message: 'This coupon is not valid.' };
  }

  if (subtotal < rule.minSubtotal) {
    return {
      ok: false,
      message: `This coupon requires a minimum order of ₹${rule.minSubtotal.toLocaleString()}.`,
    };
  }

  const rawDiscount = rule.type === 'percent' ? (subtotal * rule.value) / 100 : rule.value;
  const discountAmount = Math.min(rawDiscount, rule.maxDiscount);

  return {
    ok: true,
    code: normalized,
    discountAmount,
    message: `Coupon ${normalized} applied successfully.`,
  };
}

export function getShippingAmount({ subtotal, shippingTier }) {
  if (subtotal <= 0) return 0;

  if (shippingTier === 'express') {
    return subtotal >= 5000 ? 149 : 249;
  }

  return subtotal >= 3000 ? 0 : 99;
}

export function performFraudScreening({ subtotal, shippingAddress, paymentMethod }) {
  const highValue = subtotal > 150000;
  const codForHighValue = highValue && paymentMethod === 'cod';
  const sparseAddress = shippingAddress.street.trim().length < 8;

  if (codForHighValue || sparseAddress) {
    return {
      approved: false,
      message: 'We could not automatically verify this order. Please switch payment mode or update address details.',
    };
  }

  return { approved: true };
}
