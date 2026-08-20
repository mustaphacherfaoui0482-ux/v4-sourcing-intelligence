/**
 * V4 Sourcing Intelligence — Audit Log Engine v1
 * Tracks important workspace actions.
 */

const logs = [];

export function createAuditLog({ actor, action, target, metadata = {} }) {
  const entry = {
    id: `audit_${Date.now()}`,
    actor: actor || 'system',
    action,
    target,
    metadata,
    timestamp: new Date().toISOString(),
  };

  logs.push(entry);
  return entry;
}

export function getAuditLogs(filters = {}) {
  return logs.filter((log) => {
    if (filters.actor && log.actor !== filters.actor) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.target && log.target !== filters.target) return false;
    return true;
  });
}

export function clearAuditLogs() {
  logs.length = 0;
}
