// V4 Security Permission Engine v1

const roles = {
  admin: ['read','write','manage'],
  analyst: ['read','analyze'],
  viewer: ['read']
};

const users = [];

function createUser(user) {
  const account = {
    id: Date.now(),
    role: user.role || 'viewer',
    name: user.name || 'unknown'
  };
  users.push(account);
  return account;
}

function checkPermission(role, permission) {
  return (roles[role] || []).includes(permission);
}

function getUsers() {
  return users;
}

function getStatus() {
  return {
    module: 'v4-security-permission-engine',
    version: '1.0.0',
    users: users.length
  };
}

module.exports = {
  createUser,
  checkPermission,
  getUsers,
  getStatus
};
