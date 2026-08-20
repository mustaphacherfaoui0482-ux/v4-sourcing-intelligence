// V4 Dashboard Architecture Engine v1

const dashboard = {
  sections: [
    'radar',
    'winner-products',
    'suppliers',
    'market-analysis',
    'scores',
    'decisions',
    'history'
  ],
  widgets: [],
  layout: 'control-center'
};

function createWidget(widget) {
  dashboard.widgets.push(widget);
  return widget;
}

function getDashboardArchitecture() {
  return dashboard;
}

function getDashboardSections() {
  return dashboard.sections;
}

module.exports = {
  createWidget,
  getDashboardArchitecture,
  getDashboardSections
};
