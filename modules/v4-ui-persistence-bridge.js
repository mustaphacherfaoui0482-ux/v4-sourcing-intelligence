/** V4 UI persistence bridge v3 — keeps Radar + evidence state recoverable. */
import { saveState, loadState } from './v4-persistence.js';

const FIELD_IDS = ['product','country','budget','sale','margin','moq','constraints','p','c','pack','ship','customs','other','fees','cac','sampleStatus','qc','demandScore','sourcingScore','riskScore','confidenceScore'];

export function captureRadarState(root = document) {
  const state = {};
  for (const id of FIELD_IDS) {
    const el = root.getElementById?.(id);
    if (el) state[id] = el.value;
  }
  return state;
}

export function restoreRadarState(root = document) {
  const state = loadState('radar', null);
  if (!state) return false;
  for (const [id, value] of Object.entries(state)) {
    const el = root.getElementById?.(id);
    if (el) el.value = value;
  }
  return true;
}

export function bindRadarPersistence(root = document) {
  restoreRadarState(root);
  const save = () => saveState('radar', captureRadarState(root));
  for (const id of FIELD_IDS) {
    const el = root.getElementById?.(id);
    if (el) { el.addEventListener('input', save); el.addEventListener('change', save); }
  }
  return save;
}

function loadPremiumStyles() {
  if (document.getElementById('v4-premium-css')) return;
  const link = document.createElement('link');
  link.id = 'v4-premium-css';
  link.rel = 'stylesheet';
  link.href = './v4-premium-shell.css?v=2';
  document.head.appendChild(link);
}

if (typeof document !== 'undefined') {
  loadPremiumStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => bindRadarPersistence());
  else bindRadarPersistence();
}
