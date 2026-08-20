/**
 * V4 Sourcing Intelligence — External API Connector Framework v2
 * Explicit lifecycle: not_configured -> configured -> connected/error.
 * No AI in the connector layer.
 */

const connectors = new Map();

export function registerConnector(name, config = {}) {
  const connector = {
    name,
    status: config.status || 'not_configured',
    auth: config.auth || null,
    endpoint: config.endpoint || null,
    lastCheck: null,
    error: null,
  };
  connectors.set(name, connector);
  return connector;
}

export function checkConnector(name, checker = null) {
  const connector = connectors.get(name);
  if (!connector) return { success: false, error: 'connector_not_found' };

  connector.lastCheck = new Date().toISOString();
  connector.error = null;

  if (typeof checker !== 'function') {
    return { success: connector.status === 'connected', connector };
  }

  try {
    const result = checker(connector);
    connector.status = result?.success ? 'connected' : 'error';
    connector.error = result?.success ? null : (result?.error || 'connection_check_failed');
  } catch (error) {
    connector.status = 'error';
    connector.error = error instanceof Error ? error.message : 'connection_check_failed';
  }

  return { success: connector.status === 'connected', connector };
}

export function getConnector(name) {
  return connectors.get(name) || null;
}

export function listConnectors() {
  return Array.from(connectors.values());
}

export function normalizeExternalData(payload = {}) {
  if (!payload.source) throw new Error('external_data_source_required');

  return {
    source: payload.source,
    timestamp: payload.timestamp || new Date().toISOString(),
    data: payload.data || {},
    confidence: Math.max(0, Math.min(100, Number(payload.confidence || 0))),
    dataStatus: payload.dataStatus || 'imported',
  };
}
