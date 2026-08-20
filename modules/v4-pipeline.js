/**
 * V4 Sourcing Intelligence Pipeline
 * Orchestrates deterministic analysis flow.
 */

export function runV4Pipeline(input = {}, engines = {}) {
  const radar = engines.radar ? engines.radar(input.sources || {}) : null;
  const product = engines.product ? engines.product(input.product || {}) : null;
  const supplier = engines.supplier ? engines.supplier(input.supplier || {}) : null;
  const risk = engines.risk ? engines.risk({ product, supplier }) : null;
  const decision = engines.decision ? engines.decision({ product, supplier, risk, radar }) : null;

  return {
    radar,
    product,
    supplier,
    risk,
    decision,
    timestamp: new Date().toISOString(),
  };
}
