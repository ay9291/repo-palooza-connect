export function buildPersonalizedRecommendations(products, recentlyViewedIds) {
  const viewedSet = new Set(recentlyViewedIds);

  return products
    .filter((product) => !viewedSet.has(product.id))
    .sort((a, b) => {
      const aScore = (a.rating || 0) * 1000 - a.price;
      const bScore = (b.rating || 0) * 1000 - b.price;
      return bScore - aScore;
    })
    .slice(0, 8);
}
