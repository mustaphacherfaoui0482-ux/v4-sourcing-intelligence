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

function mountQuickAction(panel) {
  if (document.querySelector('[data-v4-alibaba-quick-action]')) return;
  const actions = document.querySelector('.hero .actions');
  if (!actions) return;
  const button = document.createElement('button');
  button.className = 'btn primary';
  button.type = 'button';
  button.dataset.v4AlibabaQuickAction = 'true';
  button.textContent = '＋ Import Alibaba';
  button.addEventListener('click', () => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  actions.prepend(button);
}

// RED TEAM navigation fix: Radar must open the Radar view without creating a manual P0 opportunity.
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
  wireRadarNavigation();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
