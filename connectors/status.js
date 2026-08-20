// V4 Sourcing Intelligence - Connector Status

export const CONNECTOR_STATUS = {
  READY: 'ready',
  TEST_REQUIRED: 'test_required',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

export function getConnectorStatus(name, status) {
  return {
    name,
    status,
    checkedAt: new Date().toISOString()
  };
}
