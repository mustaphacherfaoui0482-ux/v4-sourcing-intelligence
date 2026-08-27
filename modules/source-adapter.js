/**
 * Provider-agnostic sourcing adapter.
 * Acquisition is delegated to providers; this layer only normalizes evidence.
 * It never calculates economics, risk, score, or decision.
 */

export const SOURCE_ADAPTER_VERSION = '1.0.0';

export function createSourceAdapter(providers = {}) {
  const registry = new Map(Object.entries(providers));

  return Object.freeze({
    listSources() {
      return [...registry.keys()];
    },

    async searchSource(source, query) {
      const provider = registry.get(source);
      if (!provider || typeof provider.search !== 'function') {
        throw new Error(`Unknown or invalid source: ${source}`);
      }
      if (typeof query !== 'string' || !query.trim()) {
        throw new Error('query must be a non-empty string');
      }
      return provider.search(query);
    },

    async inspectSourceProduct(source, reference) {
      const provider = registry.get(source);
      if (!provider || typeof provider.inspectProduct !== 'function') {
        throw new Error(`Unknown or invalid source: ${source}`);
      }
      if (typeof reference !== 'string' || !reference.trim()) {
        throw new Error('reference must be a non-empty string');
      }
      return provider.inspectProduct(reference);
    },
  });
}

function field(value, source, evidenceStatus = 'P0') {
  return {
    value: value ?? null,
    source,
    evidenceStatus,
  };
}

/**
 * Convert provider output to a stable Evidence-shaped record.
 * Missing values remain null; no silent defaults are introduced.
 */
export function normalizeSourceProduct(raw = {}, { source, evidenceStatus = 'P1', observedAt = null } = {}) {
  if (!source) throw new Error('source is required');

  return {
    product: field(raw.product, source, evidenceStatus),
    url: field(raw.url, source, evidenceStatus),
    supplier: field(raw.supplier, source, evidenceStatus),
    country: field(raw.country, source, evidenceStatus),
    price: field(raw.price, source, evidenceStatus),
    currency: field(raw.currency, source, evidenceStatus),
    moq: field(raw.moq, source, evidenceStatus),
    customization: field(raw.customization, source, evidenceStatus),
    sample: field(raw.sample, source, evidenceStatus),
    leadTime: field(raw.leadTime, source, evidenceStatus),
    certifications: field(raw.certifications, source, evidenceStatus),
    observedAt,
  };
}
