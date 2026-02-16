export function calculateNetRevenue(snapshot) {
  const gross = Math.max(0, snapshot.grossRevenue);
  const refunds = Math.max(0, snapshot.refunds);
  return Math.max(0, gross - refunds);
}

export function calculateAov(snapshot) {
  if (snapshot.orders <= 0) return 0;
  return calculateNetRevenue(snapshot) / snapshot.orders;
}
