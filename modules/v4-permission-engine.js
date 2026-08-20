/**
 * V4 Sourcing Intelligence — Permission Engine v1
 * Role based access control foundation.
 */

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
};

const PERMISSIONS = {
  owner: ['workspace.manage', 'users.manage', 'data.write', 'data.read', 'decisions.manage'],
  admin: ['users.manage', 'data.write', 'data.read', 'decisions.manage'],
  analyst: ['data.write', 'data.read', 'decisions.read'],
  viewer: ['data.read', 'decisions.read'],
};

export function hasPermission(role, permission) {
  return Boolean(PERMISSIONS[role]?.includes(permission));
}

export function getRolePermissions(role) {
  return PERMISSIONS[role] || [];
}

export { ROLES, PERMISSIONS };
