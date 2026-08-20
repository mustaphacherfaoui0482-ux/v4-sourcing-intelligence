/**
 * V4 Sourcing Intelligence — External API Connector Framework v1
 * Standard layer for future external data providers.
 * No AI in V1.
 */

const connectors = new Map();

export function registerConnector(name, config = {}) {
  connectors.set(name, {
    name,
    status: config.status || 'not_configured',
    auth: config.auth || null,
    endpoint: config.endpoint || null,
    lastCheck: null,
  });

  return connectors.get(name);
}

export function checkConnector(name) {
  const connector = connectors.get(name);

  if (!connector) {
    return {
      success: false,
      error: 'connector_not_found',
    };
  }

  connector.lastCheck = new Date().toISOString();

  return {
    success: connector.status === 'connected',
    connector,
  };
}

export function getConnector(name) {
  return connectors.get(name) || null;
}

export function listConnectors() {
  return Array.from(connectors.values());
}

export function normalizeExternalData(payload = {}) {
  return {
    source: payload.source || 'unknown',
    timestamp: new Date().toISOString(),
    data: payload.data || {},
    confidence: Number(payload.confidence || 0),
  };
}
