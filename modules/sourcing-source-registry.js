/**
 * Sourcing source registry — V4
 *
 * Sources are adapters, not business logic. Alibaba is optional; the
 * orchestration layer must not assume that it is the only source.
 */

export const SOURCE_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  BLOCKED: 'BLOCKED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  UNSUPPORTED: 'UNSUPPORTED',
});

const REGISTRY = Object.freeze({
  alibaba: Object.freeze({
    id: 'alibaba',
    name: 'Alibaba.com',
    enabled: true,
    optional: true,
    adapter: 'alibaba-import',
  }),
});

export function listSourcingSources() {
  return Object.values(REGISTRY).map(({ id, name, enabled, optional, adapter }) => ({
    id, name, enabled, optional, adapter,
  }));
}

export function getSourcingSource(sourceId) {
  const key = String(sourceId || '').trim().toLowerCase();
  return REGISTRY[key] || null;
}

export function resolveSource(sourceId) {
  const source = getSourcingSource(sourceId);
  if (!source) return { status: SOURCE_STATUS.UNSUPPORTED, sourceId: sourceId || null };
  if (!source.enabled) return { status: SOURCE_STATUS.BLOCKED, ...source };
  return { status: SOURCE_STATUS.AVAILABLE, ...source };
}
