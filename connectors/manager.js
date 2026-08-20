/**
 * V4 Sourcing Intelligence — Connector Manager v1
 * Manages connector health without blocking the Radar.
 */

export function checkConnector(connector) {
  if (!connector) {
    return {
      status: 'error',
      message: 'connector_missing'
    };
  }

  const status = connector.status || 'manual';

  return {
    name: connector.name,
    category: connector.category,
    status,
    available: status === 'connected',
    requiresSetup: status === 'manual' || status === 'to_configure'
  };
}

export function checkAllConnectors(connectors = []) {
  return connectors.map(checkConnector);
}

export function getAvailableConnectors(connectors = []) {
  return connectors.filter(connector => connector.status === 'connected');
}
