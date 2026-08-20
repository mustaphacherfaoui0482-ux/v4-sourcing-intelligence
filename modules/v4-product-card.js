/**
 * V4 Sourcing Intelligence — Product Card
 * Presentation layer only.
 */

export function createProductCard(product = {}) {
  return {
    title: product.name || 'Unnamed product',
    image: product.image || null,
    score: product.score ?? 0,
    margin: product.margin ?? null,
    risk: product.risk || 'unknown',
    supplier: product.supplier || null,
    decision: product.decision || 'REVIEW',
  };
}

export function renderProductCards(products = []) {
  return products.map(createProductCard);
}
