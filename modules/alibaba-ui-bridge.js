import { renderAlibabaImport } from './alibaba-import.js';

// Explicit UI bootstrap: guarantees the Alibaba import panel is mounted after the dashboard DOM exists.
function mount() {
  try {
    renderAlibabaImport(document);
    document.documentElement.dataset.v4AlibabaUi = document.querySelector('[data-v4-alibaba-import]') ? 'ready' : 'missing-anchor';
  } catch (error) {
    document.documentElement.dataset.v4AlibabaUi = 'error';
    console.error('[V4 Alibaba] UI bootstrap failed', error);
  }
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
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
