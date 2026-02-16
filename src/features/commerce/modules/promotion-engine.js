export function evaluatePromotions(context) {
  const outcomes = [];

  if (context.isFirstOrder && context.subtotal >= 2000) {
    outcomes.push({ label: 'First Order Offer', discountAmount: 250 });
  }

  if (context.customerTier === 'gold' && context.subtotal >= 5000) {
    outcomes.push({ label: 'Gold Loyalty Benefit', discountAmount: 400 });
  }

  if (context.customerTier === 'enterprise' && context.subtotal >= 10000) {
    outcomes.push({ label: 'Enterprise Contract Pricing', discountAmount: context.subtotal * 0.07 });
  }

  return outcomes;
}
