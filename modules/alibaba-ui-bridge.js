import { renderAlibabaImport } from './alibaba-import.js';
import { EMPTY_OPPORTUNITY, initDashboardRuntime } from './dashboard-runtime.js';
import { mountManualCompletion } from './v4-manual-completion.js';

function resetStaleEmptyOpportunity() {
  try {
    const raw = localStorage.getItem('v4-sourcing.active-opportunity.v1');
    if (!raw) return;
    const value = JSON.parse(raw);
    if (value?.product === 'Aucune opportunité active') localStorage.removeItem('v4-sourcing.active-opportunity.v1');
  } catch {}
}

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
    if (!currentPanel) return mount();
    if (!focusAlibabaUrl(currentPanel)) currentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (panel) focusAlibabaUrl(panel); else mount();
  }, true);
}

function focusRadar() {
  const target = document.querySelector('.radar');
  if (!target) return false;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.animate(
    [
      { outline: '2px solid transparent', outlineOffset: '6px' },
      { outline: '2px solid var(--gold)', outlineOffset: '6px' },
      { outline: '2px solid transparent', outlineOffset: '6px' },
    ],
    { duration: 900, easing: 'ease-out' },
  );
  return true;
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
    focusRadar();
  }, true);
}

function remountCompletion(opportunity) {
  if (!opportunity || opportunity.product === 'Aucune opportunité active') return;
  // initDashboardRuntime may rebuild dashboard DOM. Mount completion on the next frame
  // so it survives that render and retains the just-saved values from localStorage.
  window.requestAnimationFrame(() => mountManualCompletion(opportunity));
}

function wireImportRuntimeSync() {
  if (document.documentElement.dataset.v4AlibabaRuntimeSync === 'ready') return;
  document.documentElement.dataset.v4AlibabaRuntimeSync = 'ready';
  document.addEventListener('v4:alibaba-evidence', (event) => {
    const opportunity = event.detail?.opportunity;
    initDashboardRuntime(opportunity || EMPTY_OPPORTUNITY);
    remountCompletion(opportunity);
  });
  document.addEventListener('v4:manual-completion', (event) => {
    const opportunity = event.detail?.opportunity;
    if (!opportunity) return;
    initDashboardRuntime(opportunity);
    remountCompletion(opportunity);
  });
}

function boot() {
  resetStaleEmptyOpportunity();
  mount();
  wireQuickActionFallback();
  wireRadarNavigation();
  wireImportRuntimeSync();
  if (document.documentElement.dataset.v4Runtime === 'ready' && !window.V4SourcingRuntime?.isDemo && window.V4SourcingRuntime?.opportunity?.product === 'Aucune opportunité active') {
    initDashboardRuntime(EMPTY_OPPORTUNITY);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
