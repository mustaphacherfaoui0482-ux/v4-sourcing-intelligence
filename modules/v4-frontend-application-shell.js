// V4 Frontend Application Shell v1
// Architecture layer for Control Center UI

const applicationShell = {
  name: 'V4 Control Center',
  version: '1.0',
  sections: [
    'dashboard',
    'radar',
    'winner-products',
    'suppliers',
    'market-analysis',
    'scores',
    'decisions',
    'history',
    'settings'
  ],
  navigation: [],
  widgets: []
};

function registerNavigation(item) {
  applicationShell.navigation.push(item);
  return item;
}

function registerWidget(widget) {
  applicationShell.widgets.push(widget);
  return widget;
}

function getApplicationShell() {
  return applicationShell;
}

function getNavigation() {
  return applicationShell.navigation;
}

module.exports = {
  registerNavigation,
  registerWidget,
  getApplicationShell,
  getNavigation
};
