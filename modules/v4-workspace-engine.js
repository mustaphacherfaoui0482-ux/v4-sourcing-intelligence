/**
 * V4 Sourcing Intelligence — Workspace Engine v1
 * Multi workspace foundation. No authentication provider in V1.
 */

const workspaces = [];

export function createWorkspace({ name, ownerId }) {
  const workspace = {
    id: `ws_${Date.now()}`,
    name,
    ownerId,
    members: [ownerId],
    projects: [],
    createdAt: new Date().toISOString(),
  };

  workspaces.push(workspace);
  return workspace;
}

export function addMember(workspaceId, userId) {
  const workspace = workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return null;

  if (!workspace.members.includes(userId)) {
    workspace.members.push(userId);
  }

  return workspace;
}

export function getWorkspace(workspaceId) {
  return workspaces.find((item) => item.id === workspaceId) || null;
}

export function listWorkspaces() {
  return workspaces;
}
