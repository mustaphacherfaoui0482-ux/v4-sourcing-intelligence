// V4 User Workspace Engine v1
// User workspace management foundation

const workspaces = [];

function createWorkspace(userId, name) {
  const workspace = {
    id: Date.now(),
    userId,
    name,
    projects: [],
    favorites: [],
    searches: [],
    createdAt: new Date().toISOString()
  };

  workspaces.push(workspace);
  return workspace;
}

function addProject(workspaceId, project) {
  const workspace = workspaces.find(w => w.id === workspaceId);
  if (!workspace) return null;

  workspace.projects.push(project);
  return workspace;
}

function saveSearch(workspaceId, search) {
  const workspace = workspaces.find(w => w.id === workspaceId);
  if (!workspace) return null;

  workspace.searches.push(search);
  return workspace;
}

function addFavorite(workspaceId, item) {
  const workspace = workspaces.find(w => w.id === workspaceId);
  if (!workspace) return null;

  workspace.favorites.push(item);
  return workspace;
}

function getWorkspace(workspaceId) {
  return workspaces.find(w => w.id === workspaceId) || null;
}

module.exports = {
  createWorkspace,
  addProject,
  saveSearch,
  addFavorite,
  getWorkspace
};