import { renderAlibabaImport } from './alibaba-import.js';

function mount() {
  try {
    renderAlibabaImport(document);
    const panel = document.querySelector('[data-v4-alibaba-import]');
    document.documentElement.dataset.v4AlibabaUi = panel ? 'ready' : 'missing-anchor';
    if (panel) mountQuickAction(panel);
  } catch (error) {
    document.documentElement.dataset.v4AlibabaUi = 'error';
    console.error('[V4 Alibaba] UI bootstrap failed', error);
  }
}

function focusAlibabaUrl(panel) {
  const input = panel?.querySelector('[data-alibaba-field="url"]');
  if (!input) return false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => {
    input.focus({ preventScroll: true });
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
  return true;
}

function mountQuickAction(panel) {
  if (document.querySelector('[data-v4-alibaba-quick-action]')) return;
  const actions = document.querySelector('.hero .actions');
  if (!actions) return;
  const button = document.createElement('button');
  button.className = 'btn primary';
  button.type = 'button';
  button.dataset.v4AlibabaQuickAction = 'true';
  button.textContent = '＋ Import Alibaba';
  button.addEventListener('click', () => {
    const currentPanel = document.querySelector('[data-v4-alibaba-import]') || panel;
    if (!currentPanel) {
      mount();
      return;
    }
    if (!focusAlibabaUrl(currentPanel)) {
      currentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  actions.prepend(button);
}

function wireQuickActionFallback() {
  if (document.documentElement.dataset.v4AlibabaQuickActionFix === 'ready') return;
  document.documentElement.dataset.v4AlibabaQuickActionFix = 'ready';
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-v4-alibaba-quick-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const panel = document.querySelector('[data-v4-alibaba-import]');
    if (panel) focusAlibabaUrl(panel);
    else mount();
  }, true);
}

function wireRadarNavigation() {
  if (document.documentElement.dataset.v4RadarNavigationFix === 'ready') return;
  document.documentElement.dataset.v4RadarNavigationFix = 'ready';
  document.addEventListener('click', (event) => {
    const link = event.target?.closest?.('.nav a');
    if (!link || !/Radar Sourcing/i.test(link.textContent || '')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelectorAll('.nav a').forEach((x) => x.classList.remove('on'));
    link.classList.add('on');
    const target = document.querySelector('[data-v4-alibaba-import]') || document.querySelector('.radar');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
}

function boot() {
  mount();
  wireQuickActionFallback();
  wireRadarNavigation();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
