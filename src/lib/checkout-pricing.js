export function calculateCheckoutTotals({ subtotal, discountPercent, taxRate, shippingFlat }) {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const safeDiscountPercent = Number.isFinite(discountPercent) ? Math.max(0, discountPercent) : 0;
  const safeTaxRate = Number.isFinite(taxRate) ? Math.max(0, taxRate) : 0;
  const safeShippingFlat = Number.isFinite(shippingFlat) ? Math.max(0, shippingFlat) : 0;

  const discountAmount = (safeSubtotal * safeDiscountPercent) / 100;
  const taxableAmount = Math.max(0, safeSubtotal - discountAmount);
  const taxAmount = taxableAmount * safeTaxRate;
  const total = taxableAmount + taxAmount + safeShippingFlat;

  return {
    subtotal: safeSubtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    shippingAmount: safeShippingFlat,
    total,
  };
}
